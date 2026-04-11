import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, Title, Chip, Button, Divider } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService, AnalyzeResult } from '../services/api';
import { useAppStore } from '../stores/useAppStore';

// Demo数据
const DEMO_DATA: Record<string, any> = {
  position_move: {
    name: '位置移动规律',
    description: '图形元素在九宫格中按照固定方向和步长移动',
    details: ['观察第一行，元素从左向右移动一格', '移动步长固定为1格', '移动方向为从左到右'],
    confidence: 0.95,
    type: '平面类',
    subType: '位置移动',
    steps: ['高亮第一个元素位置', '显示移动方向箭头', '执行移动动画', '显示最终结果'],
  },
  rotation: {
    name: '旋转规律',
    description: '图形元素顺时针旋转90度',
    details: ['每个元素相对前一个顺时针旋转90度', '旋转中心为元素中心点', '旋转方向为顺时针'],
    confidence: 0.92,
    type: '平面类',
    subType: '旋转',
    steps: ['高亮第一个元素', '显示旋转角度标注', '执行旋转动画', '显示规律总结'],
  },
  overlay: {
    name: '去同存异规律',
    description: '两个图形叠加，相同部分消失，不同部分保留',
    details: ['第一幅图和第二幅图叠加', '相同的线条消失', '不同的线条保留'],
    confidence: 0.88,
    type: '平面类',
    subType: '叠加',
    steps: ['高亮第一个图形', '高亮第二个图形', '执行叠加动画', '显示最终结果'],
  },
  folding: {
    name: '折叠规律',
    description: '将平面展开图折叠成立方体',
    details: ['展开图有6个面', '需要注意面的相对位置', '相邻面的折叠方向很重要'],
    confidence: 0.85,
    type: '立体类',
    subType: '折叠',
    steps: ['识别折叠类题目', '显示展开图分析', '提示进入半自动模式'],
  },
  view: {
    name: '视图规律',
    description: '从不同角度观察立体图形',
    details: ['需要识别观察角度', '理解投影关系', '建立空间想象'],
    confidence: 0.82,
    type: '立体类',
    subType: '视图',
    steps: ['识别视图类题目', '显示立体图分析', '提示进入半自动模式'],
  },
};

