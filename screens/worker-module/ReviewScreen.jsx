import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Animated,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions, // Add this import
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StepHeader from './components/StepHeader';
import PrimaryButton from './components/PrimaryButton';
import { useIncident } from './context/IncidentContext';

const { width, height } = Dimensions.get('window'); // Add this line

const severityConfig = {
  low: { color: '#4CAF50', label: 'Low', icon: 'check-circle', bgColor: 'rgba(76, 175, 80, 0.1)' },
  medium: { color: '#FF9800', label: 'Medium', icon: 'warning', bgColor: 'rgba(255, 152, 0, 0.1)' },
  high: { color: '#F44336', label: 'High', icon: 'error', bgColor: 'rgba(244, 67, 54, 0.1)' },
};

const ReviewScreen = ({ onNext, onBack }) => {
  const { incidentData } = useIncident();
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Debug log to check what photos are available
  useEffect(() => {
    console.log('Incident Data:', incidentData);
    console.log('Photos:', incidentData.photos);
    console.log('Single Photo:', incidentData.photo);
  }, []);

  const sevConfig = incidentData.severity ? severityConfig[incidentData.severity] : null;
  
  const locationText = incidentData.location
    ? `${incidentData.location.latitude.toFixed(5)}, ${incidentData.location.longitude.toFixed(5)}`
    : incidentData.manualLocation || 'Not specified';

  // Get photos array (support both single photo and multiple photos)
  const photos = incidentData.photos || (incidentData.photo ? [{ uri: incidentData.photo, id: '1' }] : []);
  const hasPhotos = photos.length > 0;

  console.log('Processed Photos:', photos); // Debug log

  // Get body parts
  const bodyParts = incidentData.bodyParts || [];
  const hasBodyParts = bodyParts.length > 0;
  const bodyPartsCount = incidentData.bodyPartsCount || bodyParts.length;

  // Separate front and back body parts
  const frontParts = [];
  const backParts = [];

  bodyParts.forEach(part => {
    if (part.toLowerCase().includes('back') || 
        part.toLowerCase().includes('glute') || 
        part.toLowerCase().includes('hamstring') ||
        part.toLowerCase().includes('calf') ||
        part.toLowerCase().includes('heel')) {
      backParts.push(part);
    } else {
      frontParts.push(part);
    }
  });

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const report = {
        id,
        ...incidentData,
        submittedAt: new Date().toISOString(),
      };

      const existing = await AsyncStorage.getItem('incident_reports');
      const reports = existing ? JSON.parse(existing) : [];
      reports.push(report);
      await AsyncStorage.setItem('incident_reports', JSON.stringify(reports));

      // Success animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          onNext();
        }, 500);
      });
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Error', 'Failed to submit report');
      setSubmitting(false);
    }
  };

  const openImageModal = (uri) => {
    setSelectedImage(uri);
    setModalVisible(true);
  };

  const renderPhotoThumbnail = ({ item, index }) => (
    <TouchableOpacity
      style={styles.photoThumbnail}
      onPress={() => openImageModal(item.uri)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item.uri }} 
        style={styles.thumbnailImage} 
        onError={(error) => console.log('Image loading error:', error.nativeEvent.error)}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.photoOverlay}
      >
        <View style={styles.photoNumber}>
          <Text style={styles.photoNumberText}>{index + 1}</Text>
        </View>
        <Icon name="zoom-in" size={16} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderBodyParts = () => {
    if (hasBodyParts) {
      return (
        <View style={styles.bodyPartsContainer}>
          {/* Front View Section */}
          {frontParts.length > 0 && (
            <View style={styles.viewSection}>
              <LinearGradient
                colors={['rgba(26, 35, 126, 0.05)', 'transparent']}
                style={styles.viewGradient}
              >
                <View style={styles.viewHeader}>
                  <View style={[styles.viewIcon, { backgroundColor: '#030e8b'}]}>
                    <Icon name="arrow-forward" size={14} color="#fff" />
                  </View>
                  <Text style={styles.viewTitle}>Front View</Text>
                  <View style={styles.viewCount}>
                    <Text style={styles.viewCountText}>{frontParts.length}</Text>
                  </View>
                </View>
                <View style={styles.partsGrid}>
                  {frontParts.map((part, index) => (
                    <View key={`front-${index}`} style={styles.bodyPartItem}>
                      <View style={styles.bodyPartBullet} />
                      <Text style={styles.bodyPartText}>{part}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Back View Section */}
          {backParts.length > 0 && (
            <View style={styles.viewSection}>
              <LinearGradient
                colors={['rgba(26, 35, 126, 0.05)', 'transparent']}
                style={styles.viewGradient}
              >
                <View style={styles.viewHeader}>
                  <View style={[styles.viewIcon, { backgroundColor: '#030e8b' }]}>
                    <Icon name="arrow-back" size={14} color="#fff" />
                  </View>
                  <Text style={styles.viewTitle}>Back View</Text>
                  <View style={styles.viewCount}>
                    <Text style={styles.viewCountText}>{backParts.length}</Text>
                  </View>
                </View>
                <View style={styles.partsGrid}>
                  {backParts.map((part, index) => (
                    <View key={`back-${index}`} style={styles.bodyPartItem}>
                      <View style={styles.bodyPartBullet} />
                      <Text style={styles.bodyPartText}>{part}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </View>
          )}
        </View>
      );
    } else if (incidentData.bodyPart) {
      return (
        <View style={styles.singleBodyPart}>
          <LinearGradient
            colors={['#030e8b', '#030e8b']}
            style={styles.singleBodyPartIcon}
          >
            <Icon name="person" size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.singleBodyPartInfo}>
            <Text style={styles.singleBodyPartText}>{incidentData.bodyPart}</Text>
            {incidentData.bodyView && (
              <View style={styles.singleBodyPartBadge}>
                <Text style={styles.singleBodyPartBadgeText}>{incidentData.bodyView} view</Text>
              </View>
            )}
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyState}>
          <Icon name="info" size={20} color="#999" />
          <Text style={styles.emptyStateText}>Not specified</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StepHeader step={5} totalSteps={5} title="Review Report" onBack={onBack} />

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}>
          {/* Photos Card - Updated for multiple photos */}
          {hasPhotos && (
            <LinearGradient
              colors={['#ffffff', '#f8f9ff']}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardIcon, { backgroundColor: '#030e8b' }]}>
                    <Icon name="photo-camera" size={18} color="#fff" />
                  </View>
                  <Text style={styles.cardTitle}>
                    Incident Photos {photos.length > 0 && `(${photos.length})`}
                  </Text>
                </View>
                <View style={styles.photoBadge}>
                  <Icon name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.photoBadgeText}>
                    {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                  </Text>
                </View>
              </View>
              
              {photos.length > 0 ? (
                <FlatList
                  data={photos}
                  renderItem={renderPhotoThumbnail}
                  keyExtractor={(item, index) => item.id || index.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosList}
                />
              ) : (
                <View style={styles.noPhotosContainer}>
                  <Icon name="photo" size={40} color="#ccc" />
                  <Text style={styles.noPhotosText}>No photos available</Text>
                </View>
              )}
              
              <Text style={styles.photoHint}>Tap any photo to enlarge</Text>
            </LinearGradient>
          )}

          {/* Location Card */}
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIcon, { backgroundColor: '#030e8b'}]}>
                  <Icon name="location-on" size={18} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>Location</Text>
              </View>
            </View>
            
            <View style={styles.locationContainer}>
              <View style={styles.locationIcon}>
                <Icon name="place" size={20} color='#030e8b' />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>{locationText}</Text>
                {incidentData.location && (
                  <View style={styles.coordContainer}>
                    <Icon name="gps-fixed" size={12} color="#999" />
                    <Text style={styles.coordText}>
                      {incidentData.location.latitude.toFixed(6)}, {incidentData.location.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>

          {/* Body Parts Card */}
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIcon, { backgroundColor: '#030e8b' }]}>
                  <Icon name="accessibility" size={18} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>
                  Injury Location {hasBodyParts ? `(${bodyPartsCount})` : ''}
                </Text>
              </View>
              {hasBodyParts && (
                <View style={styles.bodyPartsTotal}>
                  <Text style={styles.bodyPartsTotalText}>{bodyPartsCount} areas</Text>
                </View>
              )}
            </View>
            
            {renderBodyParts()}
          </LinearGradient>

          {/* Details Card */}
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIcon, { backgroundColor: '#030e8b' }]}>
                  <Icon name="info" size={18} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>Incident Details</Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              {/* Incident Type */}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Type</Text>
                <View style={styles.detailValueContainer}>
                  <Icon name="category" size={14} color="#666" />
                  <Text style={styles.detailValue}>
                    {incidentData.incidentType || 'Not specified'}
                  </Text>
                </View>
              </View>

              {/* Severity */}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Severity</Text>
                {sevConfig ? (
                  <View style={[styles.severityBadge, { backgroundColor: sevConfig.bgColor }]}>
                    <Icon name={sevConfig.icon} size={14} color={sevConfig.color} />
                    <Text style={[styles.severityText, { color: sevConfig.color }]}>
                      {sevConfig.label}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.detailValue}>Not specified</Text>
                )}
              </View>

              {/* Description */}
              {incidentData.description && (
                <View style={[styles.detailItem, styles.descriptionItem]}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionText}>{incidentData.description}</Text>
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Report Summary Footer */}
          <LinearGradient
            colors={['rgba(26, 35, 126, 0.05)', 'rgba(40, 53, 147, 0.02)']}
            style={styles.summaryFooter}
          >
            <Icon name="assignment-turned-in" size={20} color='#030e8b' />
            <Text style={styles.summaryText}>Please review all details before submitting</Text>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
              style={styles.modalCloseGradient}
            >
              <Icon name="close" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
          
          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterText}>
              Swipe down or tap close to exit
            </Text>
          </View>
        </View>
      </Modal>

      {/* Footer with Submit Button */}
      <View style={styles.footer}>
        <PrimaryButton
          label={submitting ? "Submitting..." : "Submit Incident Report"}
          onPress={handleSubmit}
          loading={submitting}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  content: {
    gap: 12,
  },
  // Card Styles
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#333',
  },
  // Photos Styles
  photosList: {
    paddingVertical: 8,
    gap: 12,
  },
  photoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  photoNumber: {
    backgroundColor: '#030e8b',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  photoNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  photoHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  photoBadgeText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
  },
  noPhotosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
  },
  noPhotosText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  // Location Styles
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#030e8b',
    marginBottom: 4,
  },
  coordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordText: {
    fontSize: 12,
    color: '#999',
  },
  // Body Parts Styles
  bodyPartsContainer: {
    marginTop: 4,
  },
  viewSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  viewGradient: {
    padding: 12,
  },
  viewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  viewIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  viewTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  viewCount: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  viewCountText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bodyPartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bodyPartBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#030e8b',
    marginRight: 6,
  },
  bodyPartText: {
    fontSize: 13,
    color: '#333',
  },
  bodyPartsTotal: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bodyPartsTotalText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  singleBodyPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  singleBodyPartIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleBodyPartInfo: {
    flex: 1,
  },
  singleBodyPartText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#030e8b',
    marginBottom: 4,
  },
  singleBodyPartBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  singleBodyPartBadgeText: {
    fontSize: 10,
    color: '#666',
    textTransform: 'capitalize',
  },
  // Details Styles
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    gap: 6,
  },
  descriptionItem: {
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f8f9ff',
    padding: 12,
    borderRadius: 12,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // Empty State
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#999',
    fontStyle: 'italic',
  },
  // Summary Footer
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  summaryText: {
    fontSize: 13,
    color: '#030e8b',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    backgroundColor: '#f5f7fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  modalCloseGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalImage: {
    width: width,
    height: height * 0.8,
  },
  modalFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modalFooterText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});

export default ReviewScreen;