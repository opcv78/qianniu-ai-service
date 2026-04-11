/**
 * 上传预览页 - 简化版
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Appbar } from 'react-native-paper';
import { router } from 'expo-router';

export default function UploadScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="上传图片" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>请选择图片</Text>
            </View>
          </Card.Content>
        </Card>

        <Button mode="contained" onPress={() => router.push('/')} style={styles.button}>
          返回首页
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16, justifyContent: 'center' },
  card: { marginBottom: 24 },
  placeholder: { height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8 },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderText: { fontSize: 14, color: '#666' },
  button: { marginTop: 16 },
});
