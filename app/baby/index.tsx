import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Platform } from 'react-native';
import { Svg, Circle, Path, G, Text as SvgText, Line } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { usePersistedState } from '../../src/hooks/usePersistedState';

interface BabyMilestone {
  id: string;
  title: string;
  occurredAt: string;
  mediaUrls: string[];
  description?: string;
}

interface BabyGrowthRecord {
  id: string;
  recordDate: string;
  heightCm?: number;
  weightKg?: number;
  headCircumferenceCm?: number;
}

interface BabyDailyNote {
  id: string;
  date: string;
  note: string;
  mood: string;
  photoUri?: string;
}

// WHO standard growth curves (simplified, percentile 50)
const whoHeight: { age: number; height: number }[] = [
  { age: 0, height: 50 }, { age: 1, height: 54.7 }, { age: 2, height: 58.4 },
  { age: 3, height: 61.4 }, { age: 4, height: 63.9 }, { age: 5, height: 65.9 },
  { age: 6, height: 67.6 }, { age: 7, height: 69.2 }, { age: 8, height: 70.6 },
  { age: 9, height: 72.0 }, { age: 10, height: 73.3 }, { age: 11, height: 74.5 },
  { age: 12, height: 75.7 },
];

const babyBirthDate = '2025-06-01';

const moodEmojis = ['😊', '😴', '😢', '😋', '🤒', '😄'];

