import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Switch
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { Card } from '../components/Card';

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState('http://localhost:3002');
  const [authToken, setAuthToken] = useState('');
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedUrl = await SecureStore.getItemAsync('api_url');
      const savedToken = await SecureStore.getItemAsync('auth_token');
      if (savedUrl) setApiUrl(savedUrl);
      if (savedToken) setAuthToken(savedToken);
    } catch (e) {
      // SecureStore not available
    }
  };

  const saveApiUrl = async () => {
    try {
      await SecureStore.setItemAsync('api_url', apiUrl);
      Alert.alert('Saved', 'API URL updated. Restart the app for changes to take effect.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  const saveToken = async () => {
    try {
      if (authToken) {
        await SecureStore.setItemAsync('auth_token', authToken);
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
      Alert.alert('Saved', 'Auth token updated');
    } catch (e) {
      Alert.alert('Error', 'Failed to save token');
    }
  };

  const clearData = () => {
    Alert.alert('Clear All Data', 'This will remove all local settings and tokens.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync('api_url');
            await SecureStore.deleteItemAsync('auth_token');
            setApiUrl('http://localhost:3002');
            setAuthToken('');
            Alert.alert('Done', 'All local data cleared');
          } catch (e) {
            Alert.alert('Error', 'Failed to clear data');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Connection */}
      <Text style={styles.sectionTitle}>Connection</Text>
      <Card>
        <Text style={styles.fieldLabel}>API Server URL</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="http://localhost:3002"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={saveApiUrl}>
          <Text style={styles.saveBtnText}>Save URL</Text>
        </TouchableOpacity>
      </Card>

      {/* Authentication */}
      <Text style={styles.sectionTitle}>Authentication</Text>
      <Card>
        <Text style={styles.fieldLabel}>JWT Token</Text>
        <TextInput
          style={[styles.input, styles.tokenInput]}
          value={authToken}
          onChangeText={setAuthToken}
          placeholder="Paste your JWT token"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          multiline
        />
        <TouchableOpacity style={styles.saveBtn} onPress={saveToken}>
          <Text style={styles.saveBtnText}>Save Token</Text>
        </TouchableOpacity>
      </Card>

      {/* Security */}
      <Text style={styles.sectionTitle}>Security</Text>
      <Card>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Field-Level Encryption</Text>
            <Text style={styles.switchDesc}>Encrypt sensitive data (email, phone) with AES-256</Text>
          </View>
          <Switch
            value={encryptionEnabled}
            onValueChange={setEncryptionEnabled}
            trackColor={{ false: colors.surfaceLight, true: colors.primaryLight }}
            thumbColor={encryptionEnabled ? colors.primary : colors.textMuted}
          />
        </View>

        <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg }]}>
          <View>
            <Text style={styles.switchLabel}>Push Notifications</Text>
            <Text style={styles.switchDesc}>Get notified when scrape jobs complete</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.surfaceLight, true: colors.primaryLight }}
            thumbColor={notifications ? colors.primary : colors.textMuted}
          />
        </View>
      </Card>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <Card>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>2.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Encryption</Text>
          <Text style={[styles.aboutValue, { color: colors.success }]}>AES-256-GCM</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>AI Engine</Text>
          <Text style={styles.aboutValue}>Claude Haiku</Text>
        </View>
      </Card>

      {/* Danger zone */}
      <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
      <Card>
        <TouchableOpacity style={styles.dangerBtn} onPress={clearData}>
          <Text style={styles.dangerBtnText}>Clear All Local Data</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md, marginTop: spacing.lg },
  fieldLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    color: colors.text, fontSize: fontSize.md,
    borderWidth: 1, borderColor: colors.border,
  },
  tokenInput: { minHeight: 60, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  switchLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '500' },
  switchDesc: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2, maxWidth: 250 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  aboutLabel: { color: colors.textSecondary, fontSize: fontSize.md },
  aboutValue: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  dangerBtn: { backgroundColor: colors.errorBg, borderRadius: borderRadius.md, paddingVertical: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.error },
  dangerBtnText: { color: colors.error, fontSize: fontSize.md, fontWeight: '700' },
});
