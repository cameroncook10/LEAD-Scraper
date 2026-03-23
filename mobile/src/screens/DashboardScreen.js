import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { Card, StatCard } from '../components/Card';
import { startScrape, getLeadsStats } from '../services/api';

const SOURCES = [
  { value: 'web_search', label: 'Web Search', icon: '🌐' },
  { value: 'google_maps', label: 'Google Maps', icon: '📍' },
  { value: 'zillow', label: 'Zillow', icon: '🏠' },
  { value: 'nextdoor', label: 'Nextdoor', icon: '🏘️' },
];

export default function DashboardScreen({ navigation }) {
  const [source, setSource] = useState('web_search');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState('100');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getLeadsStats();
      setStats(data);
    } catch (e) {
      // Stats unavailable
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const result = await startScrape(source, query, parseInt(limit) || 100);
      Alert.alert('Success', `Scrape job started (ID: ${result.jobId})`, [
        { text: 'View Jobs', onPress: () => navigation.navigate('Jobs') },
        { text: 'OK' },
      ]);
      setQuery('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to start scrape');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard>
          <Text style={styles.statLabel}>Total Leads</Text>
          <Text style={styles.statValue}>{stats?.totalLeads ?? '—'}</Text>
        </StatCard>
        <StatCard>
          <Text style={styles.statLabel}>Hot Leads</Text>
          <Text style={[styles.statValue, { color: colors.hot }]}>
            {stats?.scoreDistribution?.hot ?? '—'}
          </Text>
        </StatCard>
        <StatCard>
          <Text style={styles.statLabel}>Avg Score</Text>
          <Text style={[styles.statValue, { color: colors.info }]}>
            {stats?.averageScore ?? '—'}
          </Text>
        </StatCard>
      </View>

      {/* New Scrape Job */}
      <Card>
        <Text style={styles.sectionTitle}>New Scrape Job</Text>

        {/* Source selector */}
        <Text style={styles.fieldLabel}>Data Source</Text>
        <View style={styles.sourcesGrid}>
          {SOURCES.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.sourceBtn, source === s.value && styles.sourceBtnActive]}
              onPress={() => setSource(s.value)}
            >
              <Text style={styles.sourceIcon}>{s.icon}</Text>
              <Text style={[styles.sourceLabel, source === s.value && styles.sourceLabelActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Query */}
        <Text style={styles.fieldLabel}>Search Query</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., plumbers in New York"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="done"
        />

        {/* Limit */}
        <Text style={styles.fieldLabel}>Lead Limit</Text>
        <TextInput
          style={styles.input}
          placeholder="100"
          placeholderTextColor={colors.textMuted}
          value={limit}
          onChangeText={setLimit}
          keyboardType="number-pad"
        />
        <Text style={styles.hint}>Maximum 1,000 leads per job</Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>Start Scrape Job</Text>
          )}
        </TouchableOpacity>
      </Card>

      {/* Features */}
      <Card>
        <Text style={styles.sectionTitle}>Features</Text>
        {[
          ['Multi-source scraping', 'Web, Google Maps, Zillow, Nextdoor'],
          ['AI qualification', 'Claude Haiku scores each lead 0-100'],
          ['Real-time progress', 'Monitor jobs and qualification live'],
          ['CSV export', 'Download filtered leads with all details'],
        ].map(([title, desc], i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  statLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  statValue: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700', marginTop: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.lg },
  fieldLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
  sourcesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sourceBtn: {
    flex: 1, minWidth: '45%',
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  sourceBtnActive: { borderColor: colors.primary, backgroundColor: colors.background },
  sourceIcon: { fontSize: 24, marginBottom: spacing.xs },
  sourceLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '500' },
  sourceLabelActive: { color: colors.primary },
  input: {
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    color: colors.text, fontSize: fontSize.md,
    borderWidth: 1, borderColor: colors.border,
  },
  hint: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.xl,
  },
  submitBtnDisabled: { backgroundColor: colors.surfaceLight },
  submitText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  checkMark: { color: colors.white, fontSize: 14, fontWeight: '700' },
  featureText: { flex: 1 },
  featureTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  featureDesc: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
});
