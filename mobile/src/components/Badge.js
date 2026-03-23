import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../theme/colors';

const variantStyles = {
  hot: { bg: colors.hotBg, text: colors.hot, border: colors.hot },
  warm: { bg: colors.warmBg, text: colors.warning, border: colors.warning },
  cold: { bg: colors.coldBg, text: colors.error, border: colors.error },
  info: { bg: colors.infoBg, text: colors.info, border: colors.info },
  success: { bg: colors.successBg, text: colors.success, border: colors.success },
  error: { bg: colors.errorBg, text: colors.error, border: colors.error },
  warning: { bg: colors.warningBg, text: colors.warning, border: colors.warning },
  default: { bg: colors.surfaceLight, text: colors.textSecondary, border: colors.border },
};

export function Badge({ children, variant = 'default', style }) {
  const v = variantStyles[variant] || variantStyles.default;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{children}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  const statusMap = {
    completed: 'success',
    running: 'info',
    pending: 'warning',
    failed: 'error',
    draft: 'default',
    sent: 'success',
    scheduled: 'info',
  };
  return <Badge variant={statusMap[status] || 'default'}>{status}</Badge>;
}

export function ScoreBadge({ score }) {
  let variant = 'cold';
  if (score >= 80) variant = 'hot';
  else if (score >= 50) variant = 'warm';
  return <Badge variant={variant}>{score}</Badge>;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
