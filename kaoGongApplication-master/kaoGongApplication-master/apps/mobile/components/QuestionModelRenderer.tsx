/**
 * 题目图片3D渲染器
 * 根据AI分析返回的 spatialModelData 动态渲染对应的3D模型
 * 支持用户交互切割、面标记显示等功能
 */

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Button, Slider, SegmentedButtons, Chip } from 'react-native-paper';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere, Cone, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { SpatialModelData, SpatialFace, CuttingPlane } from '@kao-gong/shared';

// 几何体组件类型
interface GeometryComponent {
  id: string;
  type: 'cube' | 'cuboid' | 'cylinder' | 'cone' | 'sphere' | 'pyramid_square' | 'pyramid_triangular' | 'prism_triangular' | 'prism_hexagonal';
  name: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    radius?: number;
  };
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  color?: string;
  isHollow?: boolean;
  transparent?: boolean;
  opacity?: number;
  faces?: SpatialFace[];
  features?: Array<{
    type: string;
    description: string;
    position?: { x: number; y: number; z: number };
    size?: number;
  }>;
}

// ============================================
// 工具函数
// ============================================

const COLORS = {
  top: '#4CAF50',
  bottom: '#2196F3',
  front: '#FF9800',
  back: '#9C27B0',
  left: '#E91E63',
  right: '#00BCD4',
  default: '#78909C',
};

// ============================================
// 动态面渲染器
// ============================================

interface FaceRendererProps {
  face: SpatialFace;
  dimensions: { length: number; width: number; height: number; radius?: number };
  isHighlighted: boolean;
  showLabels: boolean;
  onClick?: () => void;
}

