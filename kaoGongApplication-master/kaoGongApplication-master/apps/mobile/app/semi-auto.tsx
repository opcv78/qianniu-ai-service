/**
 * 半自动模式页 - 立体类题目交互式分析
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, Button, Chip, Divider } from 'react-native-paper';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere, Cone, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { router, useLocalSearchParams } from 'expo-router';

// ============================================
// 3D 组件
// ============================================

interface StepGuide {
  id: string;
  title: string;
  description: string;
  hint: string;
  completed: boolean;
}

// 可交互的立方体组件
const InteractiveCube: React.FC<{
  highlightFace?: string;
  showLabels: boolean;
  rotation: { x: number; y: number };
}> = ({ highlightFace, showLabels, rotation }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = rotation.x;
      groupRef.current.rotation.y = rotation.y;
    }
  });

  const faces = [
    { name: 'top', position: [0, 0.51, 0], rotation: [-Math.PI / 2, 0, 0], color: '#4CAF50', label: '顶面' },
    { name: 'bottom', position: [0, -0.51, 0], rotation: [Math.PI / 2, 0, 0], color: '#2196F3', label: '底面' },
    { name: 'front', position: [0, 0, 0.51], rotation: [0, 0, 0], color: '#FF9800', label: '前面' },
    { name: 'back', position: [0, 0, -0.51], rotation: [0, Math.PI, 0], color: '#9C27B0', label: '后面' },
    { name: 'left', position: [-0.51, 0, 0], rotation: [0, -Math.PI / 2, 0], color: '#E91E63', label: '左面' },
    { name: 'right', position: [0.51, 0, 0], rotation: [0, Math.PI / 2, 0], color: '#00BCD4', label: '右面' },
  ];

  return (
    <group ref={groupRef}>
      {/* 立方体主体 */}
      <Box args={[1, 1, 1]}>
        <meshStandardMaterial color="#888" transparent opacity={0.3} />
      </Box>

      {/* 各个面 */}
      {faces.map((face) => (
        <mesh
          key={face.name}
          position={face.position as [number, number, number]}
          rotation={face.rotation as [number, number, number]}
        >
          <planeGeometry args={[0.98, 0.98]} />
          <meshStandardMaterial
            color={highlightFace === face.name ? '#FF5722' : face.color}
            transparent
            opacity={highlightFace === face.name ? 0.9 : 0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* 标签 */}
      {showLabels && faces.map((face) => (
        <Html
          key={`label-${face.name}`}
          position={
            face.name === 'top' ? [0, 0.7, 0] :
            face.name === 'bottom' ? [0, -0.7, 0] :
            face.name === 'front' ? [0, 0, 0.7] :
            face.name === 'back' ? [0, 0, -0.7] :
            face.name === 'left' ? [-0.7, 0, 0] :
            [0.7, 0, 0]
          }
          center
        >
          <View style={[styles.faceLabel, { backgroundColor: highlightFace === face.name ? '#FF5722' : face.color }]}>
            <Text style={styles.faceLabelText}>{face.label}</Text>
          </View>
        </Html>
      ))}

      {/* 边框 */}
      <Box args={[1.02, 1.02, 1.02]}>
        <meshBasicMaterial color="#333" wireframe />
      </Box>
    </group>
  );
};

// 展开图组件
const UnfoldedCube: React.FC<{
  highlightFace?: string;
}> = ({ highlightFace }) => {
  const faces = [
    { name: 'top', position: [0, 2, 0], color: '#4CAF50', label: '顶面' },
    { name: 'front', position: [0, 1, 0], color: '#FF9800', label: '前面' },
    { name: 'bottom', position: [0, 0, 0], color: '#2196F3', label: '底面' },
    { name: 'back', position: [0, -1, 0], color: '#9C27B0', label: '后面' },
    { name: 'left', position: [-1, 1, 0], color: '#E91E63', label: '左面' },
    { name: 'right', position: [1, 1, 0], color: '#00BCD4', label: '右面' },
  ];

  return (
    <group position={[0, 0, 0]}>
      {faces.map((face) => (
        <group key={face.name} position={face.position as [number, number, number]}>
          <Box args={[0.9, 0.9, 0.02]}>
            <meshStandardMaterial
              color={highlightFace === face.name ? '#FF5722' : face.color}
              transparent
              opacity={highlightFace === face.name ? 0.95 : 0.8}
            />
          </Box>
          <Html position={[0, 0, 0.1]} center>
            <View style={[styles.faceLabel, { backgroundColor: highlightFace === face.name ? '#FF5722' : face.color }]}>
              <Text style={styles.faceLabelText}>{face.label}</Text>
            </View>
          </Html>
        </group>
      ))}
    </group>
  );
};

// ============================================
// 主页面组件
// ============================================

export default function SemiAutoScreen() {
  const params = useLocalSearchParams<{
    imageId?: string;
    subType?: string;
    imageUrl?: string;
  }>();

  const subType = params.subType || 'folding';

  // 步骤控制
  const [currentStep, setCurrentStep] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [highlightFace, setHighlightFace] = useState<string | undefined>();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [showUnfolded, setShowUnfolded] = useState(false);

  // 根据题型定义步骤
  const stepsByType: Record<string, StepGuide[]> = {
    folding: [
      {
        id: '1',
        title: '识别展开图',
        description: '观察展开图中的各个面及其相对位置',
        hint: '注意标记各面的位置关系',
        completed: false,
      },
      {
        id: '2',
        title: '确定基准面',
        description: '选择一个面作为基准，通常是底面或前面',
        hint: '点击"底面"按钮高亮显示',
        completed: false,
      },
      {
        id: '3',
        title: '分析相邻面',
        description: '找出与基准面相邻的面，确定折叠方向',
        hint: '相邻的面会折叠上来',
        completed: false,
      },
      {
        id: '4',
        title: '想象折叠过程',
        description: '在脑中将各面折叠成立体形状',
        hint: '可以切换到展开图查看',
        completed: false,
      },
      {
        id: '5',
        title: '验证答案',
        description: '对比选项，找出符合的立体图形',
        hint: '注意面的位置和方向',
        completed: false,
      },
    ],
    section: [
      {
        id: '1',
        title: '识别立体类型',
        description: '确定是什么立体图形（立方体、圆柱、圆锥等）',
        hint: '不同立体的截面形状不同',
        completed: false,
      },
      {
        id: '2',
        title: '确定切割方向',
        description: '分析切割平面的角度和方向',
        hint: '水平切、垂直切、斜切的截面不同',
        completed: false,
      },
      {
        id: '3',
        title: '想象截面形状',
        description: '根据切割方向想象截面的形状',
        hint: '圆、椭圆、三角形、矩形等',
        completed: false,
      },
      {
        id: '4',
        title: '选择正确答案',
        description: '对比选项，选择符合的截面形状',
        hint: '注意截面的大小关系',
        completed: false,
      },
    ],
    view_projection: [
      {
        id: '1',
        title: '观察立体图形',
        description: '仔细观察立体图形的形状和特征',
        hint: '注意特殊标记的位置',
        completed: false,
      },
      {
        id: '2',
        title: '分析视角方向',
        description: '确定题目要求从哪个方向观察',
        hint: '正面、侧面、顶部或斜上方',
        completed: false,
      },
      {
        id: '3',
        title: '想象投影形状',
        description: '在脑中将立体投影到平面',
        hint: '只看到可见的部分',
        completed: false,
      },
      {
        id: '4',
        title: '选择正确视图',
        description: '对比选项，选择符合的视图',
        hint: '注意遮挡关系',
        completed: false,
      },
    ],
    solid_assembly: [
      {
        id: '1',
        title: '分析组成',
        description: '确定需要几个小立体组合',
        hint: '数一数小立方体的数量',
        completed: false,
      },
      {
        id: '2',
        title: '观察主视图',
        description: '从正面看组合体的形状',
        hint: '主视图显示高度和宽度',
        completed: false,
      },
      {
        id: '3',
        title: '观察俯视图',
        description: '从上方看组合体的形状',
        hint: '俯视图显示长度和宽度',
        completed: false,
      },
      {
        id: '4',
        title: '综合判断',
        description: '根据视图信息确定正确的组合方式',
        hint: '注意隐藏的部分',
        completed: false,
      },
    ],
  };

  const steps = stepsByType[subType] || stepsByType.folding;

  const currentStepData = steps[currentStep];

  // 高亮指定的面
  const handleHighlightFace = (face: string) => {
    setHighlightFace(face === highlightFace ? undefined : face);
  };

  // 面按钮列表
  const faceButtons = ['top', 'bottom', 'front', 'back', 'left', 'right'];
  const faceLabels: Record<string, string> = {
    top: '顶面',
    bottom: '底面',
    front: '前面',
    back: '后面',
    left: '左面',
    right: '右面',
  };

  const getTypeTitle = () => {
    const titles: Record<string, string> = {
      folding: '折叠类题目分析',
      section: '截面类题目分析',
      view_projection: '视图类题目分析',
      solid_assembly: '立体拼图类题目分析',
    };
    return titles[subType] || '立体类题目分析';
  };

  const getTypeDescription = () => {
    const descriptions: Record<string, string> = {
      folding: '通过交互式折叠动画理解平面展开图与立体的对应关系',
      section: '分析不同切割方向下的截面形状变化',
      view_projection: '从不同角度观察立体图形，理解三视图的关系',
      solid_assembly: '理解多个小立体的组合方式和视图对应',
    };
    return descriptions[subType] || '逐步分析立体类题目';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={getTypeTitle()} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* 说明卡片 */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.description}>{getTypeDescription()}</Text>
          </Card.Content>
        </Card>

        {/* 3D 演示区 */}
        <Card style={styles.canvasCard}>
          <View style={styles.canvas}>
            <Canvas style={{ width: '100%', height: '100%' }}>
              <ambientLight intensity={0.7} />
              <pointLight position={[10, 10, 10]} />
              <directionalLight position={[5, 5, 5]} intensity={0.3} />
              <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={2}
                maxDistance={8}
              />
              {showUnfolded ? (
                <UnfoldedCube highlightFace={highlightFace} />
              ) : (
                <InteractiveCube
                  highlightFace={highlightFace}
                  showLabels={showLabels}
                  rotation={rotation}
                />
              )}
              <Grid
                infiniteGrid
                cellSize={0.5}
                cellThickness={0.3}
                cellColor="#666"
                sectionSize={1}
                sectionThickness={0.5}
                sectionColor="#888"
                fadeDistance={10}
                position={[0, -2, 0]}
              />
            </Canvas>
          </View>
        </Card>

        {/* 控制面板 */}
        <Card style={styles.card}>
          <Card.Title title="交互控制" />
          <Card.Content>
            <View style={styles.controlRow}>
              <Button
                mode={showUnfolded ? 'outlined' : 'contained'}
                onPress={() => setShowUnfolded(false)}
                style={styles.controlBtn}
                compact
              >
                立体视图
              </Button>
              <Button
                mode={showUnfolded ? 'contained' : 'outlined'}
                onPress={() => setShowUnfolded(true)}
                style={styles.controlBtn}
                compact
              >
                展开图
              </Button>
              <Button
                mode={showLabels ? 'contained' : 'outlined'}
                onPress={() => setShowLabels(!showLabels)}
                style={styles.controlBtn}
                compact
              >
                {showLabels ? '隐藏标签' : '显示标签'}
              </Button>
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>点击高亮面：</Text>
            <View style={styles.faceButtonGrid}>
              {faceButtons.map((face) => (
                <TouchableOpacity
                  key={face}
                  style={[
                    styles.faceButton,
                    highlightFace === face && styles.faceButtonActive,
                  ]}
                  onPress={() => handleHighlightFace(face)}
                >
                  <Text style={[
                    styles.faceButtonText,
                    highlightFace === face && styles.faceButtonTextActive,
                  ]}>
                    {faceLabels[face]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* 步骤引导 */}
        <Card style={styles.card}>
          <Card.Title title="分析步骤" />
          <Card.Content>
            {/* 进度指示器 */}
            <View style={styles.progressContainer}>
              {steps.map((step, index) => (
                <View key={step.id} style={styles.progressItem}>
                  <View
                    style={[
                      styles.progressDot,
                      index === currentStep && styles.progressDotActive,
                      index < currentStep && styles.progressDotCompleted,
                    ]}
                  >
                    <Text style={[
                      styles.progressDotText,
                      (index === currentStep || index < currentStep) && styles.progressDotTextActive,
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  {index < steps.length - 1 && (
                    <View style={[
                      styles.progressLine,
                      index < currentStep && styles.progressLineCompleted,
                    ]} />
                  )}
                </View>
              ))}
            </View>

            {/* 当前步骤详情 */}
            <View style={styles.stepDetail}>
              <Text style={styles.stepTitle}>
                步骤 {currentStep + 1}: {currentStepData.title}
              </Text>
              <Text style={styles.stepDescription}>{currentStepData.description}</Text>
              <View style={styles.hintBox}>
                <Text style={styles.hintIcon}>💡</Text>
                <Text style={styles.hintText}>{currentStepData.hint}</Text>
              </View>
            </View>

            {/* 步骤控制按钮 */}
            <View style={styles.stepControls}>
              <Button
                mode="outlined"
                onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                style={styles.stepBtn}
              >
                上一步
              </Button>
              <Button
                mode="contained"
                onPress={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={currentStep === steps.length - 1}
                style={styles.stepBtn}
              >
                下一步
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 快捷技巧 */}
        <Card style={styles.card}>
          <Card.Title title="解题技巧" />
          <Card.Content>
            {subType === 'folding' && (
              <>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>找出相对面：相对的面在展开图中不会相邻</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>确定方向：注意面上的图案或标记的方向</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>逐面折叠：从一个面开始，逐个折叠相邻面</Text>
                </View>
              </>
            )}
            {subType === 'section' && (
              <>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>水平截面：圆柱→圆，圆锥→圆，球→圆</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>垂直截面：圆柱→矩形，圆锥→三角形</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>斜截面：可能产生椭圆、抛物线等形状</Text>
                </View>
              </>
            )}
            {subType === 'view_projection' && (
              <>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>主视图：从正面看，显示高和宽</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>俯视图：从上方看，显示长和宽</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>左视图：从左侧看，显示高和长</Text>
                </View>
              </>
            )}
            {subType === 'solid_assembly' && (
              <>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>数小方块：先确定总共有多少个小方块</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>分层分析：从下往上逐层分析</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipIcon}>📌</Text>
                  <Text style={styles.tipText}>验证视图：用三视图验证你的答案</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <Button mode="outlined" onPress={() => router.back()} style={styles.button}>
            返回
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push({
              pathname: '/spatial',
              params: { type: subType === 'solid_assembly' ? 'assembly' : subType }
            })}
            style={styles.button}
          >
            进入3D演示
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  infoCard: { marginBottom: 16, backgroundColor: '#E8F5E9' },
  description: { fontSize: 14, color: '#333', lineHeight: 22 },
  card: { marginBottom: 16 },
  canvasCard: { marginBottom: 16, overflow: 'hidden' },
  canvas: { width: '100%', height: 280, backgroundColor: '#1a1a2e' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12, color: '#333' },
  divider: { height: 16 },
  controlRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  controlBtn: { flex: 1 },
  faceButtonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  faceButton: {
    width: '30%',
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  faceButtonActive: { backgroundColor: '#4CAF50' },
  faceButtonText: { fontSize: 12, color: '#333', fontWeight: '500' },
  faceButtonTextActive: { color: '#fff' },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: { backgroundColor: '#4CAF50' },
  progressDotCompleted: { backgroundColor: '#81C784' },
  progressDotText: { fontSize: 12, fontWeight: '600', color: '#666' },
  progressDotTextActive: { color: '#fff' },
  progressLine: { width: 30, height: 2, backgroundColor: '#e0e0e0' },
  progressLineCompleted: { backgroundColor: '#81C784' },
  stepDetail: { marginBottom: 16 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  stepDescription: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 12 },
  hintBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  hintIcon: { fontSize: 16, marginRight: 8 },
  hintText: { flex: 1, fontSize: 13, color: '#E65100', lineHeight: 20 },
  stepControls: { flexDirection: 'row', gap: 12 },
  stepBtn: { flex: 1 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tipIcon: { fontSize: 14, marginRight: 8 },
  tipText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
  faceLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  faceLabelText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  button: { flex: 1, marginHorizontal: 4 },
});
