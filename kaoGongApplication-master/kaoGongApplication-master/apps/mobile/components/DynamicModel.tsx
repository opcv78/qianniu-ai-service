/**
 * 动态3D模型渲染器
 * 根据后端返回的 spatialModelData 动态渲染立体图形
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere, Cone, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { SpatialModelData, SpatialFace, CuttingPlane, SectionInfo } from '@kao-gong/shared';

// ============================================
// 类型定义
// ============================================

interface DynamicModelProps {
  modelData: SpatialModelData;
  showLabels?: boolean;
  highlightFace?: string;
  cuttingPlane?: CuttingPlane;
  showSection?: boolean;
  sectionPosition?: number;
  onFaceClick?: (faceId: string) => void;
}

// ============================================
// 工具函数
// ============================================

const faceColors: Record<string, string> = {
  top: '#4CAF50',
  bottom: '#2196F3',
  front: '#FF9800',
  back: '#9C27B0',
  left: '#E91E63',
  right: '#00BCD4',
};

const defaultColors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#FFEB3B', '#795548'];

// ============================================
// 立方体组件
// ============================================

const DynamicCube: React.FC<DynamicModelProps> = ({
  modelData,
  showLabels = true,
  highlightFace,
  cuttingPlane,
  showSection = false,
  sectionPosition = 0.5,
  onFaceClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { dimensions, faces } = modelData;

  const length = dimensions?.length || 1;
  const width = dimensions?.width || 1;
  const height = dimensions?.height || 1;

  // 自动旋转
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  // 计算截面
  const sectionShape = useMemo(() => {
    if (!showSection || !cuttingPlane) return null;

    const angleRad = (cuttingPlane.angle * Math.PI) / 180;
    const direction = cuttingPlane.direction;

    // 简化的截面计算 - 实际应根据角度和位置计算
    if (direction === 'horizontal') {
      return {
        shape: 'rectangle',
        width: length,
        height: width,
      };
    } else if (direction === 'vertical') {
      return {
        shape: 'rectangle',
        width: length,
        height: height,
      };
    } else {
      // diagonal
      return {
        shape: 'rectangle',
        width: Math.sqrt(length * length + height * height),
        height: width,
      };
    }
  }, [showSection, cuttingPlane, length, width, height]);

  return (
    <group ref={groupRef}>
      {/* 立方体主体 - 半透明 */}
      <Box args={[length, height, width]}>
        <meshStandardMaterial color="#888" transparent opacity={0.3} />
      </Box>

      {/* 各个面 */}
      {faces.map((face, index) => {
        const color = face.color || defaultColors[index % defaultColors.length];
        const isHighlighted = highlightFace === face.id;

        // 根据面名称确定位置和旋转
        let position: [number, number, number] = [0, 0, 0];
        let rotation: [number, number, number] = [0, 0, 0];
        let planeSize: [number, number] = [length, width];

        switch (face.name?.toLowerCase()) {
          case 'top':
          case '顶面':
            position = [0, height / 2 + 0.01, 0];
            rotation = [-Math.PI / 2, 0, 0];
            planeSize = [length, width];
            break;
          case 'bottom':
          case '底面':
            position = [0, -height / 2 - 0.01, 0];
            rotation = [Math.PI / 2, 0, 0];
            planeSize = [length, width];
            break;
          case 'front':
          case '前面':
            position = [0, 0, width / 2 + 0.01];
            rotation = [0, 0, 0];
            planeSize = [length, height];
            break;
          case 'back':
          case '后面':
            position = [0, 0, -width / 2 - 0.01];
            rotation = [0, Math.PI, 0];
            planeSize = [length, height];
            break;
          case 'left':
          case '左面':
            position = [-length / 2 - 0.01, 0, 0];
            rotation = [0, -Math.PI / 2, 0];
            planeSize = [width, height];
            break;
          case 'right':
          case '右面':
            position = [length / 2 + 0.01, 0, 0];
            rotation = [0, Math.PI / 2, 0];
            planeSize = [width, height];
            break;
          default:
            // 使用默认位置
            position = [0, 0, 0];
        }

        return (
          <group key={face.id || index} position={position} rotation={rotation}>
            <mesh onClick={() => onFaceClick?.(face.id)}>
              <planeGeometry args={[planeSize[0] * 0.95, planeSize[1] * 0.95]} />
              <meshStandardMaterial
                color={isHighlighted ? '#FF5722' : color}
                transparent
                opacity={isHighlighted ? 0.95 : 0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
            {showLabels && (
              <Html position={[0, 0, 0.02]} center>
                <div
                  style={{
                    backgroundColor: isHighlighted ? '#FF5722' : color,
                    padding: '4px 8px',
                    borderRadius: 4,
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {face.name}
                  {face.hasMark && ' ⬤'}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* 截面 */}
      {showSection && cuttingPlane && (
        <mesh
          position={[0, 0, 0]}
          rotation={[
            cuttingPlane.direction === 'vertical' ? 0 : (cuttingPlane.angle * Math.PI) / 180,
            0,
            cuttingPlane.direction === 'horizontal' ? 0 : (cuttingPlane.angle * Math.PI) / 180,
          ]}
        >
          <planeGeometry args={[length * 1.5, width * 1.5]} />
          <meshStandardMaterial
            color="#F44336"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
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
// 圆柱组件
// ============================================

const DynamicCylinder: React.FC<DynamicModelProps> = ({
  modelData,
  showLabels = true,
  cuttingPlane,
  showSection = false,
  sectionPosition = 0.5,
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

  // 检查是否有孔
  const hasHole = features?.some(f => f.type === 'hole');
  const holeRadius = features?.find(f => f.type === 'hole')?.size || 0.2;

  return (
    <group ref={groupRef}>
      {/* 圆柱主体 */}
      <Cylinder args={[radius, radius, height, 32]}>
        <meshStandardMaterial color="#2196F3" transparent opacity={0.8} />
      </Cylinder>

      {/* 如果有孔 */}
      {hasHole && (
        <Cylinder args={[holeRadius, holeRadius, height + 0.1, 32]}>
          <meshStandardMaterial color="#333" />
        </Cylinder>
      )}

      {/* 截面 */}
      {showSection && cuttingPlane && (
        <mesh
          position={[0, (sectionPosition - 0.5) * height, 0]}
          rotation={[Math.PI / 2, 0, (cuttingPlane.angle * Math.PI) / 180]}
        >
          <circleGeometry args={[radius, 32]} />
          <meshStandardMaterial color="#F44336" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showLabels && (
        <>
          <Html position={[0, height / 2 + 0.3, 0]} center>
            <div style={{ backgroundColor: '#2196F3', padding: '4px 8px', borderRadius: 4, color: 'white', fontSize: 12 }}>
              圆柱 (r={radius.toFixed(1)}, h={height.toFixed(1)})
            </div>
          </Html>
          {hasHole && (
            <Html position={[radius + 0.3, 0, 0]} center>
              <div style={{ backgroundColor: '#FF9800', padding: '4px 8px', borderRadius: 4, color: 'white', fontSize: 11 }}>
                通孔 r={holeRadius.toFixed(1)}
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
};

// ============================================
// 圆锥组件
// ============================================

const DynamicCone: React.FC<DynamicModelProps> = ({
  modelData,
  showLabels = true,
  cuttingPlane,
  showSection = false,
  sectionPosition = 0.5,
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

  // 计算圆锥在指定高度的截面半径
  const sectionRadius = radius * (1 - sectionPosition);

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
          <circleGeometry args={[sectionRadius, 32]} />
          <meshStandardMaterial color="#F44336" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showLabels && (
        <Html position={[0, height / 2 + 0.3, 0]} center>
          <div style={{ backgroundColor: '#FF9800', padding: '4px 8px', borderRadius: 4, color: 'white', fontSize: 12 }}>
            圆锥 (r={radius.toFixed(1)}, h={height.toFixed(1)})
          </div>
        </Html>
      )}
    </group>
  );
};

// ============================================
// 球体组件
// ============================================

const DynamicSphere: React.FC<DynamicModelProps> = ({
  modelData,
  showLabels = true,
  cuttingPlane,
  showSection = false,
  sectionPosition = 0.5,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { dimensions } = modelData;

  const radius = dimensions?.radius || 0.7;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  // 计算球在指定高度的截面半径
  const sectionRadius = Math.sqrt(radius * radius - Math.pow((sectionPosition - 0.5) * 2 * radius, 2));

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
          <circleGeometry args={[sectionRadius || 0.1, 32]} />
          <meshStandardMaterial color="#F44336" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showLabels && (
        <Html position={[0, radius + 0.3, 0]} center>
          <div style={{ backgroundColor: '#9C27B0', padding: '4px 8px', borderRadius: 4, color: 'white', fontSize: 12 }}>
            球体 (r={radius.toFixed(1)})
          </div>
        </Html>
      )}
    </group>
  );
};

// ============================================
// 棱锥组件
// ============================================

const DynamicPyramid: React.FC<DynamicModelProps> = ({
  modelData,
  showLabels = true,
  highlightFace,
  onFaceClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { dimensions, faces } = modelData;

  const baseSize = dimensions?.length || 1;
  const height = dimensions?.height || 1.2;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 四棱锥 - 使用 Cone 近似 */}
      <Cone args={[baseSize / 2, height, 4]}>
        <meshStandardMaterial color="#4CAF50" transparent opacity={0.8} />
      </Cone>

      {showLabels && (
        <Html position={[0, height / 2 + 0.3, 0]} center>
          <div style={{ backgroundColor: '#4CAF50', padding: '4px 8px', borderRadius: 4, color: 'white', fontSize: 12 }}>
            棱锥
          </div>
        </Html>
      )}
    </group>
  );
};

// ============================================
// 棱柱组件
// ============================================

const DynamicPrism: React.FC<DynamicModelProps> = ({
  modelData,
  showLabels = true,
  showSection = false,
  sectionPosition = 0.5,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { dimensions } = modelData;

  const radius = dimensions?.radius || 0.5;
  const height = dimensions?.height || 1.5;
  const sides = modelData.type === 'prism_hexagonal' ? 6 : 3;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      <Cylinder args={[radius, radius, height, sides]}>
        <meshStandardMaterial color="#00BCD4" transparent opacity={0.8} />
      </Cylinder>

      {showLabels && (
        <Html position={[0, height / 2 + 0.3, 0]} center>
          <div style={{ backgroundColor: '#00BCD4', padding: '4px 8px', borderRadius: 4, color: 'white', fontSize: 12 }}>
            {sides === 6 ? '六棱柱' : '三棱柱'}
          </div>
        </Html>
      )}
    </group>
  );
};

// ============================================
// 主组件 - 根据 modelData.type 渲染不同模型
// ============================================

export const DynamicModel: React.FC<DynamicModelProps> = (props) => {
  const { modelData } = props;

  switch (modelData.type) {
    case 'cube':
    case 'cuboid':
      return <DynamicCube {...props} />;
    case 'cylinder':
      return <DynamicCylinder {...props} />;
    case 'cone':
      return <DynamicCone {...props} />;
    case 'sphere':
      return <DynamicSphere {...props} />;
    case 'pyramid_square':
    case 'pyramid_triangular':
      return <DynamicPyramid {...props} />;
    case 'prism_triangular':
    case 'prism_hexagonal':
      return <DynamicPrism {...props} />;
    default:
      return <DynamicCube {...props} />;
  }
};

// ============================================
// 交互式切割控制组件
// ============================================

interface InteractiveSectionControlsProps {
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

export const InteractiveSectionControls: React.FC<InteractiveSectionControlsProps> = ({
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

  return null; // 控制组件在 spatial.tsx 中实现
};

export default DynamicModel;
