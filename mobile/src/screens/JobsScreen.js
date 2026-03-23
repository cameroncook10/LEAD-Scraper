import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { getJobs, getJobDetails } from '../services/api';

export default function JobsScreen() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getJobs(null, 50);
      setJobs(data.jobs || []);
    } catch (e) {
      console.error('Failed to load jobs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetails = useCallback(async (jobId) => {
    try {
      const data = await getJobDetails(jobId);
      setSelectedJob(data);
    } catch (e) {
      console.error('Failed to load details:', e);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  useEffect(() => {
    if (selectedJob?.job?.id) {
      const interval = setInterval(() => fetchDetails(selectedJob.job.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedJob?.job?.id, fetchDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const handleSelectJob = async (job) => {
    await fetchDetails(job.id);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Selected job details */}
      {selectedJob && (
        <Card style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailTitle}>{selectedJob.job.source}</Text>
              <Text style={styles.detailId}>ID: {selectedJob.job.id?.slice(0, 8)}...</Text>
            </View>
            <StatusBadge status={selectedJob.job.status} />
          </View>

          {selectedJob.job.status === 'running' && (
            <ProgressBar progress={selectedJob.progress || 0} label="Progress" />
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statNum}>{selectedJob.job.total_leads || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Processed</Text>
              <Text style={styles.statNum}>{selectedJob.job.processed_leads || 0}</Text>
            </View>
          </View>

          {selectedJob.job.started_at && (
            <Text style={styles.timestamp}>
              Started: {new Date(selectedJob.job.started_at).toLocaleString()}
            </Text>
          )}
          {selectedJob.job.completed_at && (
            <Text style={styles.timestamp}>
              Completed: {new Date(selectedJob.job.completed_at).toLocaleString()}
            </Text>
          )}

          {selectedJob.job.error_message && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{selectedJob.job.error_message}</Text>
            </View>
          )}

          {/* Logs */}
          {selectedJob.logs?.length > 0 && (
            <View style={styles.logsSection}>
              <Text style={styles.logsTitle}>Logs</Text>
              {selectedJob.logs.slice(0, 10).map((log, i) => (
                <View key={i} style={styles.logRow}>
                  <Text style={styles.logMessage} numberOfLines={2}>{log.message}</Text>
                  <Text style={styles.logTime}>
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      )}

      {/* Jobs list */}
      <Text style={styles.sectionTitle}>All Jobs ({jobs.length})</Text>
      {jobs.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No scrape jobs yet. Start one from the Dashboard!</Text>
        </Card>
      ) : (
        jobs.map((job) => (
          <TouchableOpacity
            key={job.id}
            onPress={() => handleSelectJob(job)}
            activeOpacity={0.7}
          >
            <Card style={[
              styles.jobCard,
              selectedJob?.job?.id === job.id && styles.jobCardSelected
            ]}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobSource}>{job.source}</Text>
                <StatusBadge status={job.status} />
              </View>
              <Text style={styles.jobTime}>
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </Text>
              {job.total_leads > 0 && (
                <Text style={styles.jobLeads}>
                  {job.processed_leads} / {job.total_leads} leads
                </Text>
              )}
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.md, marginTop: spacing.lg },
  detailCard: { borderWidth: 1, borderColor: colors.primary },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  detailTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  detailId: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.md },
  statBox: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.md },
  statLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  statNum: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700', marginTop: spacing.xs },
  timestamp: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
  errorBox: { backgroundColor: colors.errorBg, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md },
  errorText: { color: colors.error, fontSize: fontSize.sm },
  logsSection: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  logsTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  logRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  logMessage: { color: colors.textSecondary, fontSize: fontSize.sm },
  logTime: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  jobCard: { borderWidth: 1, borderColor: 'transparent' },
  jobCardSelected: { borderColor: colors.primary },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobSource: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  jobTime: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  jobLeads: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  emptyText: { color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
});