const FaceRenderer: React.FC<FaceRendererProps> = ({
  face,
  dimensions,
  isHighlighted,
  showLabels,
  onClick,
}) => {
  const { length = 1, width = 1, height = 1 } = dimensions;

  // 根据面名称计算位置
  const getPosition = (): [number, number, number] => {
    const name = face.name?.toLowerCase() || '';
    if (name.includes('顶') || name.includes('top')) return [0, height / 2 + 0.01, 0];
    if (name.includes('底') || name.includes('bottom')) return [0, -height / 2 - 0.01, 0];
    if (name.includes('前') || name.includes('front')) return [0, 0, width / 2 + 0.01];
    if (name.includes('后') || name.includes('back')) return [0, 0, -width / 2 - 0.01];
    if (name.includes('左') || name.includes('left')) return [-length / 2 - 0.01, 0, 0];
    if (name.includes('右') || name.includes('right')) return [length / 2 + 0.01, 0, 0];
    return [0, 0, 0];
  };

  // 根据面名称计算旋转
  const getRotation = (): [number, number, number] => {
    const name = face.name?.toLowerCase() || '';
    if (name.includes('顶') || name.includes('top')) return [-Math.PI / 2, 0, 0];
    if (name.includes('底') || name.includes('bottom')) return [Math.PI / 2, 0, 0];
    if (name.includes('前') || name.includes('front')) return [0, 0, 0];
    if (name.includes('后') || name.includes('back')) return [0, Math.PI, 0];
    if (name.includes('左') || name.includes('left')) return [0, -Math.PI / 2, 0];
    if (name.includes('右') || name.includes('right')) return [0, Math.PI / 2, 0];
    return [0, 0, 0];
  };

  // 根据面名称计算平面大小
  const getPlaneSize = (): [number, number] => {
    const name = face.name?.toLowerCase() || '';
    if (name.includes('顶') || name.includes('top') || name.includes('底') || name.includes('bottom')) {
      return [length * 0.95, width * 0.95];
    }
    if (name.includes('前') || name.includes('front') || name.includes('后') || name.includes('back')) {
      return [length * 0.95, height * 0.95];
    }
    if (name.includes('左') || name.includes('left') || name.includes('右') || name.includes('right')) {
      return [width * 0.95, height * 0.95];
    }
    return [length * 0.95, width * 0.95];
  };

  const position = getPosition();
  const rotation = getRotation();
  const planeSize = getPlaneSize();
  const color = face.color || COLORS[face.name?.toLowerCase() as keyof typeof COLORS] || COLORS.default;

  // 标记位置
  const markPosition = face.markPosition
    ? [
        (face.markPosition.x - 0.5) * planeSize[0],
        (face.markPosition.y - 0.5) * planeSize[1],
        0.02,
      ]
    : [0, 0, 0.02];

  return (
    <group position={position} rotation={rotation}>
      {/* 面 */}
      <mesh onClick={onClick}>
        <planeGeometry args={planeSize} />
        <meshStandardMaterial
          color={isHighlighted ? '#FF5722' : color}
          transparent
          opacity={isHighlighted ? 0.95 : 0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 标记 */}
      {face.hasMark && (
        <mesh position={markPosition as [number, number, number]}>
          <circleGeometry args={[planeSize[0] * 0.15, 32]} />
          <meshStandardMaterial color="#F44336" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 标签 */}
      {showLabels && (
        <Html position={[0, 0, 0.05]} center>
          <View style={[styles.faceLabel, { backgroundColor: isHighlighted ? '#FF5722' : color }]}>
            <Text style={styles.faceLabelText}>
              {face.name}
              {face.hasMark && ' ⬤'}
            </Text>
          </View>
        </Html>
      )}
    </group>
  );
};

// ============================================
// 动态立方体
// ============================================

interface DynamicCubeProps {
  modelData: SpatialModelData;
  showLabels: boolean;
  highlightFace: string | null;
  cuttingPlane: CuttingPlane | null;
  showSection: boolean;
  sectionPosition: number;
  onFaceClick?: (faceId: string) => void;
}

const DynamicCubeRenderer: React.FC<DynamicCubeProps> = ({
  modelData,
  showLabels,
  highlightFace,
  cuttingPlane,
  showSection,
  sectionPosition,
  onFaceClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { dimensions, faces, features } = modelData;
  const length = dimensions?.length || 1;
  const width = dimensions?.width || 1;
  const height = dimensions?.height || 1;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  // 检查是否有孔洞
  const holes = features?.filter(f => f.type === 'hole') || [];

  return (
    <group ref={groupRef}>
      {/* 半透明主体 */}
      <Box args={[length, height, width]}>
        <meshStandardMaterial color="#888" transparent opacity={0.2} />
      </Box>

      {/* 各个面 */}
      {faces.map((face, index) => (
        <FaceRenderer
          key={face.id || index}
          face={face}
          dimensions={dimensions!}
          isHighlighted={highlightFace === face.id}
          showLabels={showLabels}
          onClick={() => onFaceClick?.(face.id || '')}
        />
      ))}

      {/* 孔洞 */}
      {holes.map((hole, index) => (
        <Cylinder
          key={`hole-${index}`}
          args={[hole.size || 0.2, hole.size || 0.2, Math.max(length, height, width) + 0.1, 32]}
          position={[
            hole.position?.x || 0,
            hole.position?.y || 0,
            hole.position?.z || 0,
          ]}
        >
          <meshStandardMaterial color="#333" />
        </Cylinder>
      ))}

      {/* 切割平面 */}
      {showSection && cuttingPlane && (
        <mesh
          position={[0, (sectionPosition - 0.5) * height, 0]}
          rotation={[
            cuttingPlane.direction === 'horizontal' ? 0 : (cuttingPlane.angle * Math.PI) / 180,
            0,
            cuttingPlane.direction === 'vertical' ? Math.PI / 2 : 0,
          ]}
        >
          <planeGeometry args={[length * 1.5, width * 1.5]} />
          <meshStandardMaterial color="#F44336" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 边框 */}
      <Box args={[length + 0.02, height + 0.02, width + 0.02]}>
        <meshBasicMaterial color="#333" wireframe />
      </Box>
    </group>
  );
};

// ============================================
// 动态圆柱
// ============================================

const DynamicCylinderRenderer: React.FC<DynamicCubeProps> = ({
  modelData,
  showLabels,
  cuttingPlane,
  showSection,
  sectionPosition,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { dimensions, features } = modelData;
  const radius = dimensions?.radius || 0.5;
  const height = dimensions?.height || 1.5;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  const holes = features?.filter(f => f.type === 'hole') || [];

  // 计算截面半径
  const getSectionRadius = () => {
    if (cuttingPlane?.direction === 'horizontal') {
      return radius;
    }
    // 斜切时截面是椭圆
    return radius;
  };

  return (
    <group ref={groupRef}>
      {/* 圆柱主体 */}
      <Cylinder args={[radius, radius, height, 32]}>
        <meshStandardMaterial color="#2196F3" transparent opacity={0.8} />
      </Cylinder>

      {/* 孔洞 */}
      {holes.map((hole, index) => (
        <Cylinder
          key={`hole-${index}`}
          args={[hole.size || 0.2, hole.size || 0.2, height + 0.1, 32]}
        >
          <meshStandardMaterial color="#333" />
        </Cylinder>
      ))}

      {/* 截面 */}
      {showSection && cuttingPlane && (
        <mesh
          position={[0, (sectionPosition - 0.5) * height, 0]}
          rotation={[Math.PI / 2, 0, (cuttingPlane.angle * Math.PI) / 180]}
        >
          <circleGeometry args={[getSectionRadius(), 32]} />
          <meshStandardMaterial color="#F44336" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 标签 */}
      {showLabels && (
        <>
          <Html position={[0, height / 2 + 0.3, 0]} center>
            <View style={styles.label}>
              <Text style={styles.labelText}>顶面</Text>
            </View>
          </Html>
          <Html position={[0, -height / 2 - 0.3, 0]} center>
            <View style={styles.label}>
              <Text style={styles.labelText}>底面</Text>
            </View>
          </Html>
        </>
      )}
    </group>
  );
};

// ============================================
// 动态圆锥
// ============================================

const DynamicConeRenderer: React.FC<DynamicCubeProps> = ({
  modelData,
  showLabels,
  cuttingPlane,
  showSection,
  sectionPosition,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { dimensions } = modelData;
  const radius = dimensions?.radius || 0.7;
  const height = dimensions?.height || 1.5;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  // 圆锥在某个高度的截面半径
  const getSectionRadiusAtHeight = (y: number) => {
    const normalizedY = (y + height / 2) / height; // 0 到 1
    return radius * (1 - normalizedY);
  };

  return (
    <group ref={groupRef}>
      <Cone args={[radius, height, 32]}>
        <meshStandardMaterial color="#FF9800" transparent opacity={0.8} />
      </Cone>

      {/* 截面 */}
      {showSection && cuttingPlane && (
        <mesh
          position={[0, (sectionPosition - 0.5) * height, 0]}
          rotation={[Math.PI / 2, 0, (cuttingPlane.angle * Math.PI) / 180]}
        >
          <circleGeometry args={[getSectionRadiusAtHeight((sectionPosition - 0.5) * height), 32]} />
          <meshStandardMaterial color="#F44336" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showLabels && (
        <Html position={[0, height / 2 + 0.3, 0]} center>
          <View style={[styles.label, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.labelText}>圆锥 (r={radius.toFixed(1)}, h={height.toFixed(1)})</Text>
          </View>
        </Html>
      )}
    </group>
  );
};

// ============================================
// 动态球体
// ============================================

const DynamicSphereRenderer: React.FC<DynamicCubeProps> = ({
  modelData,
  showLabels,
  cuttingPlane,
  showSection,
  sectionPosition,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { dimensions } = modelData;
  const radius = dimensions?.radius || 0.7;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  // 球在某个高度的截面半径
  const getSectionRadiusAtHeight = (y: number) => {
    const normalizedY = y / radius; // -1 到 1
    return Math.sqrt(radius * radius - normalizedY * normalizedY * radius * radius);
  };

  return (
    <group ref={groupRef}>
      <Sphere args={[radius, 32, 32]}>
        <meshStandardMaterial color="#9C27B0" transparent opacity={0.8} />
      </Sphere>

      {/* 截面 */}
      {showSection && cuttingPlane && (
        <mesh
          position={[0, (sectionPosition - 0.5) * 2 * radius, 0]}
          rotation={[Math.PI / 2, 0, (cuttingPlane.angle * Math.PI) / 180]}
        >
          <circleGeometry args={[getSectionRadiusAtHeight((sectionPosition - 0.5) * 2 * radius) || 0.1, 32]} />
          <meshStandardMaterial color="#F44336" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showLabels && (
        <Html position={[0, radius + 0.3, 0]} center>
          <View style={[styles.label, { backgroundColor: '#9C27B0' }]}>
            <Text style={styles.labelText}>球体 (r={radius.toFixed(1)})</Text>
          </View>
        </Html>
      )}
    </group>
  );
};

// ============================================
// 单个几何体组件渲染器
// ============================================

interface ComponentRendererProps {
  component: GeometryComponent;
  showLabels?: boolean;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({ component, showLabels }) => {
  const { type, dimensions, position, rotation, color, isHollow, transparent, opacity, name } = component;

  // 安全获取位置和旋转，确保是有效数字
  // ⚠️ 位置坐标系：原点(0,0,0)在物体中心
  const pos: [number, number, number] = [
    typeof position?.x === 'number' && !isNaN(position.x) ? position.x : 0,
    typeof position?.y === 'number' && !isNaN(position.y) ? position.y : 0,
    typeof position?.z === 'number' && !isNaN(position.z) ? position.z : 0,
  ];
  const rot: [number, number, number] = [
    typeof rotation?.x === 'number' && !isNaN(rotation.x) ? rotation.x : 0,
    typeof rotation?.y === 'number' && !isNaN(rotation.y) ? rotation.y : 0,
    typeof rotation?.z === 'number' && !isNaN(rotation.z) ? rotation.z : 0,
  ];

  // 安全获取颜色，对于白色使用浅灰色以便可见
  let materialColor = color || '#78909C';
  if (materialColor.toUpperCase() === '#FFFFFF' || materialColor === '#fff' || materialColor === 'white') {
    materialColor = '#B0BEC5'; // 使用浅灰色替代纯白色，提高可见度
  }
  // 对于黑色（孔洞），使用深灰色
  if (materialColor === '#000000' || materialColor === '#000' || materialColor === 'black') {
    materialColor = '#263238';
  }

  // 安全获取透明度 - 孔洞使用更低透明度
  let materialOpacity = typeof opacity === 'number' ? opacity : 0.85;
  if (isHollow) {
    materialOpacity = 0.3;
  } else if (transparent) {
    materialOpacity = typeof opacity === 'number' ? opacity : 0.5;
  }

  // 安全获取尺寸，确保是正数
  const safeDimensions = {
    length: typeof dimensions?.length === 'number' && !isNaN(dimensions.length) ? Math.max(0.1, dimensions.length) : 1,
    width: typeof dimensions?.width === 'number' && !isNaN(dimensions.width) ? Math.max(0.1, dimensions.width) : 1,
    height: typeof dimensions?.height === 'number' && !isNaN(dimensions.height) ? Math.max(0.1, dimensions.height) : 1,
    radius: typeof dimensions?.radius === 'number' && !isNaN(dimensions.radius) ? Math.max(0.05, dimensions.radius) : 0.5,
  };

  console.log(`[ComponentRenderer] ${name || type}: pos=(${pos.join(',')}), color=${materialColor}, opacity=${materialOpacity}, isHollow=${isHollow}, dims=`, safeDimensions);

  // 使用 memo 来避免不必要的重新渲染
  const geometry = useMemo(() => {
    // 预定义一些醒目的颜色，用于区分不同组件
    const defaultColors: Record<string, string> = {
      cube: '#4CAF50',      // 绿色
      cuboid: '#8BC34A',    // 浅绿色
      cylinder: '#2196F3',  // 蓝色
      cone: '#FF9800',      // 橙色
      sphere: '#9C27B0',    // 紫色
      pyramid_square: '#E91E63',   // 粉色
      pyramid_triangular: '#F44336', // 红色
      prism_triangular: '#00BCD4',  // 青色
      prism_hexagonal: '#3F51B5',   // 靛蓝
    };

    const finalColor = materialColor || defaultColors[type] || '#78909C';

    switch (type) {
      case 'cube':
      case 'cuboid':
        return (
          <mesh>
            <boxGeometry args={[safeDimensions.length, safeDimensions.height, safeDimensions.width]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'cylinder':
        return (
          <mesh>
            <cylinderGeometry args={[safeDimensions.radius, safeDimensions.radius, safeDimensions.height, 32]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'cone':
        return (
          <mesh>
            <coneGeometry args={[safeDimensions.radius, safeDimensions.height, 32]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'sphere':
        return (
          <mesh>
            <sphereGeometry args={[safeDimensions.radius, 32, 32]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'pyramid_square':
        return (
          <mesh>
            <coneGeometry args={[safeDimensions.length ? safeDimensions.length / 1.414 : 0.7, safeDimensions.height, 4]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'pyramid_triangular':
        return (
          <mesh>
            <coneGeometry args={[safeDimensions.length ? safeDimensions.length / 1.732 : 0.5, safeDimensions.height, 3]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'prism_triangular':
        return (
          <mesh>
            <cylinderGeometry args={[safeDimensions.radius, safeDimensions.radius, safeDimensions.height, 3]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'prism_hexagonal':
        return (
          <mesh>
            <cylinderGeometry args={[safeDimensions.radius, safeDimensions.radius, safeDimensions.height, 6]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'prism_pentagonal':
        return (
          <mesh>
            <cylinderGeometry args={[safeDimensions.radius, safeDimensions.radius, safeDimensions.height, 5]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'torus':
        // 圆环/甜甜圈形状
        return (
          <mesh>
            <torusGeometry args={[safeDimensions.radius * 0.7, safeDimensions.radius * 0.3, 16, 32]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'truncated_cone':
        // 圆台/截头圆锥 - 使用 Cylinder 但上下半径不同
        return (
          <mesh>
            <cylinderGeometry args={[
              safeDimensions.radius, // 顶部半径
              (safeDimensions as any).bottomRadius || safeDimensions.radius * 1.5, // 底部半径
              safeDimensions.height,
              32
            ]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'hollow_cylinder':
        // 空心圆柱 - 渲染时显示为半透明的外圆柱
        return (
          <mesh>
            <cylinderGeometry args={[safeDimensions.radius, safeDimensions.radius, safeDimensions.height, 32]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={true}
              opacity={0.6}
              roughness={0.5}
              metalness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        );

      case 'cross_shape':
        // 十字形 - 两个长方体垂直交叉
        return (
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[safeDimensions.length, safeDimensions.height * 0.3, safeDimensions.width * 0.3]} />
              <meshStandardMaterial color={finalColor} transparent={materialOpacity < 1} opacity={materialOpacity} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[safeDimensions.length * 0.3, safeDimensions.height * 0.3, safeDimensions.width]} />
              <meshStandardMaterial color={finalColor} transparent={materialOpacity < 1} opacity={materialOpacity} />
            </mesh>
          </group>
        );

      case 't_shape':
        // T字形
        return (
          <group>
            <mesh position={[0, safeDimensions.height * 0.25, 0]}>
              <boxGeometry args={[safeDimensions.length, safeDimensions.height * 0.5, safeDimensions.width * 0.3]} />
              <meshStandardMaterial color={finalColor} transparent={materialOpacity < 1} opacity={materialOpacity} />
            </mesh>
            <mesh position={[0, -safeDimensions.height * 0.25, 0]}>
              <boxGeometry args={[safeDimensions.length * 0.3, safeDimensions.height * 0.5, safeDimensions.width * 0.3]} />
              <meshStandardMaterial color={finalColor} transparent={materialOpacity < 1} opacity={materialOpacity} />
            </mesh>
          </group>
        );

      case 'l_shape':
        // L字形
        return (
          <group>
            <mesh position={[safeDimensions.length * 0.25, 0, 0]}>
              <boxGeometry args={[safeDimensions.length * 0.5, safeDimensions.height, safeDimensions.width * 0.3]} />
              <meshStandardMaterial color={finalColor} transparent={materialOpacity < 1} opacity={materialOpacity} />
            </mesh>
            <mesh position={[-safeDimensions.length * 0.25, -safeDimensions.height * 0.35, 0]}>
              <boxGeometry args={[safeDimensions.length * 0.5, safeDimensions.height * 0.3, safeDimensions.width * 0.3]} />
              <meshStandardMaterial color={finalColor} transparent={materialOpacity < 1} opacity={materialOpacity} />
            </mesh>
          </group>
        );

      case 'irregular':
      default:
        // 不规则形状 - 默认渲染为立方体
        return (
          <mesh>
            <boxGeometry args={[safeDimensions.length, safeDimensions.height, safeDimensions.width]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );
    }
  }, [type, safeDimensions, materialColor, materialOpacity]);
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'pyramid_triangular':
        return (
          <mesh>
            <coneGeometry args={[safeDimensions.length ? safeDimensions.length / 1.732 : 0.5, safeDimensions.height, 3]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'prism_triangular':
        return (
          <mesh>
            <cylinderGeometry args={[safeDimensions.radius, safeDimensions.radius, safeDimensions.height, 3]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      case 'prism_hexagonal':
        return (
          <mesh>
            <cylinderGeometry args={[safeDimensions.radius, safeDimensions.radius, safeDimensions.height, 6]} />
            <meshStandardMaterial
              color={finalColor}
              transparent={materialOpacity < 1}
              opacity={materialOpacity}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );

      default:
        return (
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={finalColor} />
          </mesh>
        );
    }
  }, [type, safeDimensions, materialColor, materialOpacity]);

  return (
    <group position={pos} rotation={rot}>
      {geometry}
    </group>
  );
};

// ============================================
// 复合几何体渲染器
// ============================================

interface CompositeRendererProps {
  modelData: SpatialModelData;
  showLabels?: boolean;
  highlightFace?: string | null;
  cuttingPlane?: CuttingPlane | null;
  showSection?: boolean;
  sectionPosition?: number;
  onFaceClick?: (faceId: string) => void;
}

const CompositeRenderer: React.FC<CompositeRendererProps> = ({
  modelData,
  showLabels,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const components = (modelData as any).components as GeometryComponent[] || [];

  console.log('[CompositeRenderer] Rendering composite model');
  console.log('[CompositeRenderer] Components count:', components?.length);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  // 如果没有组件但有嵌入形状特征，从features创建组件
  const allComponents: GeometryComponent[] = useMemo(() => {
    const result: GeometryComponent[] = [...components];

    // 检查features中的嵌入形状
    if (modelData.features) {
      modelData.features.forEach((feature, index) => {
        if (feature.type === 'embedded_shape' && (feature as any).embeddedType) {
          result.push({
            id: `embedded-${index}`,
            type: (feature as any).embeddedType,
            name: feature.description || '嵌入形状',
            dimensions: (feature as any).embeddedDimensions || {},
            position: feature.position,
            color: '#FF5722',
            transparent: true,
            opacity: 0.9,
          });
        }
      });
    }

    console.log('[CompositeRenderer] All components to render:', result.length);
    result.forEach((comp, i) => {
      console.log(`[CompositeRenderer] Component ${i}:`, comp.type, comp.name, comp.dimensions, comp.position, comp.color);
    });

    return result;
  }, [components, modelData.features]);

  // 如果没有组件，显示一个默认的立方体
  if (allComponents.length === 0) {
    console.log('[CompositeRenderer] No components, rendering default cube');
    return (
      <group ref={groupRef}>
        <Box args={[1, 1, 1]}>
          <meshStandardMaterial color="#78909C" />
        </Box>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {/* 渲染所有组件 */}
      {allComponents.map((comp, index) => {
        console.log(`[CompositeRenderer] Rendering component ${index}:`, comp.type, comp.name);
        return (
          <ComponentRenderer
            key={comp.id || `comp-${index}`}
            component={comp}
            showLabels={false}
          />
        );
      })}

      {/* 整体名称标签 - 放在更高位置避免遮挡 */}
      {showLabels && (
        <Html position={[0, 2, 0]} center>
          <View style={[styles.label, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.labelText}>{modelData.name || '复合几何体'}</Text>
          </View>
        </Html>
      )}
    </group>
  );
};

// ============================================
// 主渲染器组件
// ============================================

interface QuestionModelRendererProps {
  modelData: SpatialModelData;
  showLabels?: boolean;
  highlightFace?: string | null;
  cuttingPlane?: CuttingPlane | null;
  showSection?: boolean;
  sectionPosition?: number;
  onFaceClick?: (faceId: string) => void;
}

export const QuestionModelRenderer: React.FC<QuestionModelRendererProps> = ({
  modelData,
  showLabels = true,
  highlightFace = null,
  cuttingPlane = null,
  showSection = false,
  sectionPosition = 0.5,
  onFaceClick,
}) => {
  const props: DynamicCubeProps = {
    modelData,
    showLabels,
    highlightFace,
    cuttingPlane,
    showSection,
    sectionPosition,
    onFaceClick,
  };

  // 调试日志
  console.log('[QuestionModelRenderer] modelData.type:', modelData.type);
  console.log('[QuestionModelRenderer] modelData.components?.length:', (modelData as any).components?.length);

  switch (modelData.type) {
    case 'cube':
    case 'cuboid':
      return <DynamicCubeRenderer {...props} />;
    case 'cylinder':
      return <DynamicCylinderRenderer {...props} />;
    case 'cone':
      return <DynamicConeRenderer {...props} />;
    case 'sphere':
      return <DynamicSphereRenderer {...props} />;
    case 'pyramid_square':
    case 'pyramid_triangular':
      return <DynamicCubeRenderer {...props} />;
    case 'prism_triangular':
    case 'prism_hexagonal':
      return <DynamicCylinderRenderer {...props} />;
    case 'composite':
      console.log('[QuestionModelRenderer] Using CompositeRenderer');
      return <CompositeRenderer {...props} />;
    default:
      // 检查是否有 components 或 embedded_shape 特征，如果有则使用复合渲染器
      if ((modelData as any).components?.length > 0 ||
          modelData.features?.some(f => f.type === 'embedded_shape')) {
        console.log('[QuestionModelRenderer] Using CompositeRenderer (fallback)');
        return <CompositeRenderer {...props} />;
      }
      console.log('[QuestionModelRenderer] Using DynamicCubeRenderer (default)');
      return <DynamicCubeRenderer {...props} />;
  }
};

// ============================================
// 交互控制面板
// ============================================

interface InteractiveModelPanelProps {
  modelData: SpatialModelData;
  showSection: boolean;
  showSectionToggle: (show: boolean) => void;
  sectionPosition: number;
  sectionPositionChange: (pos: number) => void;
  cuttingAngle: number;
  cuttingAngleChange: (angle: number) => void;
  cuttingDirection: 'horizontal' | 'vertical' | 'diagonal';
  cuttingDirectionChange: (dir: 'horizontal' | 'vertical' | 'diagonal') => void;
  highlightFace: string | null;
  highlightFaceChange: (faceId: string | null) => void;
  showLabels: boolean;
  showLabelsToggle: () => void;
}

export const InteractiveModelPanel: React.FC<InteractiveModelPanelProps> = ({
  modelData,
  showSection,
  showSectionToggle,
  sectionPosition,
  sectionPositionChange,
  cuttingAngle,
  cuttingAngleChange,
  cuttingDirection,
  cuttingDirectionChange,
  highlightFace,
  highlightFaceChange,
  showLabels,
  showLabelsToggle,
}) => {
  const faces = modelData.faces || [];

  return (
    <ScrollView style={styles.panelContainer}>
      {/* 模型信息 */}
      <Card style={styles.card}>
        <Card.Title title={modelData.name || '立体模型'} />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>类型:</Text>
            <Text style={styles.infoValue}>{modelData.type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>尺寸:</Text>
            <Text style={styles.infoValue}>
              {modelData.dimensions?.length?.toFixed(1) || '1.0'} × {modelData.dimensions?.width?.toFixed(1) || '1.0'} × {modelData.dimensions?.height?.toFixed(1) || '1.0'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* 截面控制 */}
      <Card style={styles.card}>
        <Card.Title title="截面控制" />
        <Card.Content>
          <View style={styles.row}>
            <Button
              mode={showSection ? 'contained' : 'outlined'}
              onPress={() => showSectionToggle(!showSection)}
              style={styles.button}
            >
              {showSection ? '隐藏截面' : '显示截面'}
            </Button>
            <Button
              mode={showLabels ? 'contained' : 'outlined'}
              onPress={showLabelsToggle}
              style={styles.button}
            >
              {showLabels ? '隐藏标签' : '显示标签'}
            </Button>
          </View>

          {showSection && (
            <>
              <Text style={styles.label}>切割方向</Text>
              <SegmentedButtons
                value={cuttingDirection}
                onValueChange={(v) => cuttingDirectionChange(v as 'horizontal' | 'vertical' | 'diagonal')}
                buttons={[
                  { value: 'horizontal', label: '水平' },
                  { value: 'vertical', label: '垂直' },
                  { value: 'diagonal', label: '斜切' },
                ]}
                style={styles.segmented}
              />

              {cuttingDirection === 'diagonal' && (
                <>
                  <Text style={styles.label}>切割角度: {cuttingAngle}°</Text>
                  <Slider
                    value={cuttingAngle}
                    onValueChange={cuttingAngleChange}
                    min={0}
                    max={90}
                    step={5}
                    style={styles.slider}
                  />
                </>
              )}

              <Text style={styles.label}>切割位置: {(sectionPosition * 100).toFixed(0)}%</Text>
              <Slider
                value={sectionPosition}
                onValueChange={sectionPositionChange}
                min={0}
                max={1}
                step={0.05}
                style={styles.slider}
              />
            </>
          )}
        </Card.Content>
      </Card>

      {/* 面选择 */}
      {faces.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="选择面" />
          <Card.Content>
            <View style={styles.faceGrid}>
              {faces.map((face) => (
                <TouchableOpacity
                  key={face.id}
                  style={[
                    styles.faceButton,
                    highlightFace === face.id && styles.faceButtonActive,
                  ]}
                  onPress={() => highlightFaceChange(highlightFace === face.id ? null : face.id)}
                >
                  <Text style={styles.faceButtonText}>{face.name}</Text>
                  {face.hasMark && <Text style={styles.faceMark}>⬤</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 特征信息 */}
      {modelData.features && modelData.features.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="图形特征" />
          <Card.Content>
            {modelData.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>
                  {feature.type === 'hole' ? '⭕' : feature.type === 'pattern' ? '🔷' : '📍'}
                </Text>
                <Text style={styles.featureText}>{feature.description}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  faceLabel: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  faceLabelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  label: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  labelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  panelContainer: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
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
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  segmented: {
    marginBottom: 12,
  },
  slider: {
    marginBottom: 12,
  },
  faceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  faceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  faceButtonActive: {
    backgroundColor: '#4CAF50',
  },
  faceButtonText: {
    fontSize: 12,
    color: '#333',
  },
  faceMark: {
    fontSize: 12,
    marginLeft: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
});

export default QuestionModelRenderer;
