import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import type { HealthRecord, Supplement } from '../types';

const CACHE_KEY_RECORDS = 'cache_health_records';
const CACHE_KEY_SUPPLEMENTS = 'cache_supplements';

function normalizeRecord(r: HealthRecord): HealthRecord {
  return { ...r, recordDate: r.date, deepWorkMinutes: r.deepWorkMinutes ?? r.deepWorkHours };
}

function normalizeSupplement(s: Supplement): Supplement {
  return { ...s, id: s.id || s.name };
}

export function useHealth() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateSyncTime } = useAppStore();

  const fetchData = useCallback(async () => {
    // Load cache first - this is the source of truth
    const cachedRecords = await AsyncStorage.getItem(CACHE_KEY_RECORDS);
    if (cachedRecords) {
      try {
        const parsed = JSON.parse(cachedRecords);
        setRecords(parsed.map(normalizeRecord));
      } catch { /* corrupted cache */ }
    }
    const cachedSupplements = await AsyncStorage.getItem(CACHE_KEY_SUPPLEMENTS);
    if (cachedSupplements) {
      try {
        const parsed = JSON.parse(cachedSupplements);
        setSupplements(parsed.map(normalizeSupplement));
      } catch { /* corrupted cache */ }
    }

    // Fetch from server - only update if we got data
    const { data: healthData, error: healthError } = await supabase
      .from('health_records')
      .select('*')
      .order('record_date', { ascending: false })
      .limit(30);
    if (!healthError && healthData && healthData.length > 0) {
      const mapped: HealthRecord[] = healthData.map((row: any) => ({
        id: row.id,
        date: row.record_date,
        sleepHours: row.sleep_hours,
        steps: row.steps,
        restingHeartRate: row.resting_heart_rate,
        waterIntakeMl: row.water_intake_ml,
        deepWorkHours: row.deep_work_minutes
          ? Math.round(row.deep_work_minutes / 60 * 10) / 10
          : undefined,
        deepWorkMinutes: row.deep_work_minutes,
      }));
      setRecords(mapped.map(normalizeRecord));
      await AsyncStorage.setItem(CACHE_KEY_RECORDS, JSON.stringify(mapped));
    }

    const { data: suppData, error: suppError } = await supabase
      .from('supplements')
      .select('*')
      .eq('enabled', true);
    if (!suppError && suppData && suppData.length > 0) {
      const mapped = suppData.map((s: any) => ({ id: s.id || s.name, name: s.name, taken: false, dailyReminderTime: s.reminder_time, enabled: s.enabled }));
      setSupplements(mapped.map(normalizeSupplement));
      await AsyncStorage.setItem(CACHE_KEY_SUPPLEMENTS, JSON.stringify(mapped));
    }

    updateSyncTime('health');
    setLoading(false);
  }, [updateSyncTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addRecord = useCallback(async (record: Omit<HealthRecord, 'id'>) => {
    const newRecord: HealthRecord = { ...record, id: String(Date.now()) };
    setRecords((prev) => {
      const updated = [newRecord, ...prev].map(normalizeRecord);
      AsyncStorage.setItem(CACHE_KEY_RECORDS, JSON.stringify(updated));
      return updated;
    });

    const { error } = await supabase.from('health_records').insert({
      record_date: record.date,
      sleep_hours: record.sleepHours,
      steps: record.steps,
      resting_heart_rate: record.restingHeartRate,
      water_intake_ml: record.waterIntakeMl,
      deep_work_minutes: record.deepWorkMinutes ?? record.deepWorkHours,
    });
    if (error) console.warn('Failed to sync health record:', error);
  }, []);

  const updateRecord = useCallback(async (id: string, updates: Partial<HealthRecord>) => {
    setRecords((prev) => {
      const updated = prev.map((r) => {
        if (r.id === id) {
          const merged = { ...r, ...updates, date: updates.date || r.date };
          return normalizeRecord(merged);
        }
        return r;
      });
      AsyncStorage.setItem(CACHE_KEY_RECORDS, JSON.stringify(updated));
      return updated;
    });

    const { error } = await supabase.from('health_records').update({
      record_date: updates.date,
      sleep_hours: updates.sleepHours,
      steps: updates.steps,
      resting_heart_rate: updates.restingHeartRate,
      water_intake_ml: updates.waterIntakeMl,
      deep_work_minutes: updates.deepWorkMinutes ?? updates.deepWorkHours,
    }).eq('id', id);
    if (error) console.warn('Failed to sync health record update:', error);
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id).map(normalizeRecord);
      AsyncStorage.setItem(CACHE_KEY_RECORDS, JSON.stringify(updated));
      return updated;
    });
    await supabase.from('health_records').delete().eq('id', id);
  }, []);

  return { records, supplements, loading, refetch: fetchData, addRecord, updateRecord, deleteRecord };
}
