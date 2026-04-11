import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, Button, SegmentedButtons, Chip } from 'react-native-paper';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere, Cone, Grid, Html, Text as Text3D } from '@react-three/drei';
import * as THREE from 'three';
import { router, useLocalSearchParams } from 'expo-router';
import {
  QuestionModelRenderer,
  InteractiveModelPanel,
} from '../components/QuestionModelRenderer';
import type { SpatialModelData, CuttingPlane } from '@kao-gong/shared';

// ============================================
// 动画工具函数
// ============================================

// 平滑插值函数
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

// 缓动函数
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ============================================
// 折叠立方体组件
// ============================================

const FoldingCube: React.FC<{
  expanded: boolean;
  animationProgress: number;
}> = ({ expanded, animationProgress }) => {
  const groupRef = useRef<THREE.Group>(null);
  const flapRefs = useRef<(THREE.Mesh | null)[]>([]);

  // 6个面的位置和旋转
  const faces = useMemo(() => [
    { // 底面 (基准)
      position: [0, -0.5, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      color: '#2196F3',
      label: '底',
    },
    { // 前面
      position: [0, 0, 0.5] as [number, number, number],
      rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
      color: '#FF9800',
      label: '前',
      pivot: [0, -0.5, 0.5] as [number, number, number],
    },
    { // 右面
      position: [0.5, 0, 0] as [number, number, number],
      rotation: [0, 0, -Math.PI / 2] as [number, number, number],
      color: '#00BCD4',
      label: '右',
      pivot: [0.5, -0.5, 0] as [number, number, number],
    },
    { // 后面
      position: [0, 0, -0.5] as [number, number, number],
      rotation: [Math.PI / 2, 0, 0] as [number, number, number],
      color: '#9C27B0',
      label: '后',
      pivot: [0, -0.5, -0.5] as [number, number, number],
    },
    { // 左面
      position: [-0.5, 0, 0] as [number, number, number],
      rotation: [0, 0, Math.PI / 2] as [number, number, number],
      color: '#E91E63',
      label: '左',
      pivot: [-0.5, -0.5, 0] as [number, number, number],
    },
    { // 顶面
      position: [0, 0.5, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      color: '#4CAF50',
      label: '顶',
    },
  ], []);

  useFrame((state) => {
    if (groupRef.current) {
      // 轻微自动旋转
      groupRef.current.rotation.y += 0.003;
    }
  });

  // 计算展开/折叠状态
  const progress = expanded ? animationProgress : 1 - animationProgress;

  return (
    <group ref={groupRef}>
      {/* 底面 - 始终可见 */}
      <Box position={[0, -0.5, 0]} args={[0.95, 0.05, 0.95]}>
        <meshStandardMaterial color="#2196F3" transparent opacity={0.9} />
      </Box>
      <Html position={[0, -0.6, 0]} center>
        <View style={styles.faceLabel}>
          <Text style={styles.faceLabelText}>底</Text>
        </View>
      </Html>

      {/* 前面 */}
      <group position={[0, -0.5, 0.475]} rotation={[-(Math.PI / 2) * progress, 0, 0]}>
        <Box position={[0, 0.475, 0]} args={[0.95, 0.95, 0.05]}>
          <meshStandardMaterial color="#FF9800" transparent opacity={0.9} />
        </Box>
        <Html position={[0, 0.475, 0.1]} center>
          <View style={styles.faceLabel}>
            <Text style={styles.faceLabelText}>前</Text>
          </View>
        </Html>
      </group>

      {/* 右面 */}
      <group position={[0.475, -0.5, 0]} rotation={[0, 0, (Math.PI / 2) * progress]}>
        <Box position={[0, 0.475, 0]} args={[0.05, 0.95, 0.95]}>
          <meshStandardMaterial color="#00BCD4" transparent opacity={0.9} />
        </Box>
        <Html position={[0.1, 0.475, 0]} center>
          <View style={styles.faceLabel}>
            <Text style={styles.faceLabelText}>右</Text>
          </View>
        </Html>
      </group>

      {/* 后面 */}
      <group position={[0, -0.5, -0.475]} rotation={[(Math.PI / 2) * progress, 0, 0]}>
        <Box position={[0, 0.475, 0]} args={[0.95, 0.95, 0.05]}>
          <meshStandardMaterial color="#9C27B0" transparent opacity={0.9} />
        </Box>
        <Html position={[0, 0.475, 0.1]} center>
          <View style={styles.faceLabel}>
            <Text style={styles.faceLabelText}>后</Text>
          </View>
        </Html>
      </group>

      {/* 左面 */}
      <group position={[-0.475, -0.5, 0]} rotation={[0, 0, -(Math.PI / 2) * progress]}>
        <Box position={[0, 0.475, 0]} args={[0.05, 0.95, 0.95]}>
          <meshStandardMaterial color="#E91E63" transparent opacity={0.9} />
        </Box>
        <Html position={[-0.1, 0.475, 0]} center>
          <View style={styles.faceLabel}>
            <Text style={styles.faceLabelText}>左</Text>
          </View>
        </Html>
      </group>

      {/* 顶面 - 只在折叠时显示 */}
      {progress < 0.9 && (
        <group position={[0, -0.5 + (1 - progress) * 0.95, 0.475]} rotation={[-(Math.PI / 2) * (1 - progress), 0, 0]}>
          <Box position={[0, 0.475, 0]} args={[0.95, 0.95, 0.05]}>
            <meshStandardMaterial color="#4CAF50" transparent opacity={0.9} />
          </Box>
          <Html position={[0, 0.475, 0.1]} center>
            <View style={[styles.faceLabel, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.faceLabelText}>顶</Text>
            </View>
          </Html>
        </group>
      )}

      {/* 完全折叠后显示完整立方体 */}
      {progress < 0.1 && (
        <Box args={[0.95, 0.95, 0.95]}>
          <meshBasicMaterial color="#4CAF50" wireframe opacity={0.3} transparent />
        </Box>
      )}
    </group>
  );
};

// ============================================
// 截面演示组件
// ============================================

const SectionDemo: React.FC<{
  cutAngle: number;
  showCut: boolean;
  shapeType: 'cube' | 'cylinder' | 'cone' | 'sphere';
}> = ({ cutAngle, showCut, shapeType }) => {
  const groupRef = useRef<THREE.Group>(null);
  const angleRad = (cutAngle * Math.PI) / 180;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  const renderShape = () => {
    switch (shapeType) {
      case 'cube':
        return (
          <Box args={[1.2, 1.2, 1.2]}>
            <meshStandardMaterial color="#4CAF50" transparent opacity={showCut ? 0.4 : 0.9} />
          </Box>
        );
      case 'cylinder':
        return (
          <Cylinder args={[0.6, 0.6, 1.4, 32]}>
            <meshStandardMaterial color="#2196F3" transparent opacity={showCut ? 0.4 : 0.9} />
          </Cylinder>
        );
      case 'cone':
        return (
          <Cone args={[0.7, 1.4, 32]}>
            <meshStandardMaterial color="#FF9800" transparent opacity={showCut ? 0.4 : 0.9} />
          </Cone>
        );
      case 'sphere':
        return (
          <Sphere args={[0.7, 32, 32]}>
            <meshStandardMaterial color="#9C27B0" transparent opacity={showCut ? 0.4 : 0.9} />
          </Sphere>
        );
    }
  };

  // 计算截面形状
  const getSectionShape = () => {
    switch (shapeType) {
      case 'cube':
        return (
          <mesh rotation={[angleRad, 0, 0]}>
            <planeGeometry args={[1.8, 1.8]} />
            <meshStandardMaterial color="#F44336" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        );
      case 'cylinder':
        return (
          <mesh rotation={[angleRad, 0, 0]}>
            <circleGeometry args={[0.6, 32]} />
            <meshStandardMaterial color="#F44336" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        );
      case 'cone':
        // 圆锥截面是椭圆或抛物线
        return (
          <mesh rotation={[angleRad, 0, 0]}>
            <circleGeometry args={[0.5, 32]} />
            <meshStandardMaterial color="#F44336" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        );
      case 'sphere':
        return (
          <mesh rotation={[angleRad, 0, 0]}>
            <circleGeometry args={[0.7, 32]} />
            <meshStandardMaterial color="#F44336" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        );
    }
  };

  return (
    <group ref={groupRef}>
      {renderShape()}
      {showCut && getSectionShape()}

      {/* 边框 */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.22, 1.22, 1.22)]} />
        <lineBasicMaterial color="#333" />
      </lineSegments>

      {/* 角度标注 */}
      <Html position={[0.9, 0.9, 0.9]} center>
        <View style={styles.angleLabel}>
          <Text style={styles.angleLabelText}>切割角度: {cutAngle}°</Text>
        </View>
      </Html>
    </group>
  );
};

// ============================================
// 视图投影组件
// ============================================

const ViewProjection: React.FC<{
  viewIndex: number;
  autoRotate: boolean;
}> = ({ viewIndex, autoRotate }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  // 根据视图索引设置相机视角
  const ViewCamera = () => {
    const { camera } = useThree();

    useEffect(() => {
      switch (viewIndex) {
        case 0: // 正面
          camera.position.set(0, 0, 4);
          break;
        case 1: // 侧面
          camera.position.set(4, 0, 0);
          break;
        case 2: // 顶部
          camera.position.set(0, 4, 0.01);
          break;
        case 3: // 等轴测
          camera.position.set(2.5, 2.5, 2.5);
          break;
      }
      camera.lookAt(0, 0, 0);
    }, [viewIndex, camera]);

    return null;
  };

  return (
    <>
      <ViewCamera />
      <group ref={groupRef}>
        {/* 主体 - 一个有孔的立方体 */}
        <Box args={[1, 1, 1]}>
          <meshStandardMaterial color="#4CAF50" />
        </Box>

        {/* 圆柱孔 */}
        <Cylinder args={[0.25, 0.25, 1.1, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333" />
        </Cylinder>

        {/* 视图方向箭头 */}
        {viewIndex === 0 && (
          <Html position={[0, 0, 1.5]} center>
            <View style={styles.viewLabel}>
              <Text style={styles.viewLabelText}>👇 正面视图</Text>
            </View>
          </Html>
        )}
        {viewIndex === 1 && (
          <Html position={[1.5, 0, 0]} center>
            <View style={styles.viewLabel}>
              <Text style={styles.viewLabelText}>👈 侧面视图</Text>
            </View>
          </Html>
        )}
        {viewIndex === 2 && (
          <Html position={[0, 1.5, 0]} center>
            <View style={styles.viewLabel}>
              <Text style={styles.viewLabelText}>👇 顶视图</Text>
            </View>
          </Html>
        )}
        {viewIndex === 3 && (
          <Html position={[1, 1, 1]} center>
            <View style={styles.viewLabel}>
              <Text style={styles.viewLabelText}>🎯 等轴测视图</Text>
            </View>
          </Html>
        )}
      </group>
    </>
  );
};

// ============================================
// 立体拼图组件
// ============================================

const AssemblyDemo: React.FC<{
  pieces: number;
  assembled: boolean;
  animationProgress: number;
}> = ({ pieces, assembled, animationProgress }) => {
  const groupRef = useRef<THREE.Group>(null);
  const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#FFEB3B', '#795548'];

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  const actualPieces = Math.min(pieces, 8);
  const progress = assembled ? animationProgress : 1 - animationProgress;

  return (
    <group ref={groupRef}>
      {Array.from({ length: actualPieces }).map((_, i) => {
        const angle = (i / actualPieces) * Math.PI * 2;
        const radius = 1.2 * (1 - progress * 0.5);
        const targetX = Math.cos(angle) * 0.3 * (i % 2 === 0 ? 1 : -1);
        const targetZ = Math.sin(angle) * 0.3 * (i % 2 === 0 ? 1 : -1);
        const targetY = Math.floor(i / 2) * 0.5 - 0.25;

        const currentX = lerp(Math.cos(angle) * radius, targetX, progress);
        const currentZ = lerp(Math.sin(angle) * radius, targetZ, progress);
        const currentY = lerp(0, targetY, progress);

        return (
          <Box
            key={i}
            args={[0.4, 0.4, 0.4]}
            position={[currentX, currentY, currentZ]}
          >
            <meshStandardMaterial color={colors[i % colors.length]} />
          </Box>
        );
      })}
    </group>
  );
};

// ============================================
// 棱锥组件
// ============================================

const PyramidDemo: React.FC<{
  expanded: boolean;
  animationProgress: number;
}> = ({ expanded, animationProgress }) => {
  const groupRef = useRef<THREE.Group>(null);
  const progress = expanded ? animationProgress : 1 - animationProgress;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 底面 */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshStandardMaterial color="#4CAF50" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, -0.7, 0]} center>
        <View style={[styles.faceLabel, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.faceLabelText}>底面</Text>
        </View>
      </Html>

      {/* 四个侧面 */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI / 2);
        const expandAngle = progress * Math.PI / 3;

        return (
          <group
            key={i}
            position={[0, -0.6, 0]}
            rotation={[expandAngle, angle, 0]}
          >
            <mesh position={[0, 0.5, 0]}>
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial
                color={['#2196F3', '#FF9800', '#9C27B0', '#E91E63'][i]}
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {/* 折叠完成后显示完整棱锥 */}
      {progress < 0.2 && (
        <Cone args={[0.6, 1, 4]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#4CAF50" transparent opacity={0.9} />
        </Cone>
      )}
    </group>
  );
};

// ============================================
// 主页面组件
// ============================================

export default function SpatialScreen() {
  const params = useLocalSearchParams<{
    type?: string;
    subType?: string;
    imageId?: string;
    modelData?: string; // JSON string of SpatialModelData
  }>();

  // 解析模型数据
  const parsedModelData = useMemo(() => {
    if (params.modelData) {
      try {
        const parsed = JSON.parse(params.modelData);
        console.log('[Spatial] Parsed modelData:', parsed);
        console.log('[Spatial] Model type:', parsed?.type);
        console.log('[Spatial] Model name:', parsed?.name);
        console.log('[Spatial] Components:', parsed?.components?.length);
        console.log('[Spatial] Features:', parsed?.features?.length);
        return parsed;
      } catch (e) {
        console.error('[Spatial] Failed to parse modelData:', e);
        return null;
      }
    }
    return null;
  }, [params.modelData]);

  const type = params.type || params.subType || 'folding';

  // 动画状态
  const [expanded, setExpanded] = useState(true);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [cutAngle, setCutAngle] = useState(45);
  const [pieces, setPieces] = useState(4);
  const [viewIndex, setViewIndex] = useState(0);
  const [showSection, setShowSection] = useState(false);
  const [assembled, setAssembled] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [shapeType, setShapeType] = useState<'cube' | 'cylinder' | 'cone' | 'sphere'>('cube');

  // 新增：用于动态模型的状态
  const [showLabels, setShowLabels] = useState(true);
  const [highlightFace, setHighlightFace] = useState<string | null>(null);
  const [sectionPosition, setSectionPosition] = useState(0.5);
  const [cuttingPlane, setCuttingPlane] = useState<CuttingPlane>({
    angle: 45,
    direction: 'diagonal',
    position: 0.5,
    description: '斜切',
  });

  // 动画值
  const animatedProgress = useRef(new Animated.Value(0)).current;

  // 动画效果
  useEffect(() => {
    const toValue = expanded ? 1 : 0;
    Animated.timing(animatedProgress, {
      toValue,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    const listener = animatedProgress.addListener(({ value }) => {
      setAnimationProgress(value);
    });

    return () => animatedProgress.removeListener(listener);
  }, [expanded]);

  useEffect(() => {
    const toValue = assembled ? 1 : 0;
    Animated.timing(animatedProgress, {
      toValue,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [assembled]);

  const titles: Record<string, string> = {
    folding: '立方体折叠',
    section: '截面分析',
    assembly: '立体拼图',
    view: '三视图',
    pyramid: '棱锥折叠',
    cylinder: '圆柱截面',
    cone: '圆锥截面',
    sphere: '球体截面',
  };

  const descriptions: Record<string, string> = {
    folding: '展示立方体的展开和折叠过程，帮助理解平面展开图与立体的对应关系。',
    section: '演示平面切割立体图形的过程，直观展示不同角度的截面形状。',
    assembly: '展示多个小立体组合成完整形状的过程。',
    view: '从不同角度观察立体图形，理解三视图的关系。',
    pyramid: '展示棱锥的展开和折叠过程。',
    cylinder: '展示圆柱的不同截面形状。',
    cone: '展示圆锥的不同截面形状。',
    sphere: '展示球体的不同截面形状。',
  };

  const renderScene = () => {
    // 如果有来自分析结果的模型数据，使用动态渲染器
    if (parsedModelData) {
      return (
        <QuestionModelRenderer
          modelData={parsedModelData}
          showLabels={showLabels}
          highlightFace={highlightFace}
          cuttingPlane={cuttingPlane}
          showSection={showSection}
          sectionPosition={sectionPosition}
          onFaceClick={(faceId) => setHighlightFace(faceId)}
        />
      );
    }

    // 否则使用预设演示
    switch (type) {
      case 'folding':
        return <FoldingCube expanded={expanded} animationProgress={animationProgress} />;
      case 'section':
        return <SectionDemo cutAngle={cutAngle} showCut={showSection} shapeType={shapeType} />;
      case 'assembly':
        return <AssemblyDemo pieces={pieces} assembled={assembled} animationProgress={animationProgress} />;
      case 'view':
        return <ViewProjection viewIndex={viewIndex} autoRotate={autoRotate} />;
      case 'pyramid':
        return <PyramidDemo expanded={expanded} animationProgress={animationProgress} />;
      case 'cylinder':
        return <SectionDemo cutAngle={cutAngle} showCut={showSection} shapeType="cylinder" />;
      case 'cone':
        return <SectionDemo cutAngle={cutAngle} showCut={showSection} shapeType="cone" />;
      case 'sphere':
        return <SectionDemo cutAngle={cutAngle} showCut={showSection} shapeType="sphere" />;
      default:
        return <FoldingCube expanded={expanded} animationProgress={animationProgress} />;
    }
  };

  const renderControls = () => {
    switch (type) {
      case 'folding':
      case 'pyramid':
        return (
          <Card style={styles.card}>
            <Card.Title title="控制面板" />
            <Card.Content>
              <Text style={styles.label}>折叠状态</Text>
              <View style={styles.buttonRow}>
                <Button
                  mode={expanded ? 'contained' : 'outlined'}
                  onPress={() => setExpanded(true)}
                  style={styles.controlBtn}
                >
                  展开
                </Button>
                <Button
                  mode={!expanded ? 'contained' : 'outlined'}
                  onPress={() => setExpanded(false)}
                  style={styles.controlBtn}
                >
                  折叠
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => { setExpanded(!expanded); }}
                  style={styles.controlBtn}
                >
                  切换
                </Button>
              </View>
              <Text style={styles.hint}>💡 点击按钮查看立方体折叠/展开动画</Text>
            </Card.Content>
          </Card>
        );
      case 'section':
      case 'cylinder':
      case 'cone':
      case 'sphere':
        return (
          <Card style={styles.card}>
            <Card.Title title="控制面板" />
            <Card.Content>
              <Text style={styles.label}>切割角度: {cutAngle}°</Text>
              <View style={styles.buttonRow}>
                {[0, 30, 45, 60, 90].map(angle => (
                  <Button
                    key={angle}
                    mode={cutAngle === angle ? 'contained' : 'outlined'}
                    onPress={() => setCutAngle(angle)}
                    style={styles.controlBtn}
                    compact
                  >
                    {angle}°
                  </Button>
                ))}
              </View>
              <View style={styles.divider} />
              <Text style={styles.label}>截面显示</Text>
              <View style={styles.buttonRow}>
                <Button
                  mode={showSection ? 'contained' : 'outlined'}
                  onPress={() => setShowSection(true)}
                  style={styles.controlBtn}
                >
                  显示截面
                </Button>
                <Button
                  mode={!showSection ? 'contained' : 'outlined'}
                  onPress={() => setShowSection(false)}
                  style={styles.controlBtn}
                >
                  隐藏截面
                </Button>
              </View>
              {type === 'section' && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.label}>形状选择</Text>
                  <View style={styles.buttonRow}>
                    {(['cube', 'cylinder', 'cone', 'sphere'] as const).map(shape => (
                      <Button
                        key={shape}
                        mode={shapeType === shape ? 'contained' : 'outlined'}
                        onPress={() => setShapeType(shape)}
                        style={styles.controlBtn}
                        compact
                      >
                        {shape === 'cube' ? '立方体' : shape === 'cylinder' ? '圆柱' : shape === 'cone' ? '圆锥' : '球体'}
                      </Button>
                    ))}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        );
      case 'assembly':
        return (
          <Card style={styles.card}>
            <Card.Title title="控制面板" />
            <Card.Content>
              <Text style={styles.label}>拼图块数: {pieces}</Text>
              <View style={styles.buttonRow}>
                {[2, 3, 4, 5, 6, 7, 8].map(num => (
                  <Button
                    key={num}
                    mode={pieces === num ? 'contained' : 'outlined'}
                    onPress={() => setPieces(num)}
                    style={styles.controlBtn}
                    compact
                  >
                    {num}
                  </Button>
                ))}
              </View>
              <View style={styles.divider} />
              <Text style={styles.label}>组合状态</Text>
              <View style={styles.buttonRow}>
                <Button
                  mode={assembled ? 'contained' : 'outlined'}
                  onPress={() => setAssembled(true)}
                  style={styles.controlBtn}
                >
                  组合
                </Button>
                <Button
                  mode={!assembled ? 'contained' : 'outlined'}
                  onPress={() => setAssembled(false)}
                  style={styles.controlBtn}
                >
                  分散
                </Button>
              </View>
            </Card.Content>
          </Card>
        );
      case 'view':
        return (
          <Card style={styles.card}>
            <Card.Title title="控制面板" />
            <Card.Content>
              <Text style={styles.label}>视图方向</Text>
              <SegmentedButtons
                value={String(viewIndex)}
                onValueChange={(v) => setViewIndex(Number(v))}
                buttons={[
                  { value: '0', label: '正面' },
                  { value: '1', label: '侧面' },
                  { value: '2', label: '顶部' },
                  { value: '3', label: '等轴' },
                ]}
              />
              <View style={styles.divider} />
              <View style={styles.buttonRow}>
                <Button
                  mode={autoRotate ? 'contained' : 'outlined'}
                  onPress={() => setAutoRotate(!autoRotate)}
                  style={styles.controlBtn}
                >
                  {autoRotate ? '自动旋转: 开' : '自动旋转: 关'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={titles[type] || '3D演示'} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* 说明卡片 */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.description}>{descriptions[type] || ''}</Text>
          </Card.Content>
        </Card>

        {/* 3D渲染 */}
        <Card style={styles.canvasCard}>
          <View style={styles.canvas}>
            <Canvas style={{ width: '100%', height: '100%' }}>
              <ambientLight intensity={0.6} />
              <pointLight position={[10, 10, 10]} />
              <directionalLight position={[5, 5, 5]} intensity={0.4} />
              <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={2}
                maxDistance={10}
              />
              {renderScene()}
              <Grid
                infiniteGrid
                cellSize={0.5}
                cellThickness={0.3}
                cellColor="#666"
                sectionSize={1}
                sectionThickness={0.5}
                sectionColor="#888"
                fadeDistance={10}
                position={[0, -1.5, 0]}
              />
            </Canvas>
          </View>
        </Card>

        {/* 控制面板 */}
        {renderControls()}

        {/* 模型选择 */}
        <Card style={styles.card}>
          <Card.Title title="选择模型" />
          <Card.Content>
            <View style={styles.modelGrid}>
              {[
                { key: 'folding', label: '立方体', icon: '📦' },
                { key: 'pyramid', label: '棱锥', icon: '🔺' },
                { key: 'cylinder', label: '圆柱', icon: '⬜' },
                { key: 'cone', label: '圆锥', icon: '🔶' },
                { key: 'sphere', label: '球体', icon: '⚪' },
                { key: 'section', label: '截面', icon: '✂️' },
                { key: 'assembly', label: '拼图', icon: '🧩' },
                { key: 'view', label: '视图', icon: '👁️' },
              ].map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.modelBtn, type === item.key && styles.modelBtnActive]}
                  onPress={() => router.setParams({ type: item.key })}
                >
                  <Text style={styles.modelIcon}>{item.icon}</Text>
                  <Text style={[styles.modelLabel, type === item.key && styles.modelLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* 操作提示 */}
        <View style={styles.tips}>
          <Text style={styles.tipTitle}>💡 操作提示</Text>
          <Text style={styles.tipItem}>• 单指拖动旋转模型</Text>
          <Text style={styles.tipItem}>• 双指捏合缩放大小</Text>
          <Text style={styles.tipItem}>• 点击按钮切换状态</Text>
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
  card: { marginBottom: 16 },
  canvasCard: { marginBottom: 16, overflow: 'hidden' },
  canvas: { width: '100%', height: 320, backgroundColor: '#1a1a2e' },
  description: { fontSize: 14, color: '#333', lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12, color: '#333' },
  hint: { fontSize: 12, color: '#666', marginTop: 12, fontStyle: 'italic' },
  divider: { height: 16 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  controlBtn: { marginRight: 8, marginBottom: 8 },
  modelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modelBtn: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modelBtnActive: { backgroundColor: '#4CAF50' },
  modelIcon: { fontSize: 22, marginBottom: 4 },
  modelLabel: { fontSize: 11, color: '#333' },
  modelLabelActive: { color: '#fff', fontWeight: '600' },
  tips: { padding: 16, backgroundColor: '#E3F2FD', borderRadius: 12 },
  tipTitle: { fontSize: 14, fontWeight: '600', color: '#1976D2', marginBottom: 8 },
  tipItem: { fontSize: 13, color: '#555', marginLeft: 8, marginBottom: 4 },
  faceLabel: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  faceLabelText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  angleLabel: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  angleLabelText: { color: '#fff', fontSize: 12 },
  viewLabel: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  viewLabelText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
