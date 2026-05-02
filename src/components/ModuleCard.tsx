import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface ModuleCardProps {
  icon: string;
  title: string;
  summary: string;
  route: string;
  accentColor: string;
}

export default function ModuleCard({
  icon,
  title,
  summary,
  route,
  accentColor,
}: ModuleCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, { borderTopColor: accentColor }]}
      onPress={() => router.push(route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: accentColor + '22' }]}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.summary} numberOfLines={2}>
        {summary}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderTopWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.label,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  summary: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
