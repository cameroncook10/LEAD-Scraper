import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, RefreshControl, Modal
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { Card } from '../components/Card';
import { StatusBadge, Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { getCampaigns, createCampaign, sendCampaign, deleteCampaign } from '../services/api';

export default function CampaignsScreen() {
  const [campaigns, setCampaigns] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'email', quality_threshold: 0.5 });

  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await getCampaigns();
      setCampaigns(data.campaigns || []);
    } catch (e) {
      console.error('Failed to load campaigns:', e);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Campaign name is required');
      return;
    }
    try {
      const data = await createCampaign(form);
      setCampaigns([data.campaign, ...campaigns]);
      setShowModal(false);
      setForm({ name: '', type: 'email', quality_threshold: 0.5 });
    } catch (e) {
      Alert.alert('Error', 'Failed to create campaign');
    }
  };

  const handleSend = (id) => {
    Alert.alert('Send Campaign', 'Send to all recipients?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send', onPress: async () => {
          try {
            const data = await sendCampaign(id);
            setCampaigns(campaigns.map(c => c.id === id ? { ...c, ...data.campaign } : c));
          } catch (e) {
            Alert.alert('Error', 'Failed to send campaign');
          }
        },
      },
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Campaign', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteCampaign(id);
            setCampaigns(campaigns.filter(c => c.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete campaign');
          }
        },
      },
    ]);
  };

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'sent' || c.status === 'scheduled').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
  };

  const typeOptions = ['email', 'sms', 'whatsapp'];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{stats.draft}</Text>
            <Text style={styles.statLabel}>Drafts</Text>
          </View>
        </View>

        {/* New campaign button */}
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.newBtnText}>+ New Campaign</Text>
        </TouchableOpacity>

        {/* Campaigns list */}
        {campaigns.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No campaigns yet</Text>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <View style={styles.campaignHeader}>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                <StatusBadge status={campaign.status} />
              </View>
              <View style={styles.campaignMeta}>
                <Badge variant="info">{campaign.type}</Badge>
                <Text style={styles.recipientCount}>
                  {campaign.recipient_count || 0} recipients
                </Text>
              </View>
              {campaign.sent_count > 0 && (
                <ProgressBar
                  progress={(campaign.sent_count / (campaign.recipient_count || 1)) * 100}
                  label="Delivery"
                  color={colors.success}
                />
              )}
              <View style={styles.campaignActions}>
                {campaign.status === 'draft' && (
                  <>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleSend(campaign.id)}>
                      <Text style={styles.actionBtnText}>Send</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(campaign.id)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create Campaign Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Campaign</Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Q1 Outreach"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {typeOptions.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                  onPress={() => setForm({ ...form, type: t })}
                >
                  <Text style={[styles.typeText, form.type === t && styles.typeTextActive]}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  statLabel: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: spacing.xs },
  newBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.lg },
  newBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  emptyText: { color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  campaignHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  campaignName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', flex: 1 },
  campaignMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  recipientCount: { color: colors.textSecondary, fontSize: fontSize.sm },
  campaignActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  actionBtnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '600' },
  deleteText: { color: colors.error, fontSize: fontSize.sm, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xxl, paddingBottom: 40 },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.xl },
  fieldLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
  input: { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: colors.background },
  typeText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  typeTextActive: { color: colors.primary },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  createBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.lg, alignItems: 'center' },
  createBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  cancelBtn: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, paddingVertical: spacing.lg, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
});
