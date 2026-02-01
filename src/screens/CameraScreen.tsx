import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { analyzeReceiptImage } from '../services/geminiService';
import { useReceipts } from '../hooks/useReceipts';
import { colors } from '../utils/colors';

export const CameraScreen: React.FC = () => {
  const navigation = useNavigation();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  const { addReceipt } = useReceipts();

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        if (photo) {
          setCapturedImage(photo.uri);
          await analyzeImage(photo.base64!, 'image/jpeg');
        }
      } catch (err) {
        Alert.alert('Ошибка', 'Не удалось сделать фото');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCapturedImage(asset.uri);
      const mimeType = asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      await analyzeImage(asset.base64!, mimeType);
    }
  };

  const analyzeImage = async (base64: string, mimeType: string) => {
    setAnalyzing(true);
    try {
      const receiptData = await analyzeReceiptImage(base64, mimeType);
      const result = await addReceipt(receiptData);
      
      if (result.success) {
        Alert.alert(
          'Успешно!',
          `Чек от "${receiptData.merchant}" добавлен`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Внимание', result.error || 'Ошибка добавления чека');
        setCapturedImage(null);
      }
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось распознать чек');
      setCapturedImage(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
  };

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color={colors.textMuted} />
        <Text style={styles.permissionTitle}>Доступ к камере</Text>
        <Text style={styles.permissionText}>
          Разрешите доступ к камере для сканирования чеков
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Разрешить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
          <Ionicons name="images-outline" size={20} color={colors.primary} />
          <Text style={styles.galleryButtonText}>Выбрать из галереи</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Analyzing state
  if (analyzing) {
    return (
      <View style={styles.analyzingContainer}>
        <LinearGradient
          colors={colors.gradientPrimary as [string, string]}
          style={styles.analyzingGradient}
        >
          <ActivityIndicator size="large" color="white" />
        </LinearGradient>
        <Text style={styles.analyzingTitle}>Анализируем чек...</Text>
        <Text style={styles.analyzingSubtitle}>
          Распознаём товары и категории
        </Text>
        {capturedImage && (
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        )}
      </View>
    );
  }

  // Preview captured image
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.fullImage} />
        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.retakeButton} onPress={retake}>
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.retakeText}>Переснять</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Guide frame */}
        <View style={styles.guideFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        <Text style={styles.guideText}>
          Расположите чек в рамке
        </Text>
      </CameraView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
          <Ionicons name="images" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
        >
          <Ionicons name="camera-reverse" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Close button */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: '85%',
    height: '60%',
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
    borderBottomRightRadius: 12,
  },
  guideText: {
    position: 'absolute',
    bottom: 80,
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 20,
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  galleryButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
  analyzingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  analyzingGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  analyzingSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  previewImage: {
    width: 200,
    height: 280,
    borderRadius: 12,
    marginTop: 30,
    opacity: 0.7,
  },
  fullImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },
  retakeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