export default function BabyScreen() {
  const [milestones, setMilestones] = usePersistedState<BabyMilestone[]>('persist_baby_milestones', []);
  const [photoWall, setPhotoWall] = usePersistedState<string[]>('persist_baby_photowall', []);
  const [growthRecords, setGrowthRecords] = usePersistedState<BabyGrowthRecord[]>('persist_baby_growth', []);
  const [dailyNotes, setDailyNotes] = usePersistedState<BabyDailyNote[]>('persist_baby_daily', []);
  const [babyPhoto, setBabyPhoto] = usePersistedState<string | null>('persist_baby_photo', null);
  const [viewMode, setViewMode] = useState<'daily' | 'growth' | 'milestones' | 'photos'>('daily');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFn, setDeleteFn] = useState<(() => void) | null>(null);

  const handlePickBabyPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      base64: Platform.OS === 'web',
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setBabyPhoto(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  };

  // Add daily note
  const [showAddDaily, setShowAddDaily] = useState(false);
  const [dailyNote, setDailyNote] = useState('');
  const [dailyMood, setDailyMood] = useState('');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);

  // Add milestone
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  // Add growth record
  const [showAddGrowth, setShowAddGrowth] = useState(false);
  const [growthDate, setGrowthDate] = useState(new Date().toISOString().split('T')[0]);
  const [growthHeight, setGrowthHeight] = useState('');
  const [growthWeight, setGrowthWeight] = useState('');
  const [growthHead, setGrowthHead] = useState('');

  // Milestone detail/edit
  const [selectedMilestone, setSelectedMilestone] = useState<BabyMilestone | null>(null);
  const [editingMilestone, setEditingMilestone] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  const handlePickMilestonePhoto = async (milestoneId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      base64: Platform.OS === 'web',
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const photoData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, mediaUrls: [...m.mediaUrls, photoData] } : m));
    }
  };

  const handlePickWallPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      base64: Platform.OS === 'web',
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const photoData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setPhotoWall((prev) => [photoData, ...prev]);
    }
  };

  const handleAddDailyNote = () => {
    if (!dailyNote.trim() && !dailyMood) return;
    setDailyNotes((prev) => [{
      id: String(Date.now()),
      date: dailyDate,
      note: dailyNote.trim(),
      mood: dailyMood,
    }, ...prev]);
    setShowAddDaily(false);
    setDailyNote(''); setDailyMood('');
    setDailyDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddMilestone = () => {
    if (!newMilestoneTitle) return;
    setMilestones((prev) => [{
      id: String(Date.now()),
      title: newMilestoneTitle,
      occurredAt: newMilestoneDate || new Date().toISOString().split('T')[0],
      mediaUrls: [],
    }, ...prev]);
    setShowAddMilestone(false);
    setNewMilestoneTitle(''); setNewMilestoneDate('');
  };

  const handleAddGrowth = () => {
    if (!growthHeight && !growthWeight) return;
    setGrowthRecords((prev) => [{
      id: String(Date.now()),
      recordDate: growthDate,
      heightCm: parseFloat(growthHeight) || undefined,
      weightKg: parseFloat(growthWeight) || undefined,
      headCircumferenceCm: parseFloat(growthHead) || undefined,
    }, ...prev].sort((a, b) => a.recordDate.localeCompare(b.recordDate)));
    setShowAddGrowth(false);
    setGrowthHeight(''); setGrowthWeight(''); setGrowthHead('');
  };

  const handleSaveMilestone = () => {
    if (!selectedMilestone || !editTitle) return;
    setMilestones((prev) => prev.map((m) => m.id === selectedMilestone.id ? { ...m, title: editTitle } : m));
    setEditingMilestone(false);
    setSelectedMilestone(null);
  };

  const todayNote = dailyNotes.find((n) => n.date === new Date().toISOString().split('T')[0]);
  const latestGrowth = growthRecords.length > 0 ? growthRecords[growthRecords.length - 1] : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with baby info */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.babyAvatar} onPress={handlePickBabyPhoto} activeOpacity={0.7}>
          {babyPhoto ? (
            <Image source={{ uri: babyPhoto }} style={styles.babyPhotoImage} />
          ) : (
            <Text style={styles.babyAvatarText}>霄霄</Text>
          )}
          <View style={styles.babyPhotoBadge}>
            <Text style={styles.babyPhotoBadgeText}>{babyPhoto ? '✎' : '+'}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.babyName}>霄霄</Text>
        <Text style={styles.babyAge}>{getAgeString(babyBirthDate)}</Text>
      </View>

      {/* View mode tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'daily', label: '日记' },
          { key: 'growth', label: '生长曲线' },
          { key: 'milestones', label: '成长节点' },
          { key: 'photos', label: '照片墙' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, viewMode === t.key && styles.activeTab]}
            onPress={() => setViewMode(t.key as any)}
          >
            <Text style={[styles.tabText, viewMode === t.key && { color: colors.primaryDark, fontWeight: '600' }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Daily Diary */}
      {viewMode === 'daily' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>霄霄日记</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => { setShowAddDaily(true); setDailyDate(new Date().toISOString().split('T')[0]); }}>
              <Text style={styles.addBtnSmallText}>+ 记录</Text>
            </TouchableOpacity>
          </View>
          {todayNote && (
            <View style={styles.todayCard}>
              <Text style={styles.todayDate}>今天</Text>
              {todayNote.mood && <Text style={styles.todayMood}>{todayNote.mood}</Text>}
              <Text style={styles.todayNote}>{todayNote.note}</Text>
            </View>
          )}
          {dailyNotes.slice(0, 20).map((note) => (
            <TouchableOpacity key={note.id} style={styles.dailyCard} onLongPress={() => {
              setShowDeleteConfirm(true);
              setDeleteFn(() => () => setDailyNotes((prev) => prev.filter((n) => n.id !== note.id)));
            }}>
              <View>
                <Text style={styles.dailyDate}>{note.date}</Text>
                {note.mood && <Text style={styles.dailyMood}>{note.mood}</Text>}
                <Text style={styles.dailyNote} numberOfLines={2}>{note.note}</Text>
              </View>
              {note.photoUri && <Image source={{ uri: note.photoUri }} style={styles.dailyPhoto} />}
            </TouchableOpacity>
          ))}
          {dailyNotes.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>还没有日记，点击上方"+ 记录"开始</Text>
            </View>
          )}
        </View>
      )}

      {/* Growth Curve */}
      {viewMode === 'growth' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>身高/体重曲线</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => { setShowAddGrowth(true); setGrowthDate(new Date().toISOString().split('T')[0]); }}>
              <Text style={styles.addBtnSmallText}>+ 记录</Text>
            </TouchableOpacity>
          </View>
          {growthRecords.length > 1 ? (
            <View style={styles.chartCard}>
              <GrowthCurveChart records={growthRecords} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>至少需要2条记录才能显示曲线</Text>
            </View>
          )}
          {latestGrowth && (
            <View style={styles.statsRow}>
              {latestGrowth.heightCm && <StatCard label="身高" value={`${latestGrowth.heightCm} cm`} icon={'\u{1F4CF}'} />}
              {latestGrowth.weightKg && <StatCard label="体重" value={`${latestGrowth.weightKg} kg`} icon={'\u{2696}\u{FE0F}'} />}
              {latestGrowth.headCircumferenceCm && <StatCard label="头围" value={`${latestGrowth.headCircumferenceCm} cm`} icon={'\u{1F4A0}'} />}
            </View>
          )}
          {/* Growth records list */}
          {growthRecords.slice().reverse().map((r) => (
            <TouchableOpacity key={r.id} style={styles.growthRow} onLongPress={() => {
              setShowDeleteConfirm(true);
              setDeleteFn(() => () => setGrowthRecords((prev) => prev.filter((x) => x.id !== r.id)));
            }}>
              <Text style={styles.growthDate}>{r.recordDate}</Text>
              <Text style={styles.growthData}>
                {r.heightCm ? `身高 ${r.heightCm}cm  ` : ''}
                {r.weightKg ? `体重 ${r.weightKg}kg  ` : ''}
                {r.headCircumferenceCm ? `头围 ${r.headCircumferenceCm}cm` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Milestones */}
      {viewMode === 'milestones' && (
        <View style={styles.section}>
          <View style={styles.milestoneHeader}>
            <Text style={styles.sectionTitle}>成长节点</Text>
            <TouchableOpacity style={styles.addMilestoneBtn} onPress={() => setShowAddMilestone(true)}>
              <Text style={styles.addMilestoneText}>+ 添加</Text>
            </TouchableOpacity>
          </View>
          {milestones.length > 0 ? milestones.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={styles.milestoneCard}
              onPress={() => { setSelectedMilestone(m); setEditTitle(m.title); setEditingMilestone(false); }}
              activeOpacity={0.7}
            >
              <View style={styles.milestoneDot} />
              <View style={styles.milestoneContent}>
                <Text style={styles.milestoneTitle}>{m.title}</Text>
                <Text style={styles.milestoneDate}>{m.occurredAt}</Text>
                {m.mediaUrls.length > 0 && <Text style={styles.milestoneMedia}>{m.mediaUrls.length} 张照片</Text>}
              </View>
              <TouchableOpacity style={styles.milestonePhotoBtn} onPress={() => handlePickMilestonePhoto(m.id)}>
                <Text style={styles.milestonePhotoText}>{'\u{1F4F7}'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>还没有成长节点，点击上方"+ 添加"开始</Text>
            </View>
          )}
        </View>
      )}

      {/* Photo Wall */}
      {viewMode === 'photos' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>霄霄照片墙</Text>
          <TouchableOpacity style={styles.wallUploadBtn} onPress={handlePickWallPhoto}>
            <Text style={styles.wallUploadText}>{'\u{1F4F7}'} 上传照片</Text>
          </TouchableOpacity>
          <View style={styles.photoWallGrid}>
            {photoWall.map((uri, i) => (
              <View key={i} style={styles.wallPhoto}>
                <Image source={{ uri }} style={styles.wallImage} />
              </View>
            ))}
            {photoWall.length === 0 && (
              <View style={styles.wallEmpty}>
                <Text style={{ fontSize: 48 }}>{'\u{1F476}'}</Text>
                <Text style={styles.wallEmptyText}>还没有照片，快上传吧</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={{ height: spacing.xxl }} />

      {/* Daily Note Form */}
      {showAddDaily && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>记录今天</Text>
            <Text style={styles.modalLabel}>日期</Text>
            <TextInput style={styles.modalInput} value={dailyDate} onChangeText={setDailyDate} placeholder="YYYY-MM-DD" />
            <Text style={styles.modalLabel}>心情</Text>
            <View style={styles.moodPicker}>
              {moodEmojis.map((e) => (
                <TouchableOpacity key={e} style={[styles.moodOption, dailyMood === e && { backgroundColor: colors.primaryBg, borderColor: colors.primary }]} onPress={() => setDailyMood(e)}>
                  <Text style={styles.moodOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>备注</Text>
            <TextInput style={[styles.modalInput, { minHeight: 80 }]} value={dailyNote} onChangeText={setDailyNote} placeholder="今天发生了什么..." multiline />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddDailyNote}>
              <Text style={styles.modalSaveText}>保存</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddDaily(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Milestone Form */}
      {showAddMilestone && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>添加成长节点</Text>
            <Text style={styles.modalLabel}>节点名称</Text>
            <TextInput style={styles.modalInput} value={newMilestoneTitle} onChangeText={setNewMilestoneTitle} placeholder="如：第一次走路" autoFocus />
            <Text style={styles.modalLabel}>日期</Text>
            <TextInput style={styles.modalInput} value={newMilestoneDate} onChangeText={setNewMilestoneDate} placeholder="YYYY-MM-DD" />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddMilestone}>
              <Text style={styles.modalSaveText}>添加</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddMilestone(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Growth Record Form */}
      {showAddGrowth && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>添加生长记录</Text>
            <Text style={styles.modalLabel}>日期</Text>
            <TextInput style={styles.modalInput} value={growthDate} onChangeText={setGrowthDate} placeholder="YYYY-MM-DD" />
            <Text style={styles.modalLabel}>身高（cm）</Text>
            <TextInput style={styles.modalInput} value={growthHeight} onChangeText={setGrowthHeight} placeholder="如：68" keyboardType="decimal-pad" />
            <Text style={styles.modalLabel}>体重（kg）</Text>
            <TextInput style={styles.modalInput} value={growthWeight} onChangeText={setGrowthWeight} placeholder="如：7.8" keyboardType="decimal-pad" />
            <Text style={styles.modalLabel}>头围（cm）</Text>
            <TextInput style={styles.modalInput} value={growthHead} onChangeText={setGrowthHead} placeholder="如：43" keyboardType="decimal-pad" />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddGrowth}>
              <Text style={styles.modalSaveText}>保存</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddGrowth(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Milestone Detail/Edit Form */}
      {selectedMilestone && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalSheet}>
            {editingMilestone ? (
              <>
                <Text style={styles.modalTitle}>编辑节点名称</Text>
                <TextInput style={styles.modalInput} value={editTitle} onChangeText={setEditTitle} placeholder="节点名称" autoFocus />
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingMilestone(false)}>
                    <Text style={styles.modalCancelText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveMilestone}>
                    <Text style={styles.modalSaveText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>{selectedMilestone.title}</Text>
                <Text style={styles.modalDate}>{selectedMilestone.occurredAt}</Text>
                <TouchableOpacity style={styles.modalEditBtn} onPress={() => setEditingMilestone(true)}>
                  <Text style={styles.modalEditText}>编辑名称</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalCancelBtn, { marginTop: spacing.sm }]} onPress={() => { setSelectedMilestone(null); setEditingMilestone(false); }}>
                  <Text style={styles.modalCancelText}>关闭</Text>
                </TouchableOpacity>
              </>
            )}
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
    </ScrollView>
  );
}

function GrowthCurveChart({ records }: { records: BabyGrowthRecord[] }) {
  const chartW = 300;
  const chartH = 160;
  const pad = { l: 40, r: 10, t: 10, b: 30 };
  const innerW = chartW - pad.l - pad.r;
  const innerH = chartH - pad.t - pad.b;

  const minAge = 0;
  const maxAge = 12;
  const minHeight = 50;
  const maxHeight = 80;

  const toX = (age: number) => pad.l + ((age - minAge) / (maxAge - minAge)) * innerW;
  const toY = (h: number) => pad.t + innerH - ((h - minHeight) / (maxHeight - minHeight)) * innerH;

  const whoPath = whoHeight.map((w, i) => `${i === 0 ? 'M' : 'L'} ${toX(w.age)} ${toY(w.height)}`).join(' ');

  const sortedRecords = [...records].sort((a, b) => a.recordDate.localeCompare(b.recordDate));
  const userPath = sortedRecords.map((r, i) => {
    const age = getAgeMonths(r.recordDate);
    return `${i === 0 ? 'M' : 'L'} ${toX(age)} ${toY(r.heightCm || 0)}`;
  }).join(' ');

  return (
    <View>
      <Svg width={chartW} height={chartH}>
        {[55, 60, 65, 70, 75, 80].map((h) => (
          <G key={h}>
            <Line x1={pad.l} y1={toY(h)} x2={chartW - pad.r} y2={toY(h)} stroke={colors.borderLight} strokeWidth={0.5} />
            <SvgText x={pad.l - 5} y={toY(h) + 4} fontSize={9} fill={colors.textMuted} textAnchor="end">{h}</SvgText>
          </G>
        ))}
        <Path d={whoPath} fill="none" stroke={colors.border} strokeWidth={1.5} strokeDasharray="4,3" />
        <SvgText x={chartW - pad.r - 5} y={toY(70) - 5} fontSize={9} fill={colors.textMuted} textAnchor="end">WHO 标准</SvgText>
        {sortedRecords.length > 1 && <Path d={userPath} fill="none" stroke={colors.baby} strokeWidth={2.5} />}
        {sortedRecords.map((r) => {
          const age = getAgeMonths(r.recordDate);
          return <Circle key={r.id} cx={toX(age)} cy={toY(r.heightCm || 0)} r={4} fill={colors.baby} stroke={colors.surface} strokeWidth={2} />;
        })}
        {[0, 3, 6, 9, 12].map((a) => (
          <SvgText key={a} x={toX(a)} y={chartH - 5} fontSize={9} fill={colors.textMuted} textAnchor="middle">{a}月</SvgText>
        ))}
      </Svg>
    </View>
  );
}

function getAgeMonths(dateStr: string): number {
  const birthDate = new Date(babyBirthDate);
  const recordDate = new Date(dateStr);
  return Math.max(0, Math.round((recordDate.getTime() - birthDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
}

function getAgeString(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const months = Math.floor((now.getTime() - birth.getTime()) / (30 * 24 * 60 * 60 * 1000));
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  return `${years} 岁 ${remainMonths} 个月`;
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', padding: spacing.lg },
  babyAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.baby + '22', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  babyPhotoImage: { width: 64, height: 64, borderRadius: 32 },
  babyAvatarText: { fontSize: 18, fontWeight: '700', color: colors.baby },
  babyPhotoBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.baby, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background },
  babyPhotoBadgeText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  babyName: { ...typography.h2, color: colors.text, marginTop: spacing.sm },
  babyAge: { ...typography.caption, color: colors.textMuted },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { ...typography.label, color: colors.textSecondary },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  addBtnSmall: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primaryBg, borderRadius: borderRadius.sm },
  addBtnSmallText: { ...typography.caption, color: colors.primaryDark, fontWeight: '500' },
  chartCard: { ...shadows.card, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', ...shadows.card },
  statValue: { ...typography.h2, fontWeight: '700', color: colors.text, marginVertical: spacing.xs },
  statLabel: { ...typography.caption, color: colors.textMuted },
  todayCard: { backgroundColor: colors.baby + '11', borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.baby },
  todayDate: { ...typography.label, color: colors.text, fontWeight: '600' },
  todayMood: { fontSize: 24, marginVertical: spacing.xs },
  todayNote: { ...typography.body, color: colors.textSecondary },
  dailyCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, ...shadows.card },
  dailyDate: { ...typography.label, color: colors.text, fontWeight: '600' },
  dailyMood: { fontSize: 20 },
  dailyNote: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.xs },
  dailyPhoto: { width: 50, height: 50, borderRadius: borderRadius.sm },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addMilestoneBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primaryBg, borderRadius: borderRadius.sm },
  addMilestoneText: { ...typography.caption, color: colors.primaryDark, fontWeight: '500' },
  milestoneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  milestoneDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.baby, marginRight: spacing.sm },
  milestoneContent: { flex: 1 },
  milestoneTitle: { ...typography.label, color: colors.text },
  milestoneDate: { ...typography.caption, color: colors.textMuted },
  milestoneMedia: { ...typography.caption, color: colors.baby },
  milestonePhotoBtn: { padding: spacing.sm },
  milestonePhotoText: { fontSize: 18 },
  growthRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, ...shadows.card },
  growthDate: { ...typography.label, color: colors.text, fontWeight: '600' },
  growthData: { ...typography.bodySm, color: colors.textSecondary },
  wallUploadBtn: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, alignItems: 'center', marginBottom: spacing.md, ...shadows.card },
  wallUploadText: { ...typography.label, color: colors.baby, fontWeight: '500' },
  photoWallGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  wallPhoto: { width: '32%', aspectRatio: 1, borderRadius: borderRadius.md, overflow: 'hidden' },
  wallImage: { width: '100%', height: '100%', backgroundColor: colors.surfaceAlt },
  wallEmpty: { width: '100%', aspectRatio: 2, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  wallEmptyText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  emptyCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.xl, alignItems: 'center', ...shadows.card },
  emptyText: { ...typography.bodySm, color: colors.textMuted },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 100 },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg },
  modalTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  modalLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  modalDate: { ...typography.caption, color: colors.textMuted, marginVertical: spacing.sm },
  modalEditBtn: { padding: spacing.md, backgroundColor: colors.primaryBg, borderRadius: borderRadius.md, alignItems: 'center' },
  modalEditText: { ...typography.label, color: colors.primaryDark, fontWeight: '500' },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: spacing.md, ...typography.body, minHeight: 44 },
  modalBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  modalCancelBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.md, alignItems: 'center' },
  modalCancelText: { ...typography.label, color: colors.textSecondary },
  modalSaveBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' },
  modalSaveText: { ...typography.label, color: '#fff', fontWeight: '500' },
  moodPicker: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  moodOption: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  moodOptionText: { fontSize: 22 },
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
