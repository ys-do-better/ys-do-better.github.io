import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Svg, Circle, Path, G, Line, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { useHealth } from '../../src/hooks/useHealth';
import type { HealthRecord } from '../../src/types';

const DEFAULT_FOCUS_MINUTES = 25;

export default function HealthScreen() {
  const { records: healthRecords, addRecord, deleteRecord } = useHealth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFn, setDeleteFn] = useState<(() => void) | null>(null);
  const [editSleep, setEditSleep] = useState('');
  const [editSteps, setEditSteps] = useState('');
  const [editWater, setEditWater] = useState('');
  const [editHeart, setEditHeart] = useState('');
  const [editDeepWork, setEditDeepWork] = useState('');
  const [editDate, setEditDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddRecord = () => {
    const sleepHours = parseFloat(editSleep) || undefined;
    const steps = parseInt(editSteps, 10) || undefined;
    const waterIntakeMl = parseInt(editWater, 10) || undefined;
    const restingHeartRate = parseInt(editHeart, 10) || undefined;
    const deepWorkMinutes = parseInt(editDeepWork, 10) || undefined;

    if (!sleepHours && !steps && !waterIntakeMl && !restingHeartRate) return;

    addRecord({
      date: editDate,
      sleepHours,
      steps,
      restingHeartRate,
      waterIntakeMl,
      deepWorkMinutes,
    });
    setShowAddForm(false);
    setEditSleep('');
    setEditSteps('');
    setEditWater('');
    setEditHeart('');
    setEditDeepWork('');
    setEditDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(true);
    setDeleteFn(() => () => deleteRecord(id));
  };

  const latest = healthRecords.length > 0 ? healthRecords[0] : null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Dashboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>今日概览</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => setShowAddForm(true)}>
              <Text style={styles.addBtnSmallText}>+ 记录</Text>
            </TouchableOpacity>
          </View>
          {latest ? (
            <View style={styles.dashboardGrid}>
              <DashboardCard icon={'\u{1F30A}'} label="睡眠" value={`${latest.sleepHours || '--'}h`} color={colors.info} />
              <DashboardCard icon={'\u{1F3C3}'} label="步数" value={latest.steps ? `${latest.steps.toLocaleString()}` : '--'} color={colors.success} />
              <DashboardCard icon={'\u{1F4A7}'} label="饮水" value={latest.waterIntakeMl ? `${(latest.waterIntakeMl / 1000).toFixed(1)}L` : '--'} color={colors.health} />
              <DashboardCard icon={'\u{2764}\u{FE0F}'} label="心率" value={latest.restingHeartRate ? `${latest.restingHeartRate}` : '--'} color={colors.danger} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>还没有健康记录，点击上方"+ 记录"开始</Text>
            </View>
          )}
        </View>

        {/* Deep Work */}
        {latest && latest.deepWorkMinutes !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>深度工作</Text>
            <View style={styles.deepWorkCard}>
              <Text style={styles.deepWorkValue}>{latest.deepWorkMinutes} 分钟</Text>
              <Text style={styles.deepWorkLabel}>今日专注时间</Text>
            </View>
          </View>
        )}

        {/* Focus Timer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>专注计时器</Text>
          <FocusTimer />
        </View>

        {/* Sleep Chart */}
        {healthRecords.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>睡眠趋势</Text>
            <View style={styles.chartCard}>
              <SleepChart records={healthRecords.slice(0, 7).reverse()} />
            </View>
          </View>
        )}

        {/* Recent Records */}
        {healthRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最近记录</Text>
            {healthRecords.slice(0, 10).map((r) => (
              <TouchableOpacity key={r.id} style={styles.recordCard} onLongPress={() => handleDelete(r.id)}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDate}>{r.date}</Text>
                  <Text style={styles.recordDetail}>
                    {r.sleepHours ? `睡眠 ${r.sleepHours}h  ` : ''}
                    {r.steps ? `步数 ${r.steps}  ` : ''}
                    {r.waterIntakeMl ? `饮水 ${(r.waterIntakeMl / 1000).toFixed(1)}L  ` : ''}
                    {r.restingHeartRate ? `心率 ${r.restingHeartRate}  ` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Overlay form - using View instead of Modal for web compatibility */}
      {showAddForm && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>添加健康记录</Text>
            <Text style={styles.modalLabel}>日期</Text>
            <TextInput style={styles.modalInput} value={editDate} onChangeText={setEditDate} placeholder="YYYY-MM-DD" />
            <Text style={styles.modalLabel}>睡眠时长（小时）</Text>
            <TextInput style={styles.modalInput} value={editSleep} onChangeText={setEditSleep} placeholder="如：7.5" keyboardType="decimal-pad" />
            <Text style={styles.modalLabel}>步数</Text>
            <TextInput style={styles.modalInput} value={editSteps} onChangeText={setEditSteps} placeholder="如：8500" keyboardType="number-pad" />
            <Text style={styles.modalLabel}>饮水量（ml）</Text>
            <TextInput style={styles.modalInput} value={editWater} onChangeText={setEditWater} placeholder="如：2000" keyboardType="number-pad" />
            <Text style={styles.modalLabel}>静息心率（bpm）</Text>
            <TextInput style={styles.modalInput} value={editHeart} onChangeText={setEditHeart} placeholder="如：68" keyboardType="number-pad" />
            <Text style={styles.modalLabel}>深度工作时长（分钟）</Text>
            <TextInput style={styles.modalInput} value={editDeepWork} onChangeText={setEditDeepWork} placeholder="如：270" keyboardType="number-pad" />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddRecord}>
              <Text style={styles.modalSaveText}>保存记录</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddForm(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Delete Confirm Overlay */}
      {showDeleteConfirm && (
        <View style={styles.deleteOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.deleteDialog}>
            <Text style={styles.deleteDialogTitle}>确认删除</Text>
            <Text style={styles.deleteDialogText}>确定删除此记录？</Text>
            <View style={styles.deleteBtnRow}>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => { setShowDeleteConfirm(false); setDeleteFn(null); }}>
                <Text style={styles.deleteCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={() => {
                if (deleteFn) deleteFn();
                setShowDeleteConfirm(false); setDeleteFn(null);
              }}>
                <Text style={styles.deleteConfirmText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function DashboardCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.dashCard}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[styles.dashValue, { color }]}>{value}</Text>
      <Text style={styles.dashLabel}>{label}</Text>
    </View>
  );
}

function FocusTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_MINUTES * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const [showSetTime, setShowSetTime] = useState(false);
  const [editMinutes, setEditMinutes] = useState('');

  const isRunningRef = React.useRef(false);
  const intervalRef = React.useRef<any>(null);
  const totalSeconds = focusMinutes * 60;

  // Setup interval ONCE on mount, never recreate it
  React.useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!isRunningRef.current) return;
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          isRunningRef.current = false;
          setIsRunning(false);
          setSessionCount((c) => c + 1);
          return focusMinutesRef.current * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Sync focusMinutes ref for when timer completes
  const focusMinutesRef = React.useRef(focusMinutes);
  React.useEffect(() => {
    focusMinutesRef.current = focusMinutes;
  }, [focusMinutes]);

  const progress = secondsLeft / totalSeconds;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const handleSetTime = () => {
    const m = parseInt(editMinutes, 10);
    if (m > 0 && m <= 180) {
      setFocusMinutes(m);
      setSecondsLeft(m * 60);
      setIsRunning(false);
    }
    setShowSetTime(false);
    setEditMinutes('');
  };

  return (
    <View style={styles.timerCard}>
      {/* Time setting row */}
      <View style={styles.timerSettings}>
        <Text style={styles.timerSettingsLabel}>时长: {focusMinutes} 分钟</Text>
        <TouchableOpacity style={styles.timerSetTimeBtn} onPress={() => { setShowSetTime(true); setEditMinutes(String(focusMinutes)); }}>
          <Text style={styles.timerSetTimeText}>修改</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timerCircleContainer}>
        <Svg width={160} height={160}>
          <Circle cx={80} cy={80} r={radius} fill="none" stroke={colors.surfaceAlt} strokeWidth={8} />
          <Circle
            cx={80} cy={80} r={radius} fill="none"
            stroke={isRunning ? colors.primary : colors.growth}
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
        </Svg>
        <View style={styles.timerTextOverlay}>
          <Text style={styles.timerTime}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
          <Text style={styles.timerLabel}>
            {isRunning ? '专注中' : secondsLeft === totalSeconds ? '准备开始' : '已暂停'}
          </Text>
        </View>
      </View>
      <View style={styles.timerControls}>
        {!isRunning ? (
          <TouchableOpacity style={styles.timerStartBtn} onPress={() => secondsLeft > 0 && setIsRunning(true)}>
            <Text style={styles.timerStartText}>{secondsLeft === totalSeconds ? '开始专注' : '继续'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.timerPauseBtn} onPress={() => setIsRunning(false)}>
            <Text style={styles.timerPauseText}>暂停</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.timerResetBtn} onPress={() => { setIsRunning(false); setSecondsLeft(focusMinutes * 60); }}>
          <Text style={styles.timerResetText}>重置</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sessionCount}>已完成 {sessionCount} 个番茄钟</Text>

      {/* Set time modal */}
      {showSetTime && (
        <View style={styles.setTimeOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.setTimeSheet}>
            <Text style={styles.setTimeTitle}>设置专注时长（分钟）</Text>
            <View style={styles.presetRow}>
              {[15, 25, 45, 60].map((m) => (
                <TouchableOpacity key={m} style={[styles.presetBtn, parseInt(editMinutes, 10) === m && { backgroundColor: colors.primaryBg, borderColor: colors.primary }]} onPress={() => setEditMinutes(String(m))}>
                  <Text style={[styles.presetText, parseInt(editMinutes, 10) === m && { color: colors.primaryDark }]}>{m} min</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.setTimeInput} value={editMinutes} onChangeText={setEditMinutes} placeholder="自定义分钟数" keyboardType="number-pad" />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSetTime}>
              <Text style={styles.modalSaveText}>确定</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowSetTime(false); setEditMinutes(''); }}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function SleepChart({ records }: { records: HealthRecord[] }) {
  const chartW = 300;
  const chartH = 120;
  const pad = { l: 30, r: 10, t: 10, b: 25 };
  const innerW = chartW - pad.l - pad.r;
  const innerH = chartH - pad.t - pad.b;

  const maxSleep = 10;
  const minSleep = 4;

  const toY = (hours: number) => pad.t + innerH - ((hours - minSleep) / (maxSleep - minSleep)) * innerH;

  const linePath = records.map((r, i) => {
    const x = pad.l + (i / Math.max(records.length - 1, 1)) * innerW;
    return `${i === 0 ? 'M' : 'L'} ${x} ${toY(r.sleepHours || 0)}`;
  }).join(' ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={chartW} height={chartH}>
        {[5, 6, 7, 8, 9].map((h) => (
          <Line key={h} x1={pad.l} y1={toY(h)} x2={chartW - pad.r} y2={toY(h)} stroke={colors.borderLight} strokeWidth={0.5} strokeDasharray="3,3" />
        ))}
        <Path d={linePath} fill="none" stroke={colors.info} strokeWidth={2.5} />
        {records.map((r, i) => {
          const x = pad.l + (i / Math.max(records.length - 1, 1)) * innerW;
          return <Circle key={r.id} cx={x} cy={toY(r.sleepHours || 0)} r={4} fill={colors.info} stroke={colors.surface} strokeWidth={2} />;
        })}
        {records.map((r, i) => {
          const x = pad.l + (i / Math.max(records.length - 1, 1)) * innerW;
          const date = r.date?.slice(5) || '';
          return <SvgText key={r.id} x={x} y={chartH - 5} fontSize={9} fill={colors.textMuted} textAnchor="middle">{date}</SvgText>;
        })}
        <SvgText x={pad.l - 5} y={toY(8) + 4} fontSize={9} fill={colors.textMuted} textAnchor="end">h</SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  addBtnSmall: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primaryBg, borderRadius: borderRadius.sm },
  addBtnSmallText: { ...typography.caption, color: colors.primaryDark, fontWeight: '500' },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dashCard: { width: '48%', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', ...shadows.card },
  dashValue: { ...typography.h2, fontWeight: '700', marginVertical: spacing.xs },
  dashLabel: { ...typography.caption, color: colors.textMuted },
  emptyCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.xl, alignItems: 'center', ...shadows.card },
  emptyText: { ...typography.bodySm, color: colors.textMuted },
  deepWorkCard: { ...shadows.card, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center' },
  deepWorkValue: { ...typography.h1, fontWeight: '700', color: colors.health },
  deepWorkLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  timerCard: { ...shadows.card, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', position: 'relative' },
  timerSettings: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: spacing.sm },
  timerSettingsLabel: { ...typography.label, color: colors.textMuted },
  timerSetTimeBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.sm },
  timerSetTimeText: { ...typography.caption, color: colors.textSecondary },
  timerCircleContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  timerTextOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  timerTime: { ...typography.h1, fontWeight: '700', color: colors.text },
  timerLabel: { ...typography.caption, color: colors.textMuted },
  timerControls: { flexDirection: 'row', gap: spacing.md },
  timerStartBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: borderRadius.sm },
  timerStartText: { ...typography.label, color: '#fff', fontWeight: '600' },
  timerPauseBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.warning, borderRadius: borderRadius.sm },
  timerPauseText: { ...typography.label, color: '#fff', fontWeight: '600' },
  timerResetBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.sm },
  timerResetText: { ...typography.label, color: colors.textSecondary },
  sessionCount: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
  chartCard: { ...shadows.card, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md },
  recordCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, ...shadows.card },
  recordLeft: { flex: 1 },
  recordDate: { ...typography.label, color: colors.text, fontWeight: '600' },
  recordDetail: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.xs },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 100 },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  modalTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  modalLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: spacing.md, ...typography.body, minHeight: 44 },
  modalSaveBtn: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.sm, alignItems: 'center' },
  modalSaveText: { ...typography.label, color: '#fff', fontWeight: '500' },
  modalCancelBtn: { marginTop: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.sm, alignItems: 'center' },
  modalCancelText: { ...typography.label, color: colors.textSecondary, fontWeight: '500' },
  setTimeOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: borderRadius.md },
  setTimeSheet: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, width: '90%' },
  setTimeTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  presetRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  presetBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border },
  presetText: { ...typography.label, color: colors.textSecondary },
  setTimeInput: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: spacing.md, ...typography.body, textAlign: 'center', marginBottom: spacing.md },
  deleteOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  deleteDialog: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, width: '80%', maxWidth: 320 },
  deleteDialogTitle: { ...typography.h3, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  deleteDialogText: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.lg },
  deleteBtnRow: { flexDirection: 'row', gap: spacing.md },
  deleteCancelBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.md, alignItems: 'center' },
  deleteCancelText: { ...typography.label, color: colors.textSecondary },
  deleteConfirmBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.danger, borderRadius: borderRadius.md, alignItems: 'center' },
  deleteConfirmText: { ...typography.label, color: '#fff', fontWeight: '500' },
});
