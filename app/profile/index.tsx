import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image, Platform } from 'react-native';
import { Svg, Circle, Polygon, Line, G, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { usePersistedState } from '../../src/hooks/usePersistedState';
import * as ImagePicker from 'expo-image-picker';
import type { Skill } from '../../src/types';

const initialSkills: Skill[] = [
  { id: '1', name: 'Python', level: 5 },
  { id: '2', name: 'PyTorch', level: 4 },
  { id: '3', name: 'MLOps', level: 3 },
  { id: '4', name: 'JavaScript', level: 3 },
  { id: '5', name: 'Docker', level: 3 },
  { id: '6', name: 'Linux', level: 4 },
];

const initialExperiences = [
  { id: '1', role: '家居设计 专业 学士', company: '四川农业大学', period: '2009.09 - 2013.06', description: '研究方向：家居设计、室内设计' },
  { id: '2', role: '室内设计设计师', company: '好莱客', period: '2021.06 - 2025.12', description: 'xxx' },
  { id: '3', role: '室内设计设计师', company: '索菲亚', period: '2026.04 - 至今', description: 'xxx' },
];

const initialProjects = [
  { id: '1', name: '家居设计', tech: '...', description: '..' },
  { id: '2', name: '推荐系统优化', tech: 'Python, TensorFlow, Spark', description: '..' },
  { id: '3', name: 'LifeCanvas', tech: 'React Native, Expo, Supabase', description: '..' },
];

export default function ProfileScreen() {
  const [profilePhoto, setProfilePhoto] = usePersistedState<string | null>('persist_profile_photo', null);
  const [skills, setSkills] = usePersistedState('persist_profile_skills', initialSkills);
  const [experiences, setExperiences] = usePersistedState('persist_profile_experiences', initialExperiences);
  const [projects, setProjects] = usePersistedState('persist_profile_projects', initialProjects);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillLevelInput, setSkillLevelInput] = useState('');

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      base64: Platform.OS === 'web',
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProfilePhoto(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  };

  const handleUpdateSkill = () => {
    if (!editingSkill) return;
    const level = parseInt(skillLevelInput, 10);
    if (isNaN(level) || level < 1 || level > 5) {
      Alert.alert('提示', '请输入1-5之间的等级');
      return;
    }
    setSkills((prev) => prev.map((s) => (s.id === editingSkill.id ? { ...s, level } : s)));
    setEditingSkill(null);
    setSkillLevelInput('');
    Alert.alert('成功', '技能等级已更新');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Basic Info */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <TouchableOpacity style={styles.avatarLarge} onPress={handlePickPhoto} activeOpacity={0.7}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.avatarImageLarge} />
              ) : (
                <Text style={styles.avatarText}>YR</Text>
              )}
              <View style={styles.avatarBadgeSmall}>
                <Text style={styles.avatarBadgeTextSmall}>{profilePhoto ? '✎' : '+'}</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.name}>闫锐</Text>
              <Text style={styles.role}>家居设计 专业 学士</Text>
              <Text style={styles.meta}>四川农业大学 · 家居设计方向</Text>
            </View>
          </View>
          <Text style={styles.bio}>热爱技术与创造，专注于 MAS 研究与工程实践。喜欢用代码记录和美化生活。</Text>
        </View>
      </View>

      {/* Education */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>教育背景</Text>
        <View style={styles.card}>
          <Text style={styles.eduDegree}>家居设计 专业 学士</Text>
          <Text style={styles.eduSchool}>四川农业大学</Text>
          <Text style={styles.eduMeta}>2009.09 - 2013.06 · GPA: 3.8/4.0</Text>
        </View>
      </View>

      {/* Skills Radar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>技能图谱</Text>
        <View style={[styles.card, { alignItems: 'center' }]}>
          <SkillRadarChart skills={skills} onUpdateSkill={(s) => { setEditingSkill(s); setSkillLevelInput(String(s.level)); }} />
        </View>
      </View>

      {/* Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>工作/实习经历</Text>
        {experiences.map((exp) => (
          <View key={exp.id} style={styles.card}>
            <View style={styles.expHeader}>
              <Text style={styles.expRole}>{exp.role}</Text>
              <Text style={styles.expPeriod}>{exp.period}</Text>
            </View>
            <Text style={styles.expCompany}>{exp.company}</Text>
            <Text style={styles.expDesc}>{exp.description}</Text>
          </View>
        ))}
      </View>

      {/* Projects */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>项目经验</Text>
        {projects.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.projName}>{p.name}</Text>
            <Text style={styles.projTech}>{p.tech}</Text>
            <Text style={styles.projDesc}>{p.description}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: spacing.xxl }} />

      {/* Edit Skill Modal */}
      <Modal visible={!!editingSkill} transparent animationType="fade" onRequestClose={() => { setEditingSkill(null); setSkillLevelInput(''); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setEditingSkill(null); setSkillLevelInput(''); }}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>编辑技能等级</Text>
            <Text style={styles.modalSkillName}>{editingSkill?.name}</Text>
            <View style={styles.levelPicker}>
              {[1, 2, 3, 4, 5].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.levelBtn, parseInt(skillLevelInput) >= l && { backgroundColor: colors.primary }]}
                  onPress={() => setSkillLevelInput(String(l))}
                >
                  <Text style={[styles.levelBtnText, parseInt(skillLevelInput) >= l && { color: '#fff' }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateSkill}>
              <Text style={styles.modalSaveText}>保存</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

function SkillRadarChart({ skills, onUpdateSkill }: { skills: Skill[]; onUpdateSkill: (s: Skill) => void }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 70;
  const levels = 5;

  const getPoint = (index: number, level: number) => {
    const angle = (index * (Math.PI * 2)) / skills.length - Math.PI / 2;
    const r = (level / 5) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  return (
    <View>
      <Svg width={size} height={size}>
        {/* Grid rings */}
        {Array.from({ length: levels }).map((_, i) => {
          const r = ((i + 1) / levels) * maxR;
          return (
            <G key={i}>
              {skills.map((_, j) => {
                const p1 = getPoint(j, i + 1);
                const p2 = getPoint((j + 1) % skills.length, i + 1);
                return <Line key={j} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={colors.border} strokeWidth={0.8} />;
              })}
            </G>
          );
        })}
        {/* Axis lines */}
        {skills.map((_, i) => {
          const p = getPoint(i, 5);
          return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={colors.borderLight} strokeWidth={0.5} />;
        })}
        {/* Data polygon */}
        <Polygon
          points={skills.map((s, i) => { const p = getPoint(i, s.level); return p.x + ',' + p.y; }).join(' ')}
          fill={colors.primary + '33'}
          stroke={colors.primary}
          strokeWidth={2}
        />
        {/* Labels */}
        {skills.map((s, i) => {
          const angle = (i * (Math.PI * 2)) / skills.length - Math.PI / 2;
          const labelR = maxR + 20;
          const lx = cx + labelR * Math.cos(angle);
          const ly = cy + labelR * Math.sin(angle);
          const anchor = Math.abs(lx - cx) < 2 ? 'middle' : lx > cx ? 'start' : 'end';
          return (
            <SvgText key={s.name} x={lx} y={ly + 4} fontSize={10} fill={colors.textSecondary} textAnchor={anchor}>
              {s.name}
            </SvgText>
          );
        })}
      </Svg>
      {/* Legend - tap to edit */}
      <View style={styles.skillLegend}>
        {skills.map((s) => (
          <TouchableOpacity key={s.id} style={styles.skillRow} onPress={() => onUpdateSkill(s)}>
            <Text style={styles.skillName}>{s.name}</Text>
            <View style={styles.skillBarBg}>
              <View style={[styles.skillBar, { width: `${(s.level / 5) * 100}%` as unknown as number }]} />
            </View>
            <Text style={styles.skillLevel}>{s.level}/5</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  card: { ...shadows.card, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  avatarImageLarge: { width: 64, height: 64, borderRadius: 32 },
  avatarBadgeSmall: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
  avatarBadgeTextSmall: { fontSize: 12, color: '#fff', fontWeight: '700' },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.primary },
  name: { ...typography.h2, fontWeight: '700', color: colors.text },
  role: { ...typography.label, color: colors.primary },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  bio: { ...typography.bodySm, color: colors.textSecondary, lineHeight: 20 },
  eduDegree: { ...typography.h3, color: colors.text },
  eduSchool: { ...typography.label, color: colors.textSecondary },
  eduMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  expHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  expRole: { ...typography.label, color: colors.text, fontWeight: '600' },
  expPeriod: { ...typography.caption, color: colors.textMuted },
  expCompany: { ...typography.bodySm, color: colors.primary, marginTop: 2 },
  expDesc: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.xs },
  projName: { ...typography.label, color: colors.text, fontWeight: '600' },
  projTech: { ...typography.caption, color: colors.info, marginTop: 2 },
  projDesc: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.xs },
  skillLegend: { marginTop: spacing.md },
  skillRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  skillName: { ...typography.caption, color: colors.textSecondary, width: 60 },
  skillBarBg: { flex: 1, height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, marginHorizontal: spacing.sm },
  skillBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  skillLevel: { ...typography.caption, color: colors.textMuted, width: 24, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center' },
  modalTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  modalSkillName: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.md },
  levelPicker: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  levelBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  levelBtnText: { ...typography.label, color: colors.textSecondary, fontWeight: '600' },
  modalSaveBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: borderRadius.sm },
  modalSaveText: { ...typography.label, color: '#fff', fontWeight: '500' },
});
