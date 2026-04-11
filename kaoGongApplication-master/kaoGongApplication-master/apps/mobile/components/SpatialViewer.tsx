import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Card, Button, Chip, Divider } from 'react-native-paper';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere, Grid, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface SpatialViewerProps {
  type: 'folding' | 'section' | 'assembly' | 'view';
  data?: {
    faces?: string[];
    color?: string;
  };
}

// 立方体组件（折叠展示）
const Cube3D: React.FC<{ expanded: boolean }> = ({ expanded }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  if (expanded) {
    // 展开状态 - 显示6个面分开
    return (
      <group ref={groupRef}>
        {/* 顶面 */}
        <Box position={[0, 2, 0]} args={[0.95, 0.05, 0.95]}>
          <meshStandardMaterial color="#4CAF50" transparent opacity={0.8} />
        </Box>
        {/* 底面 */}
        <Box position={[0, -2, 0]} args={[0.95, 0.05, 0.95]}>
          <meshStandardMaterial color="#2196F3" transparent opacity={0.8} />
        </Box>
        {/* 前面 */}
        <Box position={[0, 0, 2]} args={[0.95, 0.95, 0.05]}>
          <meshStandardMaterial color="#FF9800" transparent opacity={0.8} />
        </Box>
        {/* 后面 */}
        <Box position={[0, 0, -2]} args={[0.95, 0.95, 0.05]}>
          <meshStandardMaterial color="#9C27B0" transparent opacity={0.8} />
        </Box>
        {/* 左面 */}
        <Box position={[-2, 0, 0]} args={[0.05, 0.95, 0.95]}>
          <meshStandardMaterial color="#E91E63" transparent opacity={0.8} />
        </Box>
        {/* 右面 */}
        <Box position={[2, 0, 0]} args={[0.05, 0.95, 0.95]}>
          <meshStandardMaterial color="#00BCD4" transparent opacity={0.8} />
        </Box>
      </group>
    );
  }

  // 折叠状态 - 完整立方体
  return (
    <group ref={groupRef}>
      <Box args={[1, 1, 1]}>
        <meshStandardMaterial color="#4CAF50" />
      </Box>
    </group>
  );
};

