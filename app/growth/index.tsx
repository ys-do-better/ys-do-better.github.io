import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Svg, Line, G, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { useMilestones } from '../../src/hooks/useMilestones';
import type { Milestone } from '../../src/types';

const nodeTypeConfig: Record<string, { label: string; color: string; icon: string }> = {
  milestone: { label: '里程碑', color: colors.growth, icon: '\u{1F3C6}' },
  daily: { label: '日常记录', color: colors.info, icon: '\u{1F4DD}' },
  achievement: { label: '成就', color: colors.warning, icon: '\u{2B50}' },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  academic: { label: '学术', color: colors.profile },
  project: { label: '项目', color: colors.growth },
  exam: { label: '考试', color: colors.info },
  other: { label: '其他', color: colors.textMuted },
};

export default function GrowthScreen() {
  const { milestones, addMilestone } = useMilestones();
  const [filterType, setFilterType] = useState<string>('all');
  const [showToast, setShowToast] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState<'milestone' | 'daily' | 'achievement'>('milestone');
  const [newCategory, setNewCategory] = useState<'academic' | 'project' | 'exam' | 'other'>('academic');

  const data = milestones;
  const filtered = filterType === 'all' ? data : data.filter((m) => (m.nodeType || 'milestone') === filterType);

  const handleAdd = async () => {
    if (!newTitle.trim()) {
      setShowToast('请输入标题');
      setTimeout(() => setShowToast(''), 2000);
      return;
    }
    if (!newDate) {
      setShowToast('请选择日期');
      setTimeout(() => setShowToast(''), 2000);
      return;
    }
    await addMilestone({
      title: newTitle.trim(),
      description: newDesc.trim(),
      date: newDate,
      nodeType: newType,
      category: newCategory,
    });
    setShowAddForm(false);
    setNewTitle('');
    setNewDesc('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setShowToast('节点已添加');
    setTimeout(() => setShowToast(''), 2000);
  };

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {[
          { key: 'all', label: '全部' },
          ...Object.entries(nodeTypeConfig).map(([k, v]) => ({ key: k, label: v.label })),
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filterType === f.key && { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}
            onPress={() => setFilterType(f.key)}
          >
            <Text style={[styles.filterChipText, filterType === f.key && { color: colors.primaryDark }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 3D Timeline Visualization */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>成长轨迹</Text>
          <View style={styles.timeline3d}>
            {filtered.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>还没有成长节点，点击下方"+ 添加新节点"开始</Text>
              </View>
            )}
            {filtered.map((m, i) => {
              const config = nodeTypeConfig[m.nodeType ?? 'milestone'] || nodeTypeConfig.milestone;
              const catConfig = categoryConfig[m.category || 'other'];
              const isLeft = i % 2 === 0;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.timelineNode,
                    isLeft ? styles.timelineLeft : styles.timelineRight,
                  ]}
                  onPress={() => setSelectedMilestone(m)}
                  activeOpacity={0.7}
                >
                  {/* Connection line */}
                  <View style={[styles.connector, isLeft ? styles.connectorLeft : styles.connectorRight]} />
                  {/* Node dot */}
                  <View style={[styles.nodeDot, { backgroundColor: config.color }]}>
                    <Text style={styles.nodeDotText}>{config.icon}</Text>
                  </View>
                  {/* Card */}
                  <View style={[styles.nodeCard, isLeft ? styles.nodeCardLeft : styles.nodeCardRight]}>
                    <View style={styles.nodeHeader}>
                      <Text style={[styles.nodeTitle, { color: catConfig.color }]} numberOfLines={1}>
                        {m.title}
                      </Text>
                      <Text style={styles.nodeDate}>{m.occurredAt || m.date}</Text>
                    </View>
                    <Text style={styles.nodeDesc} numberOfLines={2}>
                      {m.description}
                    </Text>
                    {m.metricValue !== undefined && m.metricName && (
                      <View style={styles.metricBadge}>
                        <Text style={styles.metricText}>{m.metricName}: {m.metricValue}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Add button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
          <Text style={styles.addBtnText}>+ 添加新节点</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Detail Overlay */}
      {selectedMilestone && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalContent}>
            {(() => {
              const config = nodeTypeConfig[selectedMilestone.nodeType ?? 'milestone'] || nodeTypeConfig.milestone;
              return (
                <>
                  <View style={styles.modalIconRow}>
                    <Text style={{ fontSize: 32 }}>{config.icon}</Text>
                    <Text style={styles.modalTitle}>{selectedMilestone.title}</Text>
                  </View>
                  <Text style={styles.modalDate}>{selectedMilestone.occurredAt || selectedMilestone.date}</Text>
                  <Text style={styles.modalDesc}>{selectedMilestone.description}</Text>
                  {selectedMilestone.metricValue !== undefined && selectedMilestone.metricName && (
                    <View style={styles.modalMetric}>
                      <Text style={styles.modalMetricText}>
                        {selectedMilestone.metricName}: {selectedMilestone.metricValue}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedMilestone(null)}>
                    <Text style={styles.modalCloseText}>关闭</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      )}

      {/* Add Form Overlay */}
      {showAddForm && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加成长节点</Text>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="标题"
              autoFocus
            />
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="描述"
              multiline
            />
            <TextInput
              style={styles.input}
              value={newDate}
              onChangeText={setNewDate}
              placeholder="日期 (如：2025-12-01)"
            />
            <View style={styles.typePicker}>
              <Text style={styles.typePickerLabel}>类型：</Text>
              {(['milestone', 'daily', 'achievement'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, newType === t && { backgroundColor: colors.primaryBg }]}
                  onPress={() => setNewType(t)}
                >
                  <Text style={[styles.typeChipText, newType === t && { color: colors.primaryDark }]}>
                    {nodeTypeConfig[t].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
              <Text style={styles.confirmBtnText}>添加</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddForm(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Toast */}
      {showToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{showToast}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterBar: { flexGrow: 0, flexShrink: 0, flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.background , height: 50 },
  filterChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border, marginRight: spacing.xs ,alignSelf: 'center', justifyContent: 'center',},
  filterChipText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  content: { flex: 1 },
  timelineSection: { paddingHorizontal: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  timeline3d: { paddingVertical: spacing.md },
  timelineNode: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  timelineLeft: { paddingRight: '50%' },
  timelineRight: { paddingLeft: '50%' },
  connector: { position: 'absolute', top: 20, height: 2, backgroundColor: colors.border, width: 30 },
  connectorLeft: { right: '50%' },
  connectorRight: { left: '50%' },
  nodeDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'absolute', left: '50%', marginLeft: -20, zIndex: 1 },
  nodeDotText: { fontSize: 18 },
  nodeCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, ...shadows.card },
  nodeCardLeft: { marginRight: spacing.lg },
  nodeCardRight: { marginLeft: spacing.lg },
  nodeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  nodeTitle: { ...typography.label, fontWeight: '600', flex: 1 },
  nodeDate: { ...typography.caption, color: colors.textMuted },
  nodeDesc: { ...typography.bodySm, color: colors.textSecondary },
  metricBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full, backgroundColor: colors.growth + '18', marginTop: spacing.xs },
  metricText: { ...typography.caption, color: colors.growth, fontWeight: '500' },
  addBtn: { margin: spacing.md, padding: spacing.md, backgroundColor: colors.primaryBg, borderRadius: borderRadius.md, alignItems: 'center' },
  addBtnText: { ...typography.label, color: colors.primaryDark, fontWeight: '500' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 100 },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg },
  modalIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  modalTitle: { ...typography.h2, color: colors.text, marginLeft: spacing.sm },
  modalDate: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  modalDesc: { ...typography.bodySm, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
  modalMetric: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.growth + '18' },
  modalMetricText: { ...typography.label, color: colors.growth, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: spacing.md, ...typography.body, marginBottom: spacing.sm },
  typePicker: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  typePickerLabel: { ...typography.label, color: colors.text, marginRight: spacing.sm },
  typeChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surfaceAlt, marginRight: spacing.xs },
  typeChipText: { ...typography.caption, color: colors.textSecondary },
  confirmBtn: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.sm, alignItems: 'center' },
  confirmBtnText: { ...typography.label, color: '#fff', fontWeight: '500' },
  modalCloseBtn: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.primaryBg, borderRadius: borderRadius.sm, alignItems: 'center' },
  modalCloseText: { ...typography.label, color: colors.primaryDark, fontWeight: '500' },
  modalCancelBtn: { marginTop: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.sm, alignItems: 'center' },
  modalCancelText: { ...typography.label, color: colors.textSecondary },
  emptyCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.xl, alignItems: 'center', ...shadows.card },
  emptyText: { ...typography.bodySm, color: colors.textMuted },
  toast: { position: 'absolute', bottom: spacing.xl, left: spacing.lg, right: spacing.lg, backgroundColor: colors.text, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', zIndex: 300 },
  toastText: { ...typography.label, color: colors.surface, fontWeight: '500' },
});
