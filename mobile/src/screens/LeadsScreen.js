import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, RefreshControl, FlatList
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { Card, StatCard } from '../components/Card';
import { ScoreBadge, Badge } from '../components/Badge';
import { getLeads, getLeadsStats, deleteLead } from '../services/api';

export default function LeadsScreen() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filters = { search, source: selectedSource, category: selectedCategory, limit: 50, offset: 0 };

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLeads(filters);
      setLeads(data.leads || []);
    } catch (e) {
      console.error('Failed to load leads:', e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedSource, selectedCategory]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getLeadsStats();
      setStats(data);
    } catch (e) {
      // Stats unavailable
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLeads(), fetchStats()]);
    setRefreshing(false);
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Lead', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteLead(id);
            setLeads((prev) => prev.filter((l) => l.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete lead');
          }
        },
      },
    ]);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return colors.hot;
    if (score >= 50) return colors.warning;
    return colors.error;
  };

  const renderLead = ({ item: lead }) => (
    <Card style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.leadName}>{lead.name}</Text>
          {lead.address && <Text style={styles.leadAddress} numberOfLines={1}>{lead.address}</Text>}
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: getScoreColor(lead.ai_score) }]}>
            {lead.ai_score}
          </Text>
          <Text style={styles.scoreLabel}>
            {lead.ai_score >= 80 ? 'HOT' : lead.ai_score >= 50 ? 'WARM' : 'COLD'}
          </Text>
        </View>
      </View>

      <View style={styles.leadDetails}>
        {lead.phone && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📱</Text>
            <Text style={styles.detailText}>{lead.phone}</Text>
          </View>
        )}
        {lead.email && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📧</Text>
            <Text style={styles.detailText} numberOfLines={1}>{lead.email}</Text>
          </View>
        )}
        {lead.business_type && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🏢</Text>
            <Text style={styles.detailText}>{lead.business_type}</Text>
          </View>
        )}
      </View>

      <View style={styles.leadFooter}>
        <Badge variant="info">{lead.source}</Badge>
        <Text style={styles.confidence}>
          {Math.round((lead.ai_confidence || 0) * 100)}% confidence
        </Text>
        <TouchableOpacity onPress={() => handleDelete(lead.id, lead.name)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const categories = ['', 'hot', 'warm', 'cold'];
  const sources = ['', 'web_search', 'google_maps', 'zillow', 'nextdoor'];

  return (
    <View style={styles.container}>
      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <StatCard>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{stats.totalLeads}</Text>
          </StatCard>
          <StatCard>
            <Text style={styles.statLabel}>Hot</Text>
            <Text style={[styles.statValue, { color: colors.hot }]}>{stats.scoreDistribution?.hot || 0}</Text>
          </StatCard>
          <StatCard>
            <Text style={styles.statLabel}>Warm</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>{stats.scoreDistribution?.warm || 0}</Text>
          </StatCard>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchLeads}
          returnKeyType="search"
        />
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat || 'all-cat'}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
              {cat || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterDivider} />
        {sources.map((src) => (
          <TouchableOpacity
            key={src || 'all-src'}
            style={[styles.filterChip, selectedSource === src && styles.filterChipActive]}
            onPress={() => setSelectedSource(src)}
          >
            <Text style={[styles.filterChipText, selectedSource === src && styles.filterChipTextActive]}>
              {src ? src.replace('_', ' ') : 'All Sources'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Leads list */}
      <FlatList
        data={leads}
        renderItem={renderLead}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.emptyText}>No leads found</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  statLabel: { color: colors.textSecondary, fontSize: fontSize.xs },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', marginTop: 2 },
  searchContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  searchInput: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    color: colors.text, fontSize: fontSize.md,
    borderWidth: 1, borderColor: colors.border,
  },
  filterRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm, maxHeight: 44 },
  filterChip: {
    backgroundColor: colors.surface, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { color: colors.textSecondary, fontSize: fontSize.sm },
  filterChipTextActive: { color: colors.white },
  filterDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.sm },
  listContent: { padding: spacing.lg, paddingBottom: 100 },
  leadCard: { marginBottom: spacing.sm },
  leadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  leadName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  leadAddress: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  scoreContainer: { alignItems: 'center', marginLeft: spacing.md },
  scoreText: { fontSize: fontSize.xl, fontWeight: '800' },
  scoreLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  leadDetails: { marginTop: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  detailIcon: { fontSize: 14, marginRight: spacing.sm },
  detailText: { color: colors.textSecondary, fontSize: fontSize.sm, flex: 1 },
  leadFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  confidence: { color: colors.textMuted, fontSize: fontSize.xs },
  deleteText: { color: colors.error, fontSize: fontSize.sm, fontWeight: '600' },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: fontSize.md },
});
