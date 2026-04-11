/**
 * Question Type Badge Component
 * 题型标签组件
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import type { QuestionTypeBadgeProps } from '../../types';
import { useTypeName, useMajorTypeName, useTypeColor, useConfidenceText } from '../../hooks';

export const QuestionTypeBadge: React.FC<QuestionTypeBadgeProps> = ({
  majorType,
  subType,
  confidence,
}) => {
  const theme = useTheme();
  const typeName = useTypeName(subType);
  const majorTypeName = useMajorTypeName(majorType);
  const typeColor = useTypeColor(majorType);
  const confidenceText = useConfidenceText(confidence);

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#8BC34A';
    if (confidence >= 0.4) return '#FFC107';
    return '#FF9800';
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Chip
          mode="contained"
          style={[styles.typeChip, { backgroundColor: typeColor }]}
          textStyle={styles.typeChipText}
        >
          {majorTypeName}
        </Chip>
        <Chip
          mode="outlined"
          style={styles.subTypeChip}
          textStyle={styles.subTypeChipText}
        >
          {typeName}
        </Chip>
      </View>
      <View style={styles.confidenceRow}>
        <Text style={styles.confidenceLabel}>置信度: </Text>
        <View style={[styles.confidenceBar, { backgroundColor: '#e0e0e0' }]}>
          <View
            style={[
              styles.confidenceFill,
              {
                backgroundColor: getConfidenceColor(),
                width: `${(confidence ?? 0) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.confidenceValue}>
          {Math.round((confidence ?? 0) * 100)}% ({confidenceText})
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeChip: {
    marginRight: 8,
  },
  typeChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  subTypeChip: {
    borderColor: '#e0e0e0',
  },
  subTypeChipText: {
    color: '#333',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
});
