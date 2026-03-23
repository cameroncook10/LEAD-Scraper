import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../theme/colors';

export function Card({ children, style, variant = 'default' }) {
  return (
    <View style={[styles.card, variant === 'bordered' && styles.bordered, style]}>
      {children}
    </View>
  );
}

export function StatCard({ children, style }) {
  return (
    <View style={[styles.statCard, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});
