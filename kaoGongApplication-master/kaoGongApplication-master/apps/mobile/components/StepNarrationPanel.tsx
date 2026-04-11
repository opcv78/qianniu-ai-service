/**
 * Step Narration Panel Component
 * 步骤旁白面板组件
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import type { StepNarrationPanelProps } from '../../types';

export const StepNarrationPanel: React.FC<StepNarrationPanelProps> = ({
  narration,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepIndicator}>
          步骤 {stepIndex + 1} / {totalSteps}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.narration}>{narration}</Text>
      </View>

      <View style={styles.controls}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={onPrev}
          disabled={stepIndex === 0 || !onPrev}
          mode="outlined"
        />
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={onNext}
          disabled={stepIndex >= totalSteps - 1 || !onNext}
          mode="outlined"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicator: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  content: {
    minHeight: 60,
    justifyContent: 'center',
  },
  narration: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
});
