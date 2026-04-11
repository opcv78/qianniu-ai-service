import React from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, Chip, Button, IconButton } from 'react-native-paper';
import { router } from 'expo-router';

// 模拟历史数据
const HISTORY_DATA = [
  {
    id: '1',
    type: '平面类',
    subType: '位置移动',
    confidence: 95,
    date: '2024-01-07 14:30',
  },
  {
    id: '2',
    type: '平面类',
    subType: '旋转',
    confidence: 92,
    date: '2024-01-07 12:15',
  },
  {
    id: '3',
    type: '立体类',
    subType: '折叠',
    confidence: 85,
    date: '2024-01-06 18:45',
  },
];

export default function HistoryScreen() {
  const renderItem = ({ item }: { item: typeof HISTORY_DATA[0] }) => (
    <Card style={styles.itemCard} onPress={() => router.push('/')}>
      <View style={styles.itemContent}>
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailIcon}>📷</Text>
        </View>
        <View style={styles.itemInfo}>
          <View style={styles.itemHeader}>
            <Chip
              mode="contained"
              style={[
                styles.typeChip,
                { backgroundColor: item.type === '平面类' ? '#4CAF50' : '#FF9800' },
              ]}
            >
              {item.type}
            </Chip>
            <Text style={styles.itemDate}>{item.date}</Text>
          </View>
          <Text style={styles.itemSubType}>{item.subType}</Text>
          <Text style={styles.confidence}>置信度: {item.confidence}%</Text>
        </View>
        <IconButton icon="chevron-right" size={20} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="历史记录" />
      </Appbar.Header>

      {HISTORY_DATA.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>暂无历史记录</Text>
          <Text style={styles.emptySubtext}>分析过的题目会显示在这里</Text>
          <Button mode="contained" onPress={() => router.push('/')} style={styles.startButton}>
            开始分析
          </Button>
        </View>
      ) : (
        <FlatList
          data={HISTORY_DATA}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#666', marginBottom: 24 },
  startButton: { paddingHorizontal: 32 },
  listContent: { padding: 16 },
  itemCard: { marginBottom: 12 },
  itemContent: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  thumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  thumbnailIcon: { fontSize: 24 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  typeChip: { height: 24, marginRight: 8 },
  itemDate: { fontSize: 11, color: '#999' },
  itemSubType: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  confidence: { fontSize: 11, color: '#4CAF50' },
});
