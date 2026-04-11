/**
 * Rule Summary Card Component
 * 规则摘要卡片组件
 */

import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Card, Divider, List } from 'react-native-paper';
import type { RuleSummaryCardProps } from '../../types';

export const RuleSummaryCard: React.FC<RuleSummaryCardProps> = ({
  name,
  description,
  details,
  keyElements,
}) => {
  return (
    <Card style={styles.card}>
      <Card.Title title="规则分析" subtitle={name} />
      <Card.Content>
        <Text style={styles.description}>{description}</Text>

        {details && details.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>关键点</Text>
            {details.map((detail, index) => (
              <View key={index} style={styles.detailItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.detailText}>{detail}</Text>
              </View>
            ))}
          </View>
        )}

        {keyElements && keyElements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>关键元素</Text>
            <View style={styles.keyElementsRow}>
              {keyElements.map((element, index) => (
                <View key={index} style={styles.keyElementBadge}>
                  <Text style={styles.keyElementText}>{element}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 8,
    lineHeight: 20,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  keyElementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keyElementBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  keyElementText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
});
