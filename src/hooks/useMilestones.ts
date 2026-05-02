import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import type { Milestone } from '../types';

const CACHE_KEY = 'cache_milestones';

function normalizeMs(m: Milestone): Milestone {
  return { ...m, occurredAt: m.date };
}

export function useMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateSyncTime } = useAppStore();

  const loadFromCache = useCallback(async () => {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      try {
        setMilestones(JSON.parse(raw).map(normalizeMs));
      } catch { /* corrupted cache */ }
    }
  }, []);

  const fetchFromServer = useCallback(async () => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .order('occurred_at', { ascending: false });
    if (error) return;
    // Only overwrite if server returned data
    if (data && data.length > 0) {
      const mapped: Milestone[] = data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.occurred_at,
        category: row.category,
        nodeType: row.node_type,
        metricName: row.metric_name,
        metricValue: row.metric_value,
        media: row.media_urls,
      }));
      setMilestones(mapped.map(normalizeMs));
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
    }
    updateSyncTime('growth');
  }, [updateSyncTime]);

  useEffect(() => {
    (async () => {
      await loadFromCache();
      await fetchFromServer();
      setLoading(false);
    })();
  }, [loadFromCache, fetchFromServer]);

  const addMilestone = useCallback(
    async (ms: Omit<Milestone, 'id'>) => {
      const newMs: Milestone = { ...ms, id: String(Date.now()) };
      setMilestones((prev) => {
        const updated = [normalizeMs(newMs), ...prev.map(normalizeMs)];
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      const { error } = await supabase.from('milestones').insert({
        title: ms.title,
        description: ms.description,
        occurred_at: ms.date,
        category: ms.category,
        node_type: ms.nodeType || 'milestone',
        metric_name: ms.metricName,
        metric_value: ms.metricValue,
        media_urls: ms.media,
      });
      if (error) console.warn('Failed to sync milestone:', error);
    },
    [],
  );

  const updateMilestone = useCallback(async (id: string, updates: Partial<Milestone>) => {
    setMilestones((prev) => {
      const updated = prev.map((m) => {
        if (m.id === id) return normalizeMs({ ...m, ...updates, date: updates.date || m.date });
        return m;
      }).map(normalizeMs);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    const { error } = await supabase.from('milestones').update({
      title: updates.title,
      description: updates.description,
      occurred_at: updates.date,
      category: updates.category,
      node_type: updates.nodeType,
      metric_name: updates.metricName,
      metric_value: updates.metricValue,
      media_urls: updates.media,
    }).eq('id', id);
    if (error) console.warn('Failed to sync milestone update:', error);
  }, []);

  const deleteMilestone = useCallback(async (id: string) => {
    setMilestones((prev) => {
      const updated = prev.filter((m) => m.id !== id).map(normalizeMs);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
    await supabase.from('milestones').delete().eq('id', id);
  }, []);

  return { milestones, loading, addMilestone, updateMilestone, deleteMilestone, refetch: fetchFromServer };
}
