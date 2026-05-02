import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { Svg, Line, Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { useMood } from '../../src/hooks/useMood';

const moodConfig: Record<number, { emoji: string; label: string; color: string }> = {
  5: { emoji: '\u{1F604}', label: '非常好', color: colors.success },
  4: { emoji: '\u{1F60A}', label: '不错', color: colors.info },
  3: { emoji: '\u{1F610}', label: '一般', color: colors.warning },
  2: { emoji: '\u{1F61F}', label: '低落', color: colors.accent },
  1: { emoji: '\u{1F622}', label: '糟糕', color: colors.danger },
};

const triggerOptions = ['工作', '学习', '社交', '运动', '饮食', '睡眠', '天气', '其他'];

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function MoodScreen() {
  const { entries: moodEntries, addEntry } = useMood();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  const toggleTrigger = (t: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleCheckIn = async () => {
    if (selectedMood === null) {
      Alert.alert('提示', '请先选择心情');
      return;
    }
    await addEntry({
      date: new Date().toISOString().split('T')[0],
      moodScore: selectedMood,
      moodLabel: moodConfig[selectedMood]?.label || '',
      note: note.trim(),
      tags: selectedTriggers,
    });
    setSelectedMood(null);
    setNote('');
    setSelectedTriggers([]);
    Alert.alert('成功', '心情已记录');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Mood Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今天的心情如何？</Text>
        <View style={styles.moodRow}>
          {Object.entries(moodConfig).map(([score, config]) => (
            <TouchableOpacity
              key={score}
              style={[
                styles.moodBtn,
                selectedMood === Number(score) && { backgroundColor: config.color + '22', borderWidth: 2, borderColor: config.color },
              ]}
              onPress={() => setSelectedMood(Number(score))}
              activeOpacity={0.7}
            >
              <Text style={styles.moodEmoji}>{config.emoji}</Text>
              <Text style={[styles.moodLabel, { color: config.color }]}>{config.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Triggers */}
      {selectedMood !== null && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>是什么影响了心情？</Text>
          <View style={styles.triggerGrid}>
            {triggerOptions.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.triggerChip, selectedTriggers.includes(t) && { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}
                onPress={() => toggleTrigger(t)}
              >
                <Text style={[styles.triggerText, selectedTriggers.includes(t) && { color: colors.primaryDark }]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="写点什么..."
            multiline
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={styles.checkInBtn} onPress={handleCheckIn}>
            <Text style={styles.checkInText}>记录心情</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Weekly Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>本周趋势</Text>
        <View style={styles.chartCard}>
          <WeeklyChart entries={moodEntries} />
        </View>
      </View>

      {/* Calendar Heatmap */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.calendarHeader} onPress={() => setShowCalendar(true)}>
          <Text style={styles.sectionTitle}>本月情绪日历</Text>
          <Text style={styles.calendarArrow}>{'>'}</Text>
        </TouchableOpacity>
        <HeatmapCalendar entries={moodEntries} />
      </View>

      {/* Recent Entries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近记录</Text>
        {moodEntries.length > 0 ? (
          moodEntries.slice(0, 5).map((entry) => (
            <View key={entry.id || entry.date} style={styles.entryCard}>
              <Text style={styles.entryEmoji}>{moodConfig[entry.moodScore || 3]?.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryDate}>{entry.date}</Text>
                <Text style={styles.entryNote} numberOfLines={1}>{entry.note || '无备注'}</Text>
              </View>
              <Text style={[styles.entryScore, { color: moodConfig[entry.moodScore || 3]?.color }]}>
                {entry.moodScore}/5
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>还没有记录，从上面的心情打卡开始吧</Text>
        )}
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

function WeeklyChart({ entries }: { entries: { date: string; moodScore: number }[] }) {
  // Build last 7 days (Mon-Sun) data from entries
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - mondayOffset + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayLabel: WEEK_DAYS[d.getDay()],
    };
  });

  const data = weekDays.map((wd) => {
    const entry = entries.find((e) => e.date === wd.dateStr);
    return { day: wd.dayLabel, score: entry ? entry.moodScore : 0 };
  });

  const chartW = 280;
  const chartH = 120;
  const barW = 24;
  const gap = (chartW - data.length * barW) / (data.length + 1);

  if (data.every((d) => d.score === 0)) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Text style={styles.chartEmpty}>本周还没有记录</Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={chartW} height={chartH}>
        {/* Grid lines */}
        {[1, 2, 3, 4, 5].map((s) => {
          const y = chartH - (s / 5) * (chartH - 30);
          return <Line key={s} x1="0" y1={y} x2={chartW} y2={y} stroke={colors.borderLight} strokeWidth={0.5} strokeDasharray="3,3" />;
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const x = gap + i * (barW + gap);
          if (d.score === 0) return null;
          const barH = (d.score / 5) * (chartH - 30);
          const y = chartH - barH;
          const c = moodConfig[d.score]?.color || colors.textMuted;
          return (
            <G key={d.day}>
              <Rect x={x} y={y} width={barW} height={barH} fill={c + '66'} rx={4} />
              <Rect x={x} y={y} width={barW} height={4} fill={c} rx={2} />
              <SvgText x={x + barW / 2} y={chartH - 8} fontSize={10} fill={colors.textSecondary} textAnchor="middle">{d.day}</SvgText>
            </G>
          );
        })}
      </Svg>
      <View style={styles.chartLegend}>
        {Object.entries(moodConfig).map(([score, config]) => (
          <View key={score} style={styles.legendItem}>
            <Text style={{ fontSize: 10 }}>{config.emoji}</Text>
            <Text style={[styles.legendText, { color: config.color }]}>{config.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HeatmapCalendar({ entries }: { entries: { date: string; moodScore: number }[] }) {
  // Get current month days, show only days that have entries
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayMap: Record<string, number> = {};
  entries.forEach((e) => {
    const entryDay = parseInt(e.date.split('-')[2], 10);
    const entryMonth = parseInt(e.date.split('-')[1], 10);
    if (entryMonth === now.getMonth() + 1) {
      dayMap[entryDay] = e.moodScore;
    }
  });

  const hasData = Object.keys(dayMap).length > 0;

  if (!hasData) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Text style={styles.chartEmpty}>本月还没有记录</Text>
      </View>
    );
  }

  return (
    <View style={styles.heatmapGrid}>
      {Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const score = dayMap[day] || 0;
        const c = score > 0 ? moodConfig[score]?.color || colors.textMuted : colors.surfaceAlt;
        return (
          <View key={day} style={[styles.heatmapCell, { backgroundColor: score > 0 ? c + '33' : colors.surfaceAlt }]}>
            <Text style={[styles.heatmapDay, { color: score > 3 ? colors.text : score > 0 ? colors.textSecondary : colors.textMuted }]}>
              {day}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: { flex: 1, alignItems: 'center', padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'transparent' },
  moodEmoji: { fontSize: 28 },
  moodLabel: { ...typography.caption, marginTop: spacing.xs },
  triggerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  triggerChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  triggerText: { ...typography.caption, color: colors.textSecondary },
  noteInput: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, ...typography.body, minHeight: 60, marginTop: spacing.md },
  checkInBtn: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' },
  checkInText: { ...typography.label, color: '#fff', fontWeight: '600' },
  chartCard: { ...shadows.card, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md },
  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  chartEmpty: { ...typography.bodySm, color: colors.textMuted },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendText: { ...typography.caption, marginLeft: spacing.xs },
  emptyText: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calendarArrow: { ...typography.label, color: colors.textMuted },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm },
  heatmapCell: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  heatmapDay: { fontSize: 9, fontWeight: '500' },
  entryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, ...shadows.card },
  entryEmoji: { fontSize: 24, marginRight: spacing.md },
  entryDate: { ...typography.label, color: colors.text },
  entryNote: { ...typography.caption, color: colors.textSecondary },
  entryScore: { ...typography.label, fontWeight: '600' },
});
