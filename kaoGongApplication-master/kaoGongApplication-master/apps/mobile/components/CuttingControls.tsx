/**
 * 交互式切割控制组件
 * 允许用户手动控制切割平面的位置和角度
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Card, Button, Slider, SegmentedButtons, Chip } from 'react-native-paper';
import type { SpatialModelData, CuttingPlane, SectionInfo } from '@kao-gong/shared';

interface CuttingControlsProps {
  modelData: SpatialModelData;
  cuttingAngle: number;
  cuttingDirection: 'horizontal' | 'vertical' | 'diagonal';
  sectionPosition: number;
  showSection: boolean;
  onAngleChange: (angle: number) => void;
  onDirectionChange: (direction: 'horizontal' | 'vertical' | 'diagonal') => void;
  onPositionChange: (position: number) => void;
  onToggleSection: () => void;
}

export const CuttingControls: React.FC<CuttingControlsProps> = ({
  modelData,
  cuttingAngle,
  cuttingDirection,
  sectionPosition,
  showSection,
  onAngleChange,
  onDirectionChange,
  onPositionChange,
  onToggleSection,
}) => {
  const sections = modelData.cuttingInfo?.sections || [];

  // 获取当前截面信息
  const getCurrentSection = (): SectionInfo | null => {
    return sections[0] || null;
  };

  const currentSection = getCurrentSection();

  // 截面形状描述
  const getSectionShapeDescription = () => {
    if (!showSection) return '点击"显示截面"查看';

    switch (currentSection?.shape) {
      case 'circle':
        return '圆形';
      case 'ellipse':
        return '椭圆形';
      case 'triangle':
        return '三角形';
      case 'rectangle':
        return '矩形';
      case 'polygon':
        return '多边形';
      default:
        return '未知形状';
    }
  };

  return (
    <View style={styles.container}>
      {/* 截面显示控制 */}
      <Card style={styles.card}>
        <Card.Title title="截面控制" />
        <Card.Content>
          <View style={styles.row}>
            <Button
              mode={showSection ? 'contained' : 'outlined'}
              onPress={onToggleSection}
              style={styles.button}
            >
              {showSection ? '隐藏截面' : '显示截面'}
            </Button>
          </View>

          {showSection && (
            <>
              {/* 切割方向选择 */}
              <Text style={styles.label}>切割方向</Text>
              <SegmentedButtons
                value={cuttingDirection}
                onValueChange={(v) => onDirectionChange(v as 'horizontal' | 'vertical' | 'diagonal')}
                buttons={[
                  { value: 'horizontal', label: '水平' },
                  { value: 'vertical', label: '垂直' },
                  { value: 'diagonal', label: '斜切' },
                ]}
                style={styles.segmentedButtons}
              />

              {/* 切割角度 */}
              {cuttingDirection === 'diagonal' && (
                <>
                  <Text style={styles.label}>切割角度: {cuttingAngle}°</Text>
                  <Slider
                    value={cuttingAngle}
                    onValueChange={onAngleChange}
                    min={0}
                    max={90}
                    step={5}
                    style={styles.slider}
                  />
                  <View style={styles.angleButtons}>
                    {[0, 15, 30, 45, 60, 75, 90].map((angle) => (
                      <Chip
                        key={angle}
                        selected={cuttingAngle === angle}
                        onPress={() => onAngleChange(angle)}
                        style={styles.angleChip}
                        textStyle={styles.angleChipText}
                      >
                        {angle}°
                      </Chip>
                    ))}
                  </View>
                </>
              )}

              {/* 切割位置 */}
              <Text style={styles.label}>切割位置: {(sectionPosition * 100).toFixed(0)}%</Text>
              <Slider
                value={sectionPosition}
                onValueChange={onPositionChange}
                min={0}
                max={1}
                step={0.05}
                style={styles.slider}
              />
            </>
          )}
        </Card.Content>
      </Card>

      {/* 截面信息 */}
      {showSection && (
        <Card style={styles.card}>
          <Card.Title title="截面信息" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>截面形状:</Text>
              <Text style={styles.infoValue}>{getSectionShapeDescription()}</Text>
            </View>
            {currentSection?.description && (
              <Text style={styles.description}>{currentSection.description}</Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* 提示信息 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 操作提示</Text>
            <Text style={styles.tipsItem}>• 单指拖动旋转模型</Text>
            <Text style={styles.tipsItem}>• 双指捏合缩放大小</Text>
            <Text style={styles.tipsItem}>• 调整滑块改变切割位置</Text>
            <Text style={styles.tipsItem}>• 选择不同方向查看不同截面</Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

// ============================================
// 折叠控制组件
// ============================================

interface FoldingControlsProps {
  modelData: SpatialModelData;
  expanded: boolean;
  progress: number;
  highlightedFace: string | null;
  onToggleExpand: () => void;
  onProgressChange: (progress: number) => void;
  onHighlightFace: (faceId: string | null) => void;
}

export const FoldingControls: React.FC<FoldingControlsProps> = ({
  modelData,
  expanded,
  progress,
  highlightedFace,
  onToggleExpand,
  onProgressChange,
  onHighlightFace,
}) => {
  const faces = modelData.faces || [];
  const foldingInfo = modelData.foldingInfo;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="折叠控制" />
        <Card.Content>
          {/* 展开/折叠按钮 */}
          <View style={styles.row}>
            <Button
              mode={expanded ? 'outlined' : 'contained'}
              onPress={() => {
                onToggleExpand();
                onProgressChange(0);
              }}
              style={styles.button}
            >
              折叠
            </Button>
            <Button
              mode={expanded ? 'contained' : 'outlined'}
              onPress={() => {
                onToggleExpand();
                onProgressChange(1);
              }}
              style={styles.button}
            >
              展开
            </Button>
          </View>

          {/* 折叠进度滑块 */}
          <Text style={styles.label}>折叠进度: {(progress * 100).toFixed(0)}%</Text>
          <Slider
            value={progress}
            onValueChange={onProgressChange}
            min={0}
            max={1}
            step={0.01}
            style={styles.slider}
          />

          {/* 面选择 */}
          <Text style={styles.label}>高亮面:</Text>
          <View style={styles.faceButtons}>
            {faces.map((face) => (
              <Chip
                key={face.id}
                selected={highlightedFace === face.id}
                onPress={() => onHighlightFace(highlightedFace === face.id ? null : face.id)}
                style={[styles.faceChip, highlightedFace === face.id && { backgroundColor: face.color || '#4CAF50' }]}
                textStyle={highlightedFace === face.id ? { color: '#fff' } : {}}
              >
                {face.name}
              </Chip>
            ))}
          </View>

          {/* 折叠步骤提示 */}
          {foldingInfo?.foldingSteps && (
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsTitle}>折叠步骤:</Text>
              {foldingInfo.foldingSteps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 模型信息 */}
      <Card style={styles.card}>
        <Card.Title title="模型信息" />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>类型:</Text>
            <Text style={styles.infoValue}>{modelData.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>尺寸:</Text>
            <Text style={styles.infoValue}>
              {modelData.dimensions?.length?.toFixed(1) || '1'} × {modelData.dimensions?.width?.toFixed(1) || '1'} × {modelData.dimensions?.height?.toFixed(1) || '1'}
            </Text>
          </View>
          {modelData.features && modelData.features.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>特征:</Text>
              <Text style={styles.infoValue}>{modelData.features.map(f => f.description).join(', ')}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

// ============================================
// 视图控制组件
// ============================================

interface ViewControlsProps {
  modelData: SpatialModelData;
  currentView: 'front' | 'side' | 'top' | 'isometric';
  onViewChange: (view: 'front' | 'side' | 'top' | 'isometric') => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
}

export const ViewControls: React.FC<ViewControlsProps> = ({
  modelData,
  currentView,
  onViewChange,
  autoRotate,
  onToggleAutoRotate,
}) => {
  const viewInfo = modelData.viewInfo;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="视图控制" />
        <Card.Content>
          <SegmentedButtons
            value={currentView}
            onValueChange={(v) => onViewChange(v as 'front' | 'side' | 'top' | 'isometric')}
            buttons={[
              { value: 'front', label: '正面' },
              { value: 'side', label: '侧面' },
              { value: 'top', label: '顶部' },
              { value: 'isometric', label: '等轴' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.row}>
            <Button
              mode={autoRotate ? 'contained' : 'outlined'}
              onPress={onToggleAutoRotate}
              style={styles.button}
            >
              {autoRotate ? '停止旋转' : '自动旋转'}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* 视图信息 */}
      {viewInfo && (
        <Card style={styles.card}>
          <Card.Title title="视图信息" />
          <Card.Content>
            {viewInfo.frontView && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>正面视图:</Text>
                <Text style={styles.infoValue}>{viewInfo.frontView}</Text>
              </View>
            )}
            {viewInfo.sideView && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>侧面视图:</Text>
                <Text style={styles.infoValue}>{viewInfo.sideView}</Text>
              </View>
            )}
            {viewInfo.topView && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>俯视图:</Text>
                <Text style={styles.infoValue}>{viewInfo.topView}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  slider: {
    marginBottom: 12,
  },
  angleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  angleChip: {
    margin: 2,
  },
  angleChipText: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginTop: 8,
  },
  faceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  faceChip: {
    margin: 2,
  },
  stepsContainer: {
    marginTop: 12,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
  },
  tipsContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  tipsItem: {
    fontSize: 12,
    color: '#555',
    marginLeft: 8,
    marginBottom: 4,
  },
});

export default CuttingControls;
