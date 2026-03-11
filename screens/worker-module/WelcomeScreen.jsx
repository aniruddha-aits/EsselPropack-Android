// src/screens/worker-module/WelcomeScreen.jsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  SafeAreaView,
  Easing,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ onStart, onLogout, userData }) => {
  // Debug logs
  console.log('🟡 WelcomeScreen - Props received:', { 
    onStart: !!onStart, 
    onLogout, 
    onLogoutType: typeof onLogout,
    userData 
  });
  
  const navigation = useNavigation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const menuAnim = useRef(new Animated.Value(-width)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  
  // Step animations
  const stepAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  
  // SOS button animations
  const sosScaleAnim = useRef(new Animated.Value(1)).current;
  const sosPulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // State
  const [menuVisible, setMenuVisible] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Step animations
    Animated.stagger(150, stepAnims.map(anim => 
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      })
    )).start();

    // SOS animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(sosScaleAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sosScaleAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(sosPulseAnim, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sosPulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

  }, []);

  // Menu animation with spring
  useEffect(() => {
    Animated.spring(menuAnim, {
      toValue: menuVisible ? 0 : -width,
      tension: 50,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [menuVisible]);

  const handleSOS = () => {
    Alert.alert(
      '🚨 EMERGENCY SOS',
      'This will immediately notify your emergency contacts and safety team. Continue?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
        },
        { 
          text: 'ACTIVATE SOS', 
          onPress: () => {
            Alert.alert(
              'SOS Activated',
              'Emergency services have been notified. Help is on the way.',
              [{ text: 'OK' }]
            );
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleLogout = () => {
    console.log('🔴 Logout button pressed');
    console.log('🔴 onLogout function:', onLogout);
    console.log('🔴 onLogout type:', typeof onLogout);
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            setMenuVisible(false);
            // Check if onLogout is a function before calling
            if (typeof onLogout === 'function') {
              console.log('✅ Calling onLogout function');
              onLogout();
            } else {
              console.error('❌ onLogout is not a function:', onLogout);
              Alert.alert(
                'Error', 
                'Logout function not available. Please restart the app.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleSafetyTraining = () => {
    setMenuVisible(false);
    
    // Since workers have a different navigation flow, we need to handle this differently
    // Option 1: Navigate to SafetyTraining if it's in the worker's stack
    try {
      navigation.navigate('SafetyTraining');
    } catch (error) {
      console.log('SafetyTraining not in current stack, showing alert instead');
      Alert.alert(
        'Safety Training',
        'Training modules will be available soon.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMyProfile = () => {
    setMenuVisible(false);
    Alert.alert('Profile', 'Profile screen coming soon');
  };

  const MenuItem = ({ icon, label, onPress, isLogout }) => (
    <TouchableOpacity 
      style={[styles.menuItem, isLogout && styles.logoutMenuItem]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, isLogout && styles.logoutIconContainer]}>
        <Icon name={icon} size={24} color={isLogout ? '#ff4757' : '#1a237e'} />
      </View>
      <Text style={[styles.menuItemText, isLogout && styles.logoutText]}>{label}</Text>
      {!isLogout && <Icon name="chevron-right" size={20} color="#ccc" />}
    </TouchableOpacity>
  );

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />

      {/* Side Menu */}
      <Animated.View style={[styles.menuContainer, { transform: [{ translateX: menuAnim }] }]}>
        <LinearGradient
          colors={['#ffffff', '#f8f9ff']}
          style={styles.menuGradient}
        >
          <View style={styles.menuHeader}>
            <View style={styles.menuProfile}>
              <LinearGradient
                colors={['#030e8b', '#030e8b']}
                style={styles.menuAvatar}
              >
                <Text style={styles.menuAvatarText}>
                  {userData?.name?.charAt(0) || 'W'}
                </Text>
              </LinearGradient>
              <View style={styles.menuProfileInfo}>
                <Text style={styles.menuProfileName}>
                  {userData?.name || 'Worker User'}
                </Text>
                <Text style={styles.menuProfileEmail}>
                  {userData?.email || 'worker@essel.com'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.closeMenu}
              onPress={() => setMenuVisible(false)}
              activeOpacity={0.7}
            >
              <Icon name="close" size={24} color="#1a237e" />
            </TouchableOpacity>
          </View>

          {userData?.role && (
            <View style={styles.roleBadge}>
              <Icon name="verified" size={16} color="#4caf50" />
              <Text style={styles.roleText}>
                {userData.role.toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.menuDivider} />

          <View style={styles.menuItems}>
            <MenuItem 
              icon="person" 
              label="My Profile" 
              onPress={handleMyProfile}
            />
            <MenuItem 
              icon="school" 
              label="Safety Training" 
              onPress={handleSafetyTraining}
            />
            <MenuItem 
              icon="exit-to-app" 
              label="Logout" 
              isLogout={true}
              onPress={handleLogout}
            />
          </View>

          <View style={styles.menuFooter}>
            <Text style={styles.menuFooterText}>Version 1.0.0</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Main Content */}
      <Animated.View style={[
        styles.mainContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }]
        }
      ]}>
        {/* Header */}
        <LinearGradient
          colors={['#030e8b', '#030e8b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Animated.View style={{
            transform: [{
              scale: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              })
            }]
          }}>
            <TouchableOpacity 
              style={styles.hamburger}
              onPress={() => setMenuVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.hamburgerLine, styles.hamburgerLine1]} />
              <View style={[styles.hamburgerLine, styles.hamburgerLine2]} />
              <View style={[styles.hamburgerLine, styles.hamburgerLine3]} />
            </TouchableOpacity>
          </Animated.View>
          
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="warning" size={28} color="#fff" />
            </View>
            <Text style={styles.appName}>SafeReport</Text>
          </View>
          
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{userData?.name || 'Worker'}</Text>
            <Text style={styles.welcomeSubtitle}>
              Ready to ensure workplace safety?
            </Text>
          </View>

          {/* SOS Emergency Button */}
          <View style={styles.sosContainer}>
            <Animated.View style={[
              styles.sosOuterRing,
              {
                transform: [{ scale: sosPulseAnim }],
                opacity: sosPulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.5, 0],
                })
              }
            ]} />
            <Animated.View style={[
              styles.sosButtonWrapper,
              {
                transform: [
                  { scale: sosScaleAnim },
                  { rotate: rotate }
                ]
              }
            ]}>
              <TouchableOpacity
                onPress={handleSOS}
                activeOpacity={0.9}
                style={styles.sosButton}
              >
                <LinearGradient
                  colors={['#ff5252', '#ff1744', '#d50000']}
                  style={styles.sosGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="warning" size={32} color="#fff" />
                  <Text style={styles.sosText}>SOS</Text>
                  <Text style={styles.sosSubtext}>Emergency</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Steps Section */}
          <View style={styles.stepsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Report Steps</Text>
            </View>

            <View style={styles.stepsContainer}>
              {[
                { icon: 'photo-camera', label: 'Photo', color: '#051485', desc: 'Capture evidence' },
                { icon: 'location-on', label: 'Location', color: '#051485', desc: 'Pin incident spot' },
                { icon: 'person', label: 'Injury', color:'#051485', desc: 'Assess severity' },
                { icon: 'description', label: 'Details', color: '#051485', desc: 'Add description' },
                { icon: 'check-circle', label: 'Submit', color: '#051485', desc: 'Final review' },
              ].map((item, i) => {
                const translateY = stepAnims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                });
                
                const opacity = stepAnims[i];
                const scale = stepAnims[i];

                return (
                  <Animated.View 
                    key={i} 
                    style={[
                      styles.stepItem,
                      {
                        opacity,
                        transform: [
                          { translateY },
                          { scale }
                        ]
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={[item.color, item.color + 'dd']}
                      style={styles.stepIcon}
                    >
                      <Icon name={item.icon} size={22} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.stepLabel}>{item.label}</Text>
                    <Text style={styles.stepDesc}>{item.desc}</Text>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Start Report Button */}
        <Animated.View style={[
          styles.footer,
          {
            transform: [{
              translateY: slideUpAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 100],
              })
            }]
          }
        ]}>
          <TouchableOpacity
            onPress={onStart}
            activeOpacity={0.9}
            style={styles.startButtonWrapper}
          >
            <LinearGradient
              colors={['#030e8b', '#030e8b', '#030e8b']}
              style={styles.startButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="add-circle" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Start New Report</Text>
              <Icon name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Overlay */}
      {menuVisible && (
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={0.5}
          onPress={() => setMenuVisible(false)}
        />
      )}
    </SafeAreaView>
  );
};

