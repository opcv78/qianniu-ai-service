/**
 * Semi Auto Notice Component
 * 半自动模式提示组件
 */

import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Button, Card, List, Chip } from 'react-native-paper';
import type { SemiAutoNoticeProps } from '../../types';
import type { SemiAutoConfig } from '@kao-gong/shared';

export const SemiAutoNotice: React.FC<SemiAutoNoticeProps> = ({
  semiAutoConfig,
  onEnterSemiAuto,
}) => {
  if (!semiAutoConfig.enabled) {
    return null;
  }

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      folding: '折叠模式',
      section: '截面模式',
      assembly: '拼图模式',
      view: '视图模式',
    };
    return labels[mode] ?? mode;
  };

  const getModeIcon = (mode: string) => {
    const icons: Record<string, string> = {
      folding: 'cube-outline',
      section: 'scissors-cutting',
      assembly: 'puzzle',
      view: 'eye-outline',
    };
    return icons[mode] ?? 'cube-outline';
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title="立体类题目"
        subtitle="建议进入半自动解析模式"
        left={(props) => <List.Icon {...props} icon="cube-outline" />}
      />
      <Card.Content>
        {/* 模式标签 */}
        <View style={styles.modeContainer}>
          <Chip icon={getModeIcon(semiAutoConfig.mode)} mode="outlined">
            {getModeLabel(semiAutoConfig.mode)}
          </Chip>
        </View>

        {/* 辅助说明 */}
        <Text style={styles.helperText}>{semiAutoConfig.helperText}</Text>

        {/* 需要的用户动作 */}
        {semiAutoConfig.requiredUserActions.length > 0 && (
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>解析步骤：</Text>
            {semiAutoConfig.requiredUserActions.map((action, index) => (
              <View key={index} style={styles.actionItem}>
                <Text style={styles.actionNumber}>{index + 1}</Text>
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 提示步骤 */}
        {semiAutoConfig.hintSteps && semiAutoConfig.hintSteps.length > 0 && (
          <View style={styles.hintsContainer}>
            <Text style={styles.hintsTitle}>提示：</Text>
            {semiAutoConfig.hintSteps.map((hint, index) => (
              <View key={index} style={styles.hintItem}>
                <Text style={styles.hintText}>• {hint.description}</Text>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          onPress={onEnterSemiAuto}
          icon="arrow-right"
        >
          进入半自动模式
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  modeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 16,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  actionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  hintsContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  hintsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  hintItem: {
    marginBottom: 4,
  },
  hintText: {
    fontSize: 13,
    color: '#555',
  },
  actions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
