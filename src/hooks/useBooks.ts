import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import type { Book } from '../types';

const CACHE_KEY = 'cache_books';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateSyncTime } = useAppStore();

  const loadFromCache = useCallback(async () => {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      try {
        setBooks(JSON.parse(raw));
      } catch { /* corrupted cache */ }
    }
  }, []);

  const fetchFromServer = useCallback(async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return;
    // Only overwrite if server returned data
    if (data && data.length > 0) {
      const mapped: Book[] = data.map((row: any) => ({
        id: row.id,
        isbn: row.isbn,
        title: row.title,
        author: row.author,
        publisher: row.publisher,
        coverImage: row.cover_url,
        totalPages: row.total_pages,
        currentPage: row.current_page,
        status: row.status,
        progress: row.total_pages
          ? Math.round(((row.current_page || 0) / row.total_pages) * 100)
          : 0,
      }));
      setBooks(mapped);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
    }
    updateSyncTime('books');
  }, [updateSyncTime]);

  useEffect(() => {
    (async () => {
      await loadFromCache();
      await fetchFromServer();
      setLoading(false);
    })();
  }, [loadFromCache, fetchFromServer]);

  const updateProgress = useCallback(
    async (bookId: string, currentPage: number) => {
      setBooks((prev) => {
        const book = prev.find((b) => b.id === bookId);
        if (!book) return prev;
        const updated = prev.map((b) =>
          b.id === bookId
            ? {
                ...b,
                currentPage,
                progress: b.totalPages
                  ? Math.round((currentPage / b.totalPages) * 100)
                  : 0,
                status: currentPage > 0 ? 'reading' : b.status,
              }
            : b,
        );
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      const { error } = await supabase
        .from('books')
        .update({ current_page: currentPage })
        .eq('id', bookId);
      if (error) console.warn('Failed to sync book progress:', error);
    },
    [],
  );

  const addBook = useCallback(
    async (book: Omit<Book, 'id'>) => {
      const newBook: Book = { ...book, id: String(Date.now()) };
      setBooks((prev) => {
        const updated = [newBook, ...prev];
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      const { error } = await supabase.from('books').insert({
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        status: book.status,
        total_pages: book.totalPages,
        current_page: book.currentPage || 0,
      });
      if (error) console.warn('Failed to sync book:', error);
    },
    [],
  );

  const updateBook = useCallback(async (bookId: string, updates: Partial<Book>) => {
    setBooks((prev) => {
      const updated = prev.map((b) => {
        if (b.id === bookId) {
          const merged = { ...b, ...updates };
          if (merged.totalPages && merged.currentPage !== undefined) {
            merged.progress = Math.round((merged.currentPage / merged.totalPages) * 100);
          }
          return merged;
        }
        return b;
      });
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    const { error } = await supabase.from('books').update({
      title: updates.title,
      author: updates.author,
      status: updates.status,
      total_pages: updates.totalPages,
      current_page: updates.currentPage,
    }).eq('id', bookId);
    if (error) console.warn('Failed to sync book update:', error);
  }, []);

  const deleteBook = useCallback(async (bookId: string) => {
    setBooks((prev) => {
      const updated = prev.filter((b) => b.id !== bookId);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
    await supabase.from('books').delete().eq('id', bookId);
  }, []);

  return { books, loading, updateProgress, addBook, updateBook, deleteBook, refetch: fetchFromServer };
}