// 截面展示组件
const Section3D: React.FC<{ cutAngle: number }> = ({ cutAngle }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 立方体 */}
      <Box args={[1, 1, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#4CAF50" transparent opacity={0.5} />
      </Box>
      {/* 切割平面 */}
      <mesh position={[0, 0, 0]} rotation={[cutAngle * Math.PI / 180, 0, 0]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial color="#F44336" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// 立体拼图组件
const Assembly3D: React.FC<{ pieces: number }> = ({ pieces }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4'];
  
  return (
    <group ref={groupRef}>
      {Array.from({ length: Math.min(pieces, 6) }).map((_, i) => {
        const angle = (i / Math.min(pieces, 6)) * Math.PI * 2;
        const radius = 0.8;
        return (
          <Box
            key={i}
            args={[0.4, 0.4, 0.4]}
            position={[
              Math.cos(angle) * radius,
              0,
              Math.sin(angle) * radius,
            ]}
          >
            <meshStandardMaterial color={colors[i % colors.length]} />
          </Box>
        );
      })}
    </group>
  );
};

// 视图展示组件
const View3D: React.FC<{ viewAngle: string }> = ({ viewAngle }) => {
  const groupRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 立体图形 */}
      <Box args={[1, 1.5, 0.8]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#4CAF50" />
      </Box>
      {/* 标记箭头 */}
      <Cylinder args={[0.02, 0.02, 0.5]} position={[0, 1.1, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#F44336" />
      </Cylinder>
    </group>
  );
};

export const SpatialViewer: React.FC<SpatialViewerProps> = ({ type, data }) => {
  const [expanded, setExpanded] = useState(true);
  const [cutAngle, setCutAngle] = useState(45);
  const [pieces, setPieces] = useState(4);
  const [currentView, setCurrentView] = useState(0);

  const views = ['正面', '侧面', '顶部', '等轴测'];
  
  const controls = {
    folding: (
      <View style={styles.controls}>
        <Text style={styles.controlLabel}>折叠状态</Text>
        <View style={styles.buttonRow}>
          <Button
            mode={expanded ? 'contained' : 'outlined'}
            onPress={() => setExpanded(true)}
            compact
          >
            展开
          </Button>
          <Button
            mode={!expanded ? 'contained' : 'outlined'}
            onPress={() => setExpanded(false)}
            compact
          >
            折叠
          </Button>
        </View>
        <Text style={styles.hint}>拖动旋转查看立方体</Text>
      </View>
    ),
    section: (
      <View style={styles.controls}>
        <Text style={styles.controlLabel}>切割角度: {cutAngle}°</Text>
        <View style={styles.sliderButtons}>
          {[0, 30, 45, 60, 90].map((angle) => (
            <Button
              key={angle}
              mode={cutAngle === angle ? 'contained' : 'outlined'}
              onPress={() => setCutAngle(angle)}
              compact
            >
              {angle}°
            </Button>
          ))}
        </View>
        <Text style={styles.hint}>选择切割角度查看截面</Text>
      </View>
    ),
    assembly: (
      <View style={styles.controls}>
        <Text style={styles.controlLabel}>拼图块数: {pieces}</Text>
        <View style={styles.sliderButtons}>
          {[2, 3, 4, 5, 6].map((num) => (
            <Button
              key={num}
              mode={pieces === num ? 'contained' : 'outlined'}
              onPress={() => setPieces(num)}
              compact
            >
              {num}
            </Button>
          ))}
        </View>
        <Text style={styles.hint}>拖动旋转查看拼图</Text>
      </View>
    ),
    view: (
      <View style={styles.controls}>
        <Text style={styles.controlLabel}>视图方向</Text>
        <View style={styles.sliderButtons}>
          {views.map((view, index) => (
            <Button
              key={view}
              mode={currentView === index ? 'contained' : 'outlined'}
              onPress={() => setCurrentView(index)}
              compact
            >
              {view}
            </Button>
          ))}
        </View>
        <Text style={styles.hint}>选择不同视角观察</Text>
      </View>
    ),
  };

  const titles = {
    folding: '折叠类题目 - 3D展示',
    section: '截面类题目 - 切割演示',
    assembly: '立体拼图 - 拼合展示',
    view: '视图类题目 - 多角度观察',
  };

  const render3DScene = () => {
    switch (type) {
      case 'folding':
        return <Cube3D expanded={expanded} />;
      case 'section':
        return <Section3D cutAngle={cutAngle} />;
      case 'assembly':
        return <Assembly3D pieces={pieces} />;
      case 'view':
        return <View3D viewAngle={views[currentView]} />;
      default:
        return <Cube3D expanded={expanded} />;
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Title title={titles[type]} />
      <Card.Content>
        {/* 3D 渲染区域 */}
        <View style={styles.canvas}>
          <Canvas style={{ width: '100%', height: '100%' }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={2}
              maxDistance={10}
            />
            {render3DScene()}
            <Grid
              infiniteGrid
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#6f6f6f"
              sectionSize={1}
              sectionThickness={1}
              sectionColor="#9f9f9f"
              fadeDistance={10}
              position={[0, -1, 0]}
            />
          </Canvas>
        </View>

        {/* 控制面板 */}
        {controls[type]}

        {/* 操作提示 */}
        <View style={styles.tips}>
          <Text style={styles.tipText}>💡 操作提示:</Text>
          <Text style={styles.tipItem}>• 单指拖动旋转模型</Text>
          <Text style={styles.tipItem}>• 双指捏合缩放</Text>
          <Text style={styles.tipItem}>• 点击下方按钮切换状态</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  canvas: {
    width: '100%',
    height: 300,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  controls: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  tips: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  tipItem: {
    fontSize: 12,
    color: '#555',
    marginLeft: 8,
    marginTop: 2,
  },
});
