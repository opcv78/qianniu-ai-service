/**
 * Animation Player Component
 * 动画播放器组件
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import Svg, { Rect, Circle, G, Text as SvgText, Line, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import type { AnimationPlayerProps } from '../../types';
import type { AnimationPlan, AnimationStep } from '@kao-gong/shared';
import { createTimelinePlayer, type TimelinePlayer } from '@kao-gong/animation-core';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SVG_SIZE = SCREEN_WIDTH - 48;

export const AnimationPlayer: React.FC<AnimationPlayerProps> = ({
  animationPlan,
  imageUri,
  autoPlay = false,
  onStepChange,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [narration, setNarration] = useState('');
  const playerRef = useRef<TimelinePlayer | null>(null);

  // 动画值
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // 初始化播放器
  useEffect(() => {
    if (!animationPlan || animationPlan.steps.length === 0) return;

    playerRef.current = createTimelinePlayer(animationPlan, {
      autoPlay,
      stepDelay: 200,
      speed: 1,
    });

    playerRef.current.on('step_start', (_, data) => {
      if (data?.currentStepIndex !== undefined) {
        setCurrentStepIndex(data.currentStepIndex);
        setNarration(data.step?.narration ?? '');
        onStepChange?.(data.currentStepIndex);
      }
    });

    playerRef.current.on('complete', () => {
      setIsPlaying(false);
      onComplete?.();
    });

    return () => {
      playerRef.current?.destroy();
    };
  }, [animationPlan]);

  // 播放控制
  const handlePlay = useCallback(() => {
    if (playerRef.current) {
      setIsPlaying(true);
      playerRef.current.play();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (playerRef.current) {
      setIsPlaying(false);
      playerRef.current.pause();
    }
  }, []);

  const handleReset = useCallback(() => {
    if (playerRef.current) {
      setIsPlaying(false);
      setCurrentStepIndex(0);
      playerRef.current.reset();
    }
  }, []);

  const handleNext = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.nextStep();
    }
  }, []);

  const handlePrev = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.prevStep();
    }
  }, []);

  if (!animationPlan || animationPlan.steps.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>暂无动画数据</Text>
        </View>
      </View>
    );
  }

  const steps = animationPlan.steps;
  const gridConfig = animationPlan.gridConfig ?? { rows: 3, cols: 3 };
  const cellWidth = SVG_SIZE / gridConfig.cols;
  const cellHeight = SVG_SIZE / gridConfig.rows;

  return (
    <View style={styles.container}>
      {/* SVG 动画区域 */}
      <View style={styles.svgContainer}>
        <Svg width={SVG_SIZE} height={SVG_SIZE} style={styles.svg}>
          {/* 背景网格 */}
          <G>
            {Array.from({ length: gridConfig.rows + 1 }).map((_, i) => (
              <Line
                key={`h-${i}`}
                x1={0}
                y1={i * cellHeight}
                x2={SVG_SIZE}
                y2={i * cellHeight}
                stroke="#e0e0e0"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: gridConfig.cols + 1 }).map((_, i) => (
              <Line
                key={`v-${i}`}
                x1={i * cellWidth}
                y1={0}
                x2={i * cellWidth}
                y2={SVG_SIZE}
                stroke="#e0e0e0"
                strokeWidth={1}
              />
            ))}
          </G>

          {/* 当前步骤的高亮 */}
          {steps[currentStepIndex] && (
            <CurrentStepRenderer
              step={steps[currentStepIndex]}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
            />
          )}
        </Svg>

        {/* 原图叠加层（如果有） */}
        {imageUri && (
          <View style={styles.imageOverlay}>
            <Text style={styles.overlayText}>原图叠加显示区域</Text>
          </View>
        )}
      </View>

      {/* 旁白显示 */}
      <View style={styles.narrationContainer}>
        <Text style={styles.narrationText}>{narration || '点击播放开始解析'}</Text>
      </View>

      {/* 进度显示 */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          步骤 {currentStepIndex + 1} / {steps.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStepIndex + 1) / steps.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* 控制按钮 */}
      <View style={styles.controls}>
        <IconButton
          icon="skip-previous"
          size={32}
          onPress={handlePrev}
          disabled={currentStepIndex === 0}
        />
        {isPlaying ? (
          <IconButton
            icon="pause"
            size={48}
            onPress={handlePause}
            mode="contained"
            containerColor="#4CAF50"
          />
        ) : (
          <IconButton
            icon="play"
            size={48}
            onPress={handlePlay}
            mode="contained"
            containerColor="#4CAF50"
          />
        )}
        <IconButton
          icon="skip-next"
          size={32}
          onPress={handleNext}
          disabled={currentStepIndex >= steps.length - 1}
        />
        <IconButton
          icon="refresh"
          size={24}
          onPress={handleReset}
        />
      </View>
    </View>
  );
};