export default function AnalysisScreen() {
  const params = useLocalSearchParams<{
    imageUri?: string;
    imageId?: string;
    demoId?: string;
    isDemo?: string;
  }>();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const addToHistory = useAppStore(state => state.addToHistory);

  const isDemo = params.isDemo === 'true';
  const demoId = params.demoId || 'position_move';

  useEffect(() => {
    if (isDemo) {
      // Demo模式
      const demoData = DEMO_DATA[demoId] || DEMO_DATA.position_move;
      setResult(demoData);
      setImageUri(null);
      return;
    }

    if (params.imageUri) {
      setImageUri(params.imageUri);
      analyzeImage(params.imageUri);
    }
  }, [params.imageUri, params.demoId, isDemo]);

  const analyzeImage = async (uri: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.fullAnalysis(uri);

      if (!response.success) {
        setError(response.error || '分析失败');
        return;
      }

      if (response.analysis) {
        const analysisData = {
          name: response.analysis.ruleSummary?.name || '未知规律',
          description: response.analysis.ruleSummary?.description || '',
          details: response.analysis.ruleSummary?.details || [],
          confidence: response.analysis.confidence,
          type: response.analysis.majorType === 'planar' ? '平面类' : '立体类',
          subType: response.analysis.subType,
          steps: response.analysis.animationPlan?.steps?.map((s: any) => s.narration) || [],
          explanation: response.analysis.explanation,
          spatialModelData: response.analysis.spatialModelData,
        };

        setResult(analysisData);
        setImageUri(uri);

        // 添加到历史记录
        if (response.imageId) {
          addToHistory({
            id: response.imageId,
            imageId: response.imageId,
            imageUrl: uri,
            majorType: response.analysis.majorType,
            subType: response.analysis.subType,
            confidence: response.analysis.confidence,
            explanation: response.analysis.explanation,
            createdAt: new Date().toISOString(),
            analyzedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnter3D = () => {
    // 根据子类型映射到对应的 3D 演示
    const subTypeTo3D: Record<string, string> = {
      // 立体类
      folding: 'folding',
      section: 'section',
      solid_assembly: 'assembly',
      view_projection: 'view',
      mixed_spatial: 'folding',
      // 默认
      default: 'folding',
    };

    const spatialType = subTypeTo3D[result?.subType || ''] || subTypeTo3D.default;

    // 准备导航参数
    const navParams: Record<string, string> = {
      type: spatialType,
      subType: result?.subType || '',
      imageId: params.imageId || '',
    };

    // 如果有模型数据，传递给 spatial 页面
    if (result?.spatialModelData) {
      console.log('[Analysis] spatialModelData found:', result.spatialModelData);
      console.log('[Analysis] spatialModelData type:', result.spatialModelData.type);
      console.log('[Analysis] spatialModelData components:', result.spatialModelData.components?.length);
      console.log('[Analysis] spatialModelData features:', result.spatialModelData.features?.length);
      navParams.modelData = JSON.stringify(result.spatialModelData);
    } else {
      console.warn('[Analysis] No spatialModelData in result');
      console.log('[Analysis] Result keys:', Object.keys(result || {}));
    }

    router.push({
      pathname: '/spatial',
      params: navParams,
    });
  };

  const handleEnterSemiAuto = () => {
    // 进入半自动模式
    router.push({
      pathname: '/semi-auto',
      params: {
        subType: result?.subType || '',
        imageId: params.imageId || '',
        imageUrl: imageUri || '',
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="分析中" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>正在分析题目...</Text>
          <Text style={styles.loadingSubtext}>AI 正在识别题型和规律</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="分析失败" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => router.push('/')} style={styles.retryButton}>
            返回首页
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="无结果" />
        </Appbar.Header>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无分析结果</Text>
        </View>
      </SafeAreaView>
    );
  }

  const data = result;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="分析结果" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* 原图预览 */}
        {imageUri && (
          <Card style={styles.imageCard}>
            <Card.Cover source={{ uri: imageUri }} style={styles.image} />
          </Card>
        )}

        {/* Demo 标识 */}
        {isDemo && (
          <Card style={styles.demoCard}>
            <Card.Content>
              <Text style={styles.demoText}>🎭 演示模式</Text>
            </Card.Content>
          </Card>
        )}

        {/* 题型信息 */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.typeRow}>
              <Chip
                mode="contained"
                style={[
                  styles.typeChip,
                  { backgroundColor: data.type === '平面类' ? '#4CAF50' : '#FF9800' },
                ]}
              >
                {data.type}
              </Chip>
              <Text style={styles.confidence}>置信度: {Math.round(data.confidence * 100)}%</Text>
            </View>
            <Title style={styles.ruleName}>{data.name}</Title>
            <Text style={styles.description}>{data.description}</Text>
          </Card.Content>
        </Card>

        {/* 关键点 */}
        {data.details && data.details.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="关键点" />
            <Card.Content>
              {data.details.map((detail: string, index: number) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* 动画步骤 */}
        {data.steps && data.steps.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="解析步骤" />
            <Card.Content>
              {data.steps.map((step: string, index: number) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* 立体类3D入口 */}
        {data.type === '立体类' && (
          <Card style={styles.card3D}>
            <Card.Content>
              <Text style={styles.card3DTitle}>🎮 3D交互演示</Text>
              <Text style={styles.card3DDesc}>
                根据题目分析结果，可以在3D模型上进行交互操作
              </Text>
              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={handleEnter3D}
                  style={styles.card3DButton}
                >
                  进入3D演示
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleEnterSemiAuto}
                  style={styles.card3DButton}
                >
                  半自动解析
                </Button>
              </View>
              {result?.spatialModelData && (
                <Text style={styles.modelInfo}>
                  📦 模型类型: {result.spatialModelData.name || result.spatialModelData.type}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <Button mode="outlined" onPress={() => router.back()} style={styles.button}>
            返回
          </Button>
          <Button mode="contained" onPress={() => router.push('/')} style={styles.button}>
            回到首页
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { fontSize: 18, fontWeight: '600', marginTop: 16, color: '#333' },
  loadingSubtext: { fontSize: 14, color: '#666', marginTop: 8 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorText: { fontSize: 16, color: '#D32F2F', textAlign: 'center', marginBottom: 24 },
  retryButton: { paddingHorizontal: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  imageCard: { marginBottom: 16 },
  image: { height: 200 },
  demoCard: { marginBottom: 16, backgroundColor: '#E3F2FD' },
  demoText: { fontSize: 14, color: '#1976D2', fontWeight: '600' },
  card: { marginBottom: 16 },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  typeChip: { marginRight: 12 },
  confidence: { fontSize: 12, color: '#666' },
  ruleName: { fontSize: 18, marginBottom: 8 },
  description: { fontSize: 14, color: '#333', lineHeight: 22 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bullet: { fontSize: 14, color: '#4CAF50', marginRight: 8 },
  detailText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  stepItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  stepNumberText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  stepText: { flex: 1, fontSize: 14, color: '#333' },
  card3D: { marginBottom: 16, backgroundColor: '#E8F5E9' },
  card3DTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#2E7D32' },
  card3DDesc: { fontSize: 13, color: '#555', marginBottom: 12 },
  card3DButton: { marginTop: 8, marginRight: 8 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  modelInfo: { fontSize: 12, color: '#666', marginTop: 12, fontStyle: 'italic' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  button: { flex: 1, marginHorizontal: 4 },
});
