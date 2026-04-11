import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, List, Divider, Snackbar } from 'react-native-paper';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [showDebug, setShowDebug] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="设置" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Title title="API 设置" />
          <Card.Content>
            <Text style={styles.label}>API 地址</Text>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="http://localhost:3000"
              autoCapitalize="none"
            />
            <Text style={styles.hint}>后端服务的地址</Text>
            <Divider style={styles.divider} />
            <Text style={styles.label}>当前模型</Text>
            <Text style={styles.value}>glm-4v-flash</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="显示设置" />
          <Card.Content>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>演示模式</Text>
                <Text style={styles.settingDesc}>使用内置演示数据</Text>
              </View>
              <Switch value={demoMode} onValueChange={setDemoMode} />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="关于" />
          <Card.Content>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>版本</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>应用名称</Text>
              <Text style={styles.aboutValue}>图推动态解析</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)}>
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#fff' },
  value: { fontSize: 14, color: '#333' },
  hint: { fontSize: 12, color: '#999', marginTop: 4, marginBottom: 12 },
  divider: { marginVertical: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  settingInfo: { flex: 1, marginRight: 16 },
  settingTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  settingDesc: { fontSize: 12, color: '#666' },
  aboutItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  aboutLabel: { fontSize: 14, color: '#666' },
  aboutValue: { fontSize: 14, color: '#333' },
});
