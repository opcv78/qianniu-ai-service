import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限提示', '需要相册权限才能选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('错误', '选择图片失败');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限提示', '需要相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('错误', '拍照失败');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      Alert.alert('提示', '请先选择图片');
      return;
    }

    // 直接跳转到分析页，使用图片URI
    router.push({
      pathname: '/analysis',
      params: { 
        imageUri: selectedImage,
        isDemo: 'false'
      },
    });
  };

  const handleDemoPress = (demoId: string) => {
    router.push({
      pathname: '/analysis',
      params: { demoId, isDemo: 'true' },
    });
  };

  const handle3DPress = (type: string) => {
    router.push({
      pathname: '/spatial',
      params: { type },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* 标题 */}
        <View style={styles.header}>
          <Title style={styles.title}>图推动态解析</Title>
          <Paragraph style={styles.subtitle}>
            上传图形推理题，AI 自动识别规律并生成动态解析
          </Paragraph>
        </View>

        {/* 图片上传区域 */}
        <Card style={styles.uploadCard}>
          <Card.Content>
            {selectedImage ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.preview} />
                <View style={styles.previewActions}>
                  <Button onPress={() => setSelectedImage(null)} compact>重新选择</Button>
                  <Button mode="contained" onPress={handleAnalyze}>开始分析</Button>
                </View>
              </View>
            ) : (
              <View style={styles.uploadButtons}>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadText}>从相册选择</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                  <Text style={styles.uploadIcon}>📸</Text>
                  <Text style={styles.uploadText}>拍照上传</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* 3D演示入口 */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>🎮 3D立体演示</Title>
          <Paragraph style={styles.sectionSubtitle}>交互式3D模型，支持旋转、缩放、切割</Paragraph>
          <View style={styles.grid3D}>
            <TouchableOpacity style={[styles.card3D, { backgroundColor: '#E8F5E9' }]} onPress={() => handle3DPress('folding')}>
              <Text style={styles.card3DIcon}>📦</Text>
              <Text style={styles.card3DTitle}>折叠</Text>
              <Text style={styles.card3DDesc}>立方体展开/折叠</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card3D, { backgroundColor: '#FFF3E0' }]} onPress={() => handle3DPress('section')}>
              <Text style={styles.card3DIcon}>✂️</Text>
              <Text style={styles.card3DTitle}>截面</Text>
              <Text style={styles.card3DDesc}>平面切割立体</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card3D, { backgroundColor: '#E3F2FD' }]} onPress={() => handle3DPress('assembly')}>
              <Text style={styles.card3DIcon}>🧩</Text>
              <Text style={styles.card3DTitle}>拼图</Text>
              <Text style={styles.card3DDesc}>立体拼合展示</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card3D, { backgroundColor: '#F3E5F5' }]} onPress={() => handle3DPress('view')}>
              <Text style={styles.card3DIcon}>👁️</Text>
              <Text style={styles.card3DTitle}>视图</Text>
              <Text style={styles.card3DDesc}>多角度观察</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 更多3D模型 */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>🔷 更多3D模型</Title>
          <View style={styles.grid3D}>
            <TouchableOpacity style={[styles.card3D, { backgroundColor: '#E8F5E9' }]} onPress={() => handle3DPress('pyramid')}>
              <Text style={styles.card3DIcon}>🔺</Text>
              <Text style={styles.card3DTitle}>棱锥</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card3D, { backgroundColor: '#E3F2FD' }]} onPress={() => handle3DPress('cylinder')}>
              <Text style={styles.card3DIcon}>⬛</Text>
              <Text style={styles.card3DTitle}>圆柱</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card3D, { backgroundColor: '#FFF3E0' }]} onPress={() => handle3DPress('cone')}>
              <Text style={styles.card3DIcon}>🔶</Text>
              <Text style={styles.card3DTitle}>圆锥</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card3D, { backgroundColor: '#F3E5F5' }]} onPress={() => handle3DPress('sphere')}>
              <Text style={styles.card3DIcon}>⚪</Text>
              <Text style={styles.card3DTitle}>球体</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 示例题入口 */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>📝 示例题目</Title>
          <Paragraph style={styles.sectionSubtitle}>无需上传图片，直接体验演示效果</Paragraph>
          <View style={styles.demoGrid}>
            <TouchableOpacity style={styles.demoCard} onPress={() => handleDemoPress('position_move')}>
              <View style={[styles.demoIcon, { backgroundColor: '#E8F5E9' }]}><Text style={styles.demoEmoji}>↔️</Text></View>
              <Text style={styles.demoName}>位置移动</Text>
              <Text style={styles.demoType}>平面类</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoCard} onPress={() => handleDemoPress('rotation')}>
              <View style={[styles.demoIcon, { backgroundColor: '#E3F2FD' }]}><Text style={styles.demoEmoji}>🔄</Text></View>
              <Text style={styles.demoName}>旋转</Text>
              <Text style={styles.demoType}>平面类</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoCard} onPress={() => handleDemoPress('overlay')}>
              <View style={[styles.demoIcon, { backgroundColor: '#FFF3E0' }]}><Text style={styles.demoEmoji}>⊞</Text></View>
              <Text style={styles.demoName}>叠加</Text>
              <Text style={styles.demoType}>平面类</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoCard} onPress={() => handleDemoPress('folding')}>
              <View style={[styles.demoIcon, { backgroundColor: '#F3E5F5' }]}><Text style={styles.demoEmoji}>📦</Text></View>
              <Text style={styles.demoName}>折叠</Text>
              <Text style={styles.demoType}>立体类</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoCard} onPress={() => handleDemoPress('view')}>
              <View style={[styles.demoIcon, { backgroundColor: '#E0F7FA' }]}><Text style={styles.demoEmoji}>👁️</Text></View>
              <Text style={styles.demoName}>视图</Text>
              <Text style={styles.demoType}>立体类</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 功能说明 */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>✨ 功能特点</Title>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📷</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>图片识别</Text>
                <Text style={styles.featureDesc}>拍照或相册选择，AI 自动识别题型</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎬</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>动态解析</Text>
                <Text style={styles.featureDesc}>平面类题目生成动画演示</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎮</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>3D交互</Text>
                <Text style={styles.featureDesc}>立体类题目支持3D旋转、切割</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部导航 */}
      <View style={styles.bottomNav}>
        <Button mode="text" icon="history" onPress={() => router.push('/history')}>历史</Button>
        <Button mode="text" icon="cog" onPress={() => router.push('/settings')}>设置</Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  uploadCard: { marginBottom: 24 },
  uploadButtons: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  uploadBtn: { alignItems: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 12, flex: 1, marginHorizontal: 8, elevation: 2 },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 14, color: '#333', fontWeight: '500' },
  previewContainer: { alignItems: 'center' },
  preview: { width: '100%', height: 200, borderRadius: 8 },
  previewActions: { flexDirection: 'row', marginTop: 12, gap: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  grid3D: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card3D: { width: '48%', padding: 16, borderRadius: 12, alignItems: 'center' },
  card3DIcon: { fontSize: 28, marginBottom: 6 },
  card3DTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  card3DDesc: { fontSize: 11, color: '#666', marginTop: 2 },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  demoCard: { width: '30%', marginHorizontal: '1.66%', marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  demoIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  demoEmoji: { fontSize: 24 },
  demoName: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 2 },
  demoType: { fontSize: 11, color: '#666' },
  featureList: { marginTop: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  featureIcon: { fontSize: 24, marginRight: 12 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  featureDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
});
