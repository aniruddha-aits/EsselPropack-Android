// src/screens/LandingPage.jsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './worker-module/context/AuthContext';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

// All modules with their required permissions
const safetyPortalModules = [
  {
    id: 1,
    title: 'Permit to Work (PTW)',
    icon: 'file-signature',
    route: 'PermitToWork',
    color: '#1976D2',
    bgColor: 'rgba(25, 118, 210, 0.08)',
    permission: 'ptw',
  },
  {
    id: 2,
    title: 'Safety Dashboard',
    icon: 'chart-pie',
    route: 'SafetyDashboard',
    color: '#6A1B9A',
    bgColor: 'rgba(106, 27, 154, 0.08)',
    permission: 'dashboard',
  },
  {
    id: 3,
    title: 'Incident Management',
    icon: 'first-aid',
    route: 'IncidentManagement',
    color: '#D32F2F',
    bgColor: 'rgba(211, 47, 47, 0.08)',
    permission: 'incident',
  },
  {
    id: 4,
    title: 'Chemical Safety',
    icon: 'flask',
    route: 'ChemicalSafety',
    color: '#de5708',
    bgColor: 'rgba(222, 87, 8, 0.08)',
    permission: 'chemical',
  },
  {
    id: 5,
    title: 'Audit & Inspection',
    icon: 'clipboard-check',
    route: 'AuditAndInspection',
    color: '#455A64',
    bgColor: 'rgba(69, 90, 100, 0.08)',
    permission: 'audit',
  },
  {
    id: 6,
    title: 'CAPA',
    icon: 'check-circle',
    route: 'CapaScreen',
    color: '#00796B',
    bgColor: 'rgba(0, 121, 107, 0.08)',
    permission: 'capa',
  },
  {
    id: 7,
    title: 'Safety Training',
    icon: 'graduation-cap',
    route: 'SafetyTraining',
    color: '#FFC107',
    bgColor: 'rgba(255, 193, 7, 0.08)',
    permission: 'training',
  },
  {
    id: 8,
    title: 'Reports',
    icon: 'file-alt',
    route: 'Reports',
    color: '#E64A19',
    bgColor: 'rgba(230, 74, 25, 0.08)',
    permission: 'report',
  },
];

// Safety Module Screen - This is what opens when you click "Safety Portal" on the landing page
export const SafetyModuleScreen = ({ route }) => {
  const navigation = useNavigation();
  const { hasPermission } = useAuth();
  
  const moduleName = route?.params?.module || 'Safety Portal';

  // Filter modules based on user permissions
  const accessibleModules = safetyPortalModules.filter(module => 
    hasPermission(module.permission)
  );

  const handleCardPress = (routeName) => {
    console.log('Navigating to:', routeName);
    navigation.navigate(routeName);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.moduleCard, { backgroundColor: item.bgColor }]}
      onPress={() => handleCardPress(item.route)}
      activeOpacity={0.7}
    >
      <View style={[styles.moduleIconBox, { backgroundColor: item.bgColor }]}>
        <Icon name={item.icon} size={isSmallScreen ? 24 : 28} color={item.color} />
      </View>
      <Text style={styles.moduleTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#ecedf3" />
        </TouchableOpacity>
        <Text style={styles.navbarTitle}>{moduleName}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.modulesScrollContent}
      >
        {accessibleModules.length > 0 ? (
          <View style={styles.modulesGrid}>
            {accessibleModules.map((item) => renderCard(item))}
          </View>
        ) : (
          <View style={styles.noAccessContainer}>
            <Icon name="lock" size={50} color="#ccc" />
            <Text style={styles.noAccessText}>You don't have access to any modules</Text>
            <Text style={styles.noAccessSubtext}>Please contact your administrator</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Main Landing Page - Safety Portal card at top left below navbar
const LandingPage = () => {
  const navigation = useNavigation();

  const handleSafetyPortalPress = () => {
    navigation.navigate('SafetyModule', { module: 'Safety Portal' });
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.landingScrollContent}
      >
        {/* Safety Portal Card - Aligned to top left */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.moduleCard, styles.mainModuleCard]}
            onPress={handleSafetyPortalPress}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconBox, styles.mainModuleIcon]}>
              <Icon name="shield-alt" size={32} color="#2E7D32" />
            </View>
            <Text style={[styles.moduleTitle, styles.mainModuleTitle]}>Safety Portal</Text>
            <Text style={styles.mainModuleSubtitle}>Access all safety modules</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 20 : 12,
    backgroundColor: '#031071',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ecedf3',
  },
  placeholder: {
    width: 40,
  },
  landingScrollContent: {
    padding: 20,
    paddingTop: 20,
  },
  modulesScrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },

  // Updated modules grid for perfect 2-column layout
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 1,
    marginVertical:5, // Compensate for card padding
  },
  moduleCard: {
    width: '48%', // Slightly less than 50% to account for margin
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 16,
    marginHorizontal: '0%', // Add small horizontal margin
  },
  mainModuleCard: {
    backgroundColor: 'rgba(3, 126, 10, 0.09)', // Light green background
    width: '50%',
    maxWidth: 300,
    height:160,
    alignSelf: 'flex-start',
    marginHorizontal: 0, // Reset margin for main card
  },
  moduleIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainModuleIcon: {
    backgroundColor: 'rgba(3, 126, 10, 0.15)',
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
    textAlign: 'center',
    lineHeight: 20,
  },
  mainModuleTitle: {
    color: '#1a237e',
    fontSize: 18,
    marginBottom: 8,
  },
  mainModuleSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  noAccessSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default LandingPage;