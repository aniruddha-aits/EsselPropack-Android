import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  FlatList,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import StepHeader from './components/StepHeader';
import PrimaryButton from './components/PrimaryButton';
import { useIncident } from './context/IncidentContext';

const { width, height } = Dimensions.get('window');

const CameraScreen = ({ onNext, onBack }) => {
  const cameraRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const { incidentData, updateIncidentData } = useIncident();
  const [photos, setPhotos] = useState(incidentData.photos || []);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [cameraType, setCameraType] = useState('back');
  const [showGallery, setShowGallery] = useState(false);
  
  // Animation values
  const shutterAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  
  const device = useCameraDevice(cameraType);
  const { hasPermission, requestPermission } = useCameraPermission();

  // Pulse animation for capture button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Reset permission state when component mounts
  useEffect(() => {
    setPermissionChecked(false);
  }, []);

  const handleRequestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission Required',
            message: 'SafeReport needs access to your camera to document incidents for safety reporting.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Grant Permission',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionChecked(true);
        } else {
          Alert.alert(
            'Permission Denied',
            'Camera access is essential for incident reporting. You can enable it in settings.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      const permission = await requestPermission();
      setPermissionChecked(true);
    }
  };

  const shouldShowPermission = () => {
    return !permissionChecked;
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    
    // Shutter animation
    Animated.sequence([
      Animated.timing(shutterAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shutterAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: flashMode,
      });
      
      const uri = `file://${photo.path}`;
      const newPhotos = [...photos, { uri, id: Date.now().toString() }];
      setPhotos(newPhotos);
      updateIncidentData('photos', newPhotos);
      
      // Show success message
      Alert.alert('Success', `Photo ${photos.length + 1} captured successfully`, [
        { text: 'OK' }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
      console.error(error);
    } finally {
      setCapturing(false);
    }
  };

  const handleDeletePhoto = (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedPhotos = photos.filter(p => p.id !== photoId);
            setPhotos(updatedPhotos);
            updateIncidentData('photos', updatedPhotos);
          }
        }
      ]
    );
  };

  const handleConfirm = () => {
    if (photos.length > 0) {
      onNext();
    } else {
      Alert.alert(
        'No Photos',
        'Please take at least one photo before continuing.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleFlash = () => {
    const modes = ['off', 'on', 'auto'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
    
    // Flash animation
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleCamera = () => {
    setCameraType(prev => prev === 'back' ? 'front' : 'back');
  };

  const getFlashIcon = () => {
    switch(flashMode) {
      case 'on': return 'flash-on';
      case 'auto': return 'flash-auto';
      default: return 'flash-off';
    }
  };

  // Render photo thumbnail for gallery
  const renderPhotoThumbnail = ({ item }) => (
    <View style={styles.thumbnailContainer}>
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      <TouchableOpacity
        style={styles.deleteThumbnail}
        onPress={() => handleDeletePhoto(item.id)}
      >
        <LinearGradient
          colors={['#ff4444', '#cc0000']}
          style={styles.deleteThumbnailGradient}
        >
          <Icon name="close" size={16} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.photoNumberBadge}>
        <Text style={styles.photoNumberText}>{photos.indexOf(item) + 1}</Text>
      </View>
    </View>
  );

  // Permission Screen
  if (shouldShowPermission()) {
    return (
      <LinearGradient colors={['#f5f7fa', '#e8eaf6']} style={styles.container}>
        <StepHeader step={1} totalSteps={5} title="Camera Permission" onBack={onBack} />
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIconContainer}>
            <LinearGradient
              colors={['#030e8b', '#030e8b']}
              style={styles.permissionIcon}
            >
              <Icon name="photo-camera" size={48} color="#fff" />
            </LinearGradient>
          </View>
          
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            To document incidents effectively, we need access to your camera. 
            Your photos help create accurate safety reports.
          </Text>
          
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={handleRequestPermission}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#030e8b', '#030e8b']}
              style={styles.permissionButtonGradient}
            >
              <Icon name="lock-open" size={20} color="#fff" />
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.permissionLaterButton}
            onPress={onBack}
          >
            <Text style={styles.permissionLaterText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // No Permission Screen
  if (!hasPermission) {
    return (
      <LinearGradient colors={['#f5f7fa', '#e8eaf6']} style={styles.container}>
        <StepHeader step={1} totalSteps={5} title="Camera Permission" onBack={onBack} />
        <View style={styles.permissionContainer}>
          <View style={[styles.permissionIconContainer, styles.errorIconContainer]}>
            <LinearGradient
              colors={['#b71c1c', '#d32f2f']}
              style={styles.permissionIcon}
            >
              <Icon name="camera-off" size={48} color="#fff" />
            </LinearGradient>
          </View>
          
          <Text style={styles.permissionTitle}>Camera Access Denied</Text>
          <Text style={styles.permissionText}>
            Without camera access, you won't be able to attach photos to your incident reports. 
            You can enable it in your device settings.
          </Text>
          
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={() => setPermissionChecked(false)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#030e8b', '#030e8b']}
              style={styles.permissionButtonGradient}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.permissionButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // No Device Screen
  if (!device) {
    return (
      <LinearGradient colors={['#f5f7fa', '#e8eaf6']} style={styles.container}>
        <StepHeader step={1} totalSteps={5} title="Camera" onBack={onBack} />
        <View style={styles.permissionContainer}>
          <View style={[styles.permissionIconContainer, styles.errorIconContainer]}>
            <LinearGradient
              colors={['#b71c1c', '#d32f2f']}
              style={styles.permissionIcon}
            >
              <Icon name="error" size={48} color="#fff" />
            </LinearGradient>
          </View>
          
          <Text style={styles.permissionTitle}>No Camera Found</Text>
          <Text style={styles.permissionText}>
            We couldn't detect a camera on your device. Please check your device hardware.
          </Text>
          
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={onBack}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#030e8b', '#030e8b']}
              style={styles.permissionButtonGradient}
            >
              <Icon name="arrow-back" size={20} color="#fff" />
              <Text style={styles.permissionButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Camera Screen with Gallery
  return (
    <View style={styles.container}>
      <StepHeader 
        step={1} 
        totalSteps={5} 
        title={photos.length > 0 ? `Photos (${photos.length})` : "Take Photos"} 
        onBack={onBack} 
      />
      
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
          enableZoomGesture={true}
        />
        
        {/* Shutter animation overlay */}
        <Animated.View 
          style={[
            styles.shutterOverlay,
            {
              opacity: shutterAnim,
            }
          ]} 
        />
        
        {/* Camera Controls Overlay */}
        <View style={styles.cameraControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={toggleFlash}
            activeOpacity={0.7}
          >
            <Animated.View style={{
              transform: [{ scale: flashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2]
              }) }]
            }}>
              <Icon name={getFlashIcon()} size={24} color="#fff" />
            </Animated.View>
            <View style={styles.controlBadge}>
              <Text style={styles.controlBadgeText}>{flashMode.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={toggleCamera}
            activeOpacity={0.7}
          >
            <Icon name="flip-camera-ios" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.galleryButton]}
            onPress={() => setShowGallery(!showGallery)}
            activeOpacity={0.7}
          >
            <Icon name="photo-library" size={24} color="#fff" />
            {photos.length > 0 && (
              <View style={styles.galleryBadge}>
                <Text style={styles.galleryBadgeText}>{photos.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Focus Frame */}
        <View style={styles.focusFrame}>
          <View style={styles.focusCornerTL} />
          <View style={styles.focusCornerTR} />
          <View style={styles.focusCornerBL} />
          <View style={styles.focusCornerBR} />
        </View>
        
        {/* Camera Hint */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.cameraHintContainer}
        >
          <Text style={styles.cameraHint}>
            <Icon name="info" size={16} color="#fff" /> Take multiple photos from different angles
          </Text>
        </LinearGradient>
      </View>

      {/* Gallery Preview */}
      {showGallery && photos.length > 0 && (
        <View style={styles.galleryContainer}>
          <FlatList
            data={photos}
            renderItem={renderPhotoThumbnail}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryList}
          />
        </View>
      )}

      {/* Capture Button and Actions */}
      <View style={styles.bottomSection}>
        {photos.length > 0 && (
          <View style={styles.photoCounter}>
            <Icon name="photo-camera" size={20} color="#030e8b" />
            <Text style={styles.photoCounterText}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} captured
            </Text>
          </View>
        )}

        <View style={styles.captureRow}>
          <TouchableOpacity
            onPress={handleCapture}
            disabled={capturing}
            activeOpacity={0.8}
          >
            <Animated.View style={[
              styles.captureBtn,
              capturing && styles.capturing,
              { transform: [{ scale: pulseAnim }] }
            ]}>
              <LinearGradient
                colors={['#1a237e', '#283593']}
                style={styles.captureBtnGradient}
              >
                <View style={styles.captureBtnInner} />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
          
          <Text style={styles.captureHint}>
            {capturing ? 'Capturing...' : 'Tap to capture'}
          </Text>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.actionButton, styles.retakeButton]}
            activeOpacity={0.8}
          >
            <Icon name="arrow-back" size={24} color='#030e8b' />
            <Text style={styles.retakeButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.actionButton, styles.confirmButton]}
            activeOpacity={0.8}
            disabled={photos.length === 0}
          >
            <LinearGradient
              colors={photos.length > 0 ? ['#030e8b', '#030e8b'] : ['#cccccc', '#999999']}
              style={styles.confirmButtonGradient}
            >
              <Icon name="check" size={24} color="#fff" />
              <Text style={styles.confirmButtonText}>
                Continue ({photos.length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  // Permission Screen Styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionIconContainer: {
    marginBottom: 24,
  },
  errorIconContainer: {
    transform: [{ scale: 1.1 }],
  },
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  permissionButton: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#030e8b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  permissionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionLaterButton: {
    padding: 12,
  },
  permissionLaterText: {
    color: '#999',
    fontSize: 14,
  },
  // Camera Screen Styles
  cameraContainer: {
    flex: 1,
    margin: 16,
    marginBottom: 8,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#030e8b',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  camera: {
    flex: 1,
  },
  shutterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
  cameraControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  galleryButton: {
    position: 'relative',
  },
  galleryBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#030e8b',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  galleryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  controlBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#030e8b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  controlBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  focusFrame: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    right: '20%',
    bottom: '30%',
  },
  focusCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#fff',
    borderTopLeftRadius: 12,
  },
  focusCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fff',
    borderTopRightRadius: 12,
  },
  focusCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#fff',
    borderBottomLeftRadius: 12,
  },
  focusCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fff',
    borderBottomRightRadius: 12,
  },
  cameraHintContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cameraHint: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Gallery Styles
  galleryContainer: {
    maxHeight: 100,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  galleryList: {
    paddingHorizontal: 4,
  },
  thumbnailContainer: {
    marginHorizontal: 4,
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#030e8b',
  },
  deleteThumbnail: {
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 1,
  },
  deleteThumbnailGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoNumberBadge: {
    position: 'absolute',
    bottom: -5,
    left: -5,
    backgroundColor: '#030e8b',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Bottom Section Styles
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  photoCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  photoCounterText: {
    fontSize: 14,
    color: '#030e8b',
    fontWeight: '600',
  },
  captureRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 8,
    shadowColor: '#030e8b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  captureBtnGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#030e8b',
  },
  capturing: {
    opacity: 0.7,
  },
  captureHint: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retakeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#030e8b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retakeButtonText: {
    color: '#030e8b',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    borderWidth: 0,
  },
  confirmButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraScreen;