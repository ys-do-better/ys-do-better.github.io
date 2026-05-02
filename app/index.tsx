import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import ModuleCard from '../src/components/ModuleCard';
import { colors, spacing, typography, borderRadius, shadows } from '../src/theme';
import { useAppStore } from '../src/store';
import { usePersistedState } from '../src/hooks/usePersistedState';

const modules = [
  { icon: '\u{1F464}', title: '个人介绍', route: '/profile', accentColor: colors.profile, summary: '索菲亚公司 · 室内设计培训师' },
  { icon: '\u{1F4F8}', title: '照片集合', route: '/photos', accentColor: colors.photos, summary: '最近上传: 广州旅行' },
  { icon: '\u{1F680}', title: '成长轨迹', route: '/growth', accentColor: colors.growth, summary: '努力努力再努力！' },
  { icon: '\u{1F308}', title: '情绪管理', route: '/mood', accentColor: colors.mood, summary: '今天情绪稳定了吗？' },
  { icon: '\u{1F476}', title: '霄霄日记', route: '/baby', accentColor: colors.baby, summary: '宝宝的成长记录' },
  { icon: '\u{2764}\u{FE0F}', title: '健康管理', route: '/health', accentColor: colors.health, summary: '健康大于一切' },
  { icon: '\u{1F4CA}', title: '投资理财', route: '/finance', accentColor: colors.finance, summary: '早日成为小富婆' },
  { icon: '\u{1F4D6}', title: '书籍阅读', route: '/books', accentColor: colors.books, summary: '书籍是人类进步的阶梯' },
];

export default function HomeScreen() {
  const { lastSyncAt } = useAppStore();
  const [homePhoto, setHomePhoto] = usePersistedState<string | null>('persist_home_photo', null);

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      base64: Platform.OS === 'web',
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const photoData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setHomePhoto(photoData);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Hero */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <TouchableOpacity style={styles.avatarPlaceholder} onPress={handlePickPhoto} activeOpacity={0.7}>
            {homePhoto ? (
              <Image source={{ uri: homePhoto }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>YR</Text>
            )}
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>{homePhoto ? '✎' : '+'}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.heroName}>闫锐</Text>
          <Text style={styles.heroBio}>家居设计 专业本科生 · 室内设计 · 技术爱好者</Text>
          <Text style={styles.heroSubtitle}>记录生活每一刻，管理成长每一步</Text>
        </View>
      </LinearGradient>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <StatItem label="关注" value="5" />
        <StatItem label="粉丝" value="5" />
        <StatItem label="动态" value="0" />
      </View>

      {/* Modules */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>功能模块</Text>
      </View>
      <View style={styles.grid}>
        {modules.map((mod) => (
          <View key={mod.route} style={styles.gridItem}>
            <ModuleCard
              icon={mod.icon}
              title={mod.title}
              summary={mod.summary}
              route={mod.route}
              accentColor={mod.accentColor}
            />
          </View>
        ))}
      </View>

      {Object.keys(lastSyncAt).length > 0 && (
        <Text style={styles.syncInfo}>
          上次同步: {new Date(Object.values(lastSyncAt)[0]).toLocaleTimeString('zh-CN')}
        </Text>
      )}
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { padding: spacing.xl, paddingBottom: spacing.xl + spacing.md },
  heroContent: { alignItems: 'center' },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden', position: 'relative',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  avatarBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primaryDark,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarBadgeText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  heroName: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: spacing.md },
  heroBio: { ...typography.bodySm, color: '#ffffffCC', marginTop: spacing.xs },
  heroSubtitle: { ...typography.caption, color: '#ffffff99', marginTop: spacing.sm },
  statsBar: {
    flexDirection: 'row', backgroundColor: colors.surface,
    marginHorizontal: spacing.md, marginTop: -spacing.md,
    borderRadius: borderRadius.md, padding: spacing.md,
    ...shadows.card,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.h2, fontWeight: '700', color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted },
  sectionHeader: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm },
  gridItem: { width: '48%' },
  syncInfo: { ...typography.caption, color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
});
