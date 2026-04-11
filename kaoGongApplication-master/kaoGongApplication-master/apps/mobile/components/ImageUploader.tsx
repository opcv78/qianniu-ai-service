import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Button, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

interface ImageUploaderProps {
  onImageSelected: (uri: string, base64?: string) => void;
  isLoading?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  isLoading = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPickerLoading, setIsPickerLoading] = useState(false);

  const pickImage = async () => {
    try {
      setIsPickerLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('需要相册权限才能选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        onImageSelected(asset.uri, asset.base64);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      alert('选择图片失败，请重试');
    } finally {
      setIsPickerLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsPickerLoading(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('需要相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        onImageSelected(asset.uri, asset.base64);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      alert('拍照失败，请重试');
    } finally {
      setIsPickerLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
  };

  if (selectedImage) {
    return (
      <Card style={styles.previewCard}>
        <Card.Cover source={{ uri: selectedImage }} style={styles.preview} />
        <Card.Actions style={styles.actions}>
          <Button onPress={clearImage} disabled={isLoading}>重新选择</Button>
          <Button mode="contained" onPress={() => onImageSelected(selectedImage)} loading={isLoading} disabled={isLoading}>
            开始分析
          </Button>
        </Card.Actions>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <TouchableOpacity style={styles.buttonContainer} onPress={pickImage} disabled={isLoading || isPickerLoading}>
          <View style={styles.button}>
            {isPickerLoading ? <ActivityIndicator color="#4CAF50" /> : (
              <>
                <Text style={styles.buttonIcon}>📷</Text>
                <Text style={styles.buttonText}>从相册选择</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonContainer} onPress={takePhoto} disabled={isLoading || isPickerLoading}>
          <View style={styles.button}>
            {isPickerLoading ? <ActivityIndicator color="#4CAF50" /> : (
              <>
                <Text style={styles.buttonIcon}>📸</Text>
                <Text style={styles.buttonText}>拍照上传</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>支持 JPG、PNG 格式，建议图片清晰</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  placeholder: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  buttonContainer: { flex: 1, marginHorizontal: 8 },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
  },
  buttonIcon: { fontSize: 32, marginBottom: 8 },
  buttonText: { fontSize: 14, color: '#333', fontWeight: '500' },
  previewCard: { overflow: 'hidden' },
  preview: { height: 250 },
  actions: { justifyContent: 'flex-end', paddingHorizontal: 8 },
  hint: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 12 },
});
