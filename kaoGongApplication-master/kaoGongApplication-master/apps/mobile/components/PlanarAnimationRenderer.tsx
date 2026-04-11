/**
 * 平面图形动画渲染器
 * 支持所有题型的动画展示
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, Animated, Dimensions } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import type { AnimationPlan, AnimationStep } from '@kao-gong/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = Math.min(80, (SCREEN_WIDTH - 64) / 3);

// 颜色配置
const COLORS = {
  highlight: '#FF6B6B',
  highlight2: '#4ECDC4',
  highlight3: '#FFE66D',
  arrow: '#2196F3',
  circle: '#FF5722',
  cross: '#E91E63',
  text: '#333333',
  grid: '#E0E0E0',
  cell: '#FFFFFF',
  black: '#333333',
  white: '#FFFFFF',
  overlay: 'rgba(100, 100, 255, 0.3)',
};

interface PlanarAnimationRendererProps {
  animationPlan: AnimationPlan;
  imageUrl?: string;
  imageBase64?: string;
  autoPlay?: boolean;
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
}

// 九宫格渲染器
const GridRenderer: React.FC<{
  rows: number;
  cols: number;
  cells: Map<string, CellData>;
  highlightCells: Map<string, HighlightData>;
  animations: Map<string, Animated.Value>;
}> = ({ rows, cols, cells, highlightCells, animations }) => {
  const grid: React.ReactNode[] = [];

  for (let r = 0; r < rows; r++) {
    const row: React.ReactNode[] = [];
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`;
      const cellData = cells.get(key);
      const highlight = highlightCells.get(key);
      const animValue = animations.get(key);

      row.push(
        <Animated.View
          key={key}
          style={[
            styles.cell,
            {
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: cellData?.color || COLORS.cell,
              borderColor: COLORS.grid,
              transform: animValue ? [
                { translateX: animValue.x || 0 },
                { translateY: animValue.y || 0 },
                { rotate: (animValue.rotate || '0deg') },
                { scale: animValue.scale || 1 },
              ] : undefined,
            },
            highlight && {
              borderWidth: 3,
              borderColor: highlight.color,
              backgroundColor: highlight.bgColor || cellData?.color || COLORS.cell,
            },
          ]}
        >
          {cellData?.content && (
            <Text style={[styles.cellContent, cellData.textStyle]}>
              {cellData.content}
            </Text>
          )}
          {highlight?.text && (
            <Text style={styles.highlightText}>{highlight.text}</Text>
          )}
        </Animated.View>
      );
    }
    grid.push(
      <View key={`row-${r}`} style={styles.row}>
        {row}
      </View>
    );
  }

  return <View style={styles.grid}>{grid}</View>;
};

// 单元格数据接口
interface CellData {
  content?: string;
  color?: string;
  textStyle?: any;
  shape?: 'circle' | 'square' | 'triangle';
}

// 高亮数据接口
interface HighlightData {
  color: string;
  bgColor?: string;
  text?: string;
}

// 动画值接口
interface AnimationValues {
  x?: Animated.Value;
  y?: Animated.Value;
  rotate?: Animated.Value;
  scale?: Animated.Value;
  opacity?: Animated.Value;
}

export const PlanarAnimationRenderer: React.FC<PlanarAnimationRendererProps> = ({
  animationPlan,
  autoPlay = false,
  onStepChange,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const [highlights, setHighlights] = useState<Map<string, HighlightData>>(new Map());
  const [annotations, setAnnotations] = useState<React.ReactNode[]>([]);
  const [narration, setNarration] = useState('');

  const animationRefs = useRef<Map<string, AnimationValues>>(new Map());
  const animatedValues = useRef<Map<string, Animated.Value>>(new Map());

  const gridConfig = animationPlan.gridConfig || { rows: 3, cols: 3 };
  const steps = animationPlan.steps || [];

  // 初始化单元格
  useEffect(() => {
    const newCells = new Map<string, CellData>();
    // 默认初始化空单元格
    for (let r = 0; r < gridConfig.rows; r++) {
      for (let c = 0; c < gridConfig.cols; c++) {
        newCells.set(`${r}-${c}`, { color: COLORS.cell });
      }
    }
    setCells(newCells);
  }, [gridConfig]);

  // 执行单个动画步骤
  const executeStep = async (step: AnimationStep, index: number) => {
    setCurrentStep(index);
    setNarration(step.narration || '');
    onStepChange?.(index);

    const { action, target, payload, durationMs = 1000 } = step;

    switch (action) {
      case 'highlight': {
        const newHighlights = new Map(highlights);
        if (target.type === 'cell' && target.index) {
          const [row, col] = target.index as [number, number];
          newHighlights.set(`${row}-${col}`, {
            color: payload?.color || COLORS.highlight,
            bgColor: payload?.bgColor,
            text: payload?.text,
          });
        } else if (target.type === 'row' && typeof target.index === 'number') {
          for (let c = 0; c < gridConfig.cols; c++) {
            newHighlights.set(`${target.index}-${c}`, {
              color: payload?.color || COLORS.highlight,
            });
          }
        } else if (target.type === 'column' && typeof target.index === 'number') {
          for (let r = 0; r < gridConfig.rows; r++) {
            newHighlights.set(`${r}-${target.index}`, {
              color: payload?.color || COLORS.highlight,
            });
          }
        } else if (target.type === 'whole') {
          for (let r = 0; r < gridConfig.rows; r++) {
            for (let c = 0; c < gridConfig.cols; c++) {
              newHighlights.set(`${r}-${c}`, {
                color: payload?.color || COLORS.highlight,
              });
            }
          }
        }
        setHighlights(newHighlights);
        break;
      }

      case 'move': {
        if (target.type === 'cell' && target.index && payload) {
          const [row, col] = target.index as [number, number];
          const key = `${row}-${col}`;
          const { from, to, deltaX = 0, deltaY = 0 } = payload;

          const cell = cells.get(key);
          if (cell) {
            // 创建动画
            const animValue = new Animated.Value(0);
            animatedValues.current.set(key, animValue);

            Animated.timing(animValue, {
              toValue: 1,
              duration: durationMs,
              useNativeDriver: true,
            }).start();

            // 移动单元格数据到新位置
            if (to) {
              const [newRow, newCol] = to;
              const newCells = new Map(cells);
              newCells.delete(key);
              newCells.set(`${newRow}-${newCol}`, cell);
              setCells(newCells);
            }
          }
        }
        break;
      }

      case 'rotate': {
        if (target.type === 'cell' && target.index && payload) {
          const [row, col] = target.index as [number, number];
          const key = `${row}-${col}`;
          const { angle = 90 } = payload;

          // 旋转动画
          const rotateAnim = new Animated.Value(0);
          animatedValues.current.set(`${key}-rotate`, rotateAnim);

          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: durationMs,
            useNativeDriver: true,
          }).start();
        }
        break;
      }

      case 'count_emphasis': {
        if (target.type === 'cell' && target.index && payload) {
          const [row, col] = target.index as [number, number];
          const { count } = payload;

          const newHighlights = new Map(highlights);
          newHighlights.set(`${row}-${col}`, {
            color: COLORS.highlight,
            text: count?.toString(),
          });
          setHighlights(newHighlights);
        }
        break;
      }

      case 'arrow_show': {
        if (payload?.start && payload?.end) {
          // 添加箭头标注
          setAnnotations(prev => [...prev,
            <View key={`arrow-${index}`} style={styles.arrowContainer}>
              <Text>→ {payload.text || ''}</Text>
            </View>
          ]);
        }
        break;
      }

      case 'text_show': {
        setNarration(prev => prev + '\n' + (payload?.text || ''));
        break;
      }

      case 'overlay_show':
      case 'overlay_merge':
      case 'overlay_disappear':
      case 'overlay_keep': {
        // 叠加类动画
        if (payload?.sources) {
          const newHighlights = new Map(highlights);
          payload.sources.forEach(([r, c]: [number, number]) => {
            newHighlights.set(`${r}-${c}`, {
              color: COLORS.overlay,
            });
          });
          setHighlights(newHighlights);
        }
        break;
      }

      default:
        console.log(`Unknown action: ${action}`);
    }

    // 等待动画完成
    await new Promise(resolve => setTimeout(resolve, durationMs));
  };

  // 播放所有步骤
  const playAll = async () => {
    setIsPlaying(true);
    setHighlights(new Map());
    setAnnotations([]);

    for (let i = 0; i < steps.length; i++) {
      await executeStep(steps[i], i);
      // 步骤间暂停
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsPlaying(false);
    onComplete?.();
  };

  // 单步执行
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      executeStep(steps[currentStep + 1], currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      // 重置到上一步
      setHighlights(new Map());
      executeStep(steps[currentStep - 1], currentStep - 1);
    }
  };

  const reset = () => {
    setCurrentStep(-1);
    setHighlights(new Map());
    setAnnotations([]);
    setNarration('');
    setIsPlaying(false);
  };

  return (
    <View style={styles.container}>
      {/* 网格区域 */}
      <View style={styles.gridContainer}>
        <GridRenderer
          rows={gridConfig.rows}
          cols={gridConfig.cols}
          cells={cells}
          highlightCells={highlights}
          animations={animatedValues.current}
        />

        {/* 标注层 */}
        <View style={styles.annotationLayer}>
          {annotations}
        </View>
      </View>

      {/* 解说文字 */}
      {narration ? (
        <Card style={styles.narrationCard}>
          <Card.Content>
            <Text style={styles.narrationText}>{narration}</Text>
          </Card.Content>
        </Card>
      ) : null}

      {/* 控制按钮 */}
      <View style={styles.controls}>
        <Button
          mode="outlined"
          onPress={reset}
          disabled={isPlaying}
          style={styles.button}
        >
          重置
        </Button>
        <Button
          mode="outlined"
          onPress={prevStep}
          disabled={isPlaying || currentStep <= 0}
          style={styles.button}
        >
          上一步
        </Button>
        <Button
          mode="outlined"
          onPress={nextStep}
          disabled={isPlaying || currentStep >= steps.length - 1}
          style={styles.button}
        >
          下一步
        </Button>
        <Button
          mode="contained"
          onPress={playAll}
          disabled={isPlaying}
          style={styles.button}
        >
          {isPlaying ? '播放中...' : '自动播放'}
        </Button>
      </View>

      {/* 步骤进度 */}
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          步骤: {currentStep + 1} / {steps.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  cellContent: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  highlightText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.highlight,
  },
  annotationLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  arrowContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 4,
    borderRadius: 4,
  },
  narrationCard: {
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
  },
  narrationText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    gap: 8,
  },
  button: {
    flex: 1,
  },
  progress: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
});

export default PlanarAnimationRenderer;