// Keep all your existing styles here
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 30 : 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#030b67',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  hamburger: {
    padding: 8,
    borderRadius: 12,
  },
  hamburgerLine: {
    width: 22,
    height: 2,
    backgroundColor: '#fff',
    marginVertical: 3,
    borderRadius: 2,
  },
  hamburgerLine1: {
    width: 16,
  },
  hamburgerLine2: {
    width: 22,
  },
  hamburgerLine3: {
    width: 18,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  sosOuterRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ff5252',
  },
  sosButtonWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#ff1744',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  sosButton: {
    width: '100%',
    height: '100%',
  },
  sosGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1,
  },
  sosSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  stepsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  stepItem: {
    alignItems: 'center',
    width: '18%',
    marginBottom: 15,
  },
  stepIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'transparent',
  },
  startButtonWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#010a66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 25,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.75,
    zIndex: 1000,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  menuGradient: {
    flex: 1,
    padding: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  menuProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuProfileInfo: {
    flex: 1,
  },
  menuProfileName: {
    color: '#1a237e',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuProfileEmail: {
    color: '#666',
    fontSize: 12,
  },
  closeMenu: {
    padding: 5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  roleText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 15,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 5,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  logoutIconContainer: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutMenuItem: {
    marginTop: 10,
  },
  logoutText: {
    color: '#ff4757',
  },
  menuFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  menuFooterText: {
    fontSize: 12,
    color: '#ccc',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
});

export default WelcomeScreen;