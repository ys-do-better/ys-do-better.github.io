import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import type { MoodEntry } from '../types';

const CACHE_KEY = 'cache_mood';

function normalizeEntry(e: MoodEntry): MoodEntry {
  return { ...e, entryDate: e.date };
}

export function useMood() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateSyncTime } = useAppStore();

  const loadFromCache = useCallback(async () => {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      try {
        setEntries(JSON.parse(raw).map(normalizeEntry));
      } catch {
        // corrupted cache
      }
    }
  }, []);

  const fetchFromServer = useCallback(async () => {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .limit(30);
    if (error) {
      return;
    }
    const mapped: MoodEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      date: row.entry_date,
      moodScore: row.mood_score,
      moodLabel: row.mood_label,
      note: row.note,
      tags: row.triggers || [],
    }));
    // Only overwrite state/cache if server returned data
    if (mapped.length > 0) {
      setEntries(mapped.map(normalizeEntry));
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
    }
    updateSyncTime('mood');
  }, [updateSyncTime]);

  const loadFromCacheMemo = useMemo(() => loadFromCache, [loadFromCache]);
  const fetchFromServerMemo = useMemo(() => fetchFromServer, [fetchFromServer]);

  useEffect(() => {
    (async () => {
      await loadFromCache();
      await fetchFromServer();
      setLoading(false);
    })();
  }, [loadFromCache, fetchFromServer]);

  const addEntry = useCallback(
    async (entry: Omit<MoodEntry, 'id'>) => {
      const newEntry: MoodEntry = { ...entry, id: String(Date.now()) };
      setEntries((prev) => {
        const existing = prev.some((e) => e.date === entry.date);
        const updated = existing
          ? prev.map((e) => (e.date === entry.date ? normalizeEntry(newEntry) : e))
          : [normalizeEntry(newEntry), ...prev];
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      const { error } = await supabase
        .from('mood_entries')
        .upsert({
          entry_date: entry.date,
          mood_score: entry.moodScore,
          mood_label: entry.moodLabel,
          note: entry.note,
          triggers: entry.tags,
        })
        .select()
        .single();
      if (error) console.warn('Failed to sync mood entry:', error);
    },
    [],
  );

  const deleteEntry = useCallback(async (id: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id).map(normalizeEntry);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
    await supabase.from('mood_entries').delete().eq('id', id);
  }, []);

  return { entries, loading, addEntry, deleteEntry, refetch: fetchFromServer };
}