// 当前步骤渲染组件
interface CurrentStepRendererProps {
  step: AnimationStep;
  cellWidth: number;
  cellHeight: number;
}

const CurrentStepRenderer: React.FC<CurrentStepRendererProps> = ({
  step,
  cellWidth,
  cellHeight,
}) => {
  const { action, target, payload } = step;

  // 计算目标位置
  const getTargetPosition = () => {
    if (target.type === 'cell' && Array.isArray(target.index)) {
      const [row, col] = target.index;
      return {
        x: col * cellWidth,
        y: row * cellHeight,
      };
    }
    return { x: 0, y: 0 };
  };

  const pos = getTargetPosition();
  const centerX = pos.x + cellWidth / 2;
  const centerY = pos.y + cellHeight / 2;

  // 根据动作类型渲染不同的效果
  switch (action) {
    case 'highlight':
      return (
        <Rect
          x={pos.x + 4}
          y={pos.y + 4}
          width={cellWidth - 8}
          height={cellHeight - 8}
          fill={payload.color ?? '#FF6B6B'}
          fillOpacity={payload.opacity ?? 0.3}
          stroke={payload.color ?? '#FF6B6B'}
          strokeWidth={payload.borderWidth ?? 2}
          rx={4}
        />
      );

    case 'circle_show':
      return (
        <Circle
          cx={centerX}
          cy={centerY}
          r={Math.min(cellWidth, cellHeight) / 3}
          fill="none"
          stroke={payload.color ?? '#2196F3'}
          strokeWidth={payload.borderWidth ?? 3}
        />
      );

    case 'arrow_show':
      if (payload.start && payload.end) {
        const startX = pos.x + payload.start[0] * cellWidth;
        const startY = pos.y + payload.start[1] * cellHeight;
        const endX = pos.x + payload.end[0] * cellWidth;
        const endY = pos.y + payload.end[1] * cellHeight;
        return (
          <Line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={payload.color ?? '#4CAF50'}
            strokeWidth={3}
            markerEnd="url(#arrowhead)"
          />
        );
      }
      return null;

    case 'text_show':
      return (
        <SvgText
          x={SVG_SIZE / 2}
          y={SVG_SIZE - 20}
          textAnchor="middle"
          fontSize={14}
          fill={payload.color ?? '#333'}
        >
          {payload.text ?? ''}
        </SvgText>
      );

    case 'count_emphasis':
      return (
        <G>
          <Circle
            cx={centerX}
            cy={centerY}
            r={20}
            fill={payload.color ?? '#FF6B6B'}
            fillOpacity={0.8}
          />
          <SvgText
            x={centerX}
            y={centerY + 6}
            textAnchor="middle"
            fontSize={18}
            fill="#fff"
            fontWeight="bold"
          >
            {payload.count ?? ''}
          </SvgText>
        </G>
      );

    default:
      // 默认显示高亮
      return (
        <Rect
          x={pos.x + 4}
          y={pos.y + 4}
          width={cellWidth - 8}
          height={cellHeight - 8}
          fill="#4CAF50"
          fillOpacity={0.2}
          stroke="#4CAF50"
          strokeWidth={2}
          rx={4}
        />
      );
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  overlayText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  narrationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  narrationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});
