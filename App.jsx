// src/App.jsx - Update the SafetyModuleScreen wrapper
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from '../EsselPropack/screens/worker-module/context/AuthContext';
import { ROLES } from './screens/constants/roles';

// Import screens
import LoginScreen from './screens/LoginScreen';
import Navbar from './screens/Navbar';
import LandingPage, { SafetyModuleScreen } from './screens/LandingPage';
import PermitToWork from './screens/PermitToWork';
import ChemicalSafetyScreen from './screens/ChemicalSafetyScreen';
import SafetyDashboard from "./screens/SafetyDashboard";
import CapaScreen from "./screens/CapaScreen";
import IncidentAndInjuryScreen from "./screens/IncidentAndInjuryScreen";
import AuditAndInspectionScreen from "./screens/AuditAndInspectionScreen";
import SafetyTrainingScreen from "./screens/SafetyTrainingScreen";
import SafetyReportsScreen from "./screens/SafetyReportsScreen";
import IncidentReportScreen from './screens/worker-module/IncidentReportScreen';

const Stack = createNativeStackNavigator();

// Main App Content with Auth
// src/App.jsx - Focus on the WorkerModuleEntry section

// In your App.jsx, find where you create the wrapped screens and update the WorkerModuleEntry:

const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = React.useState('');

  React.useEffect(() => {
    console.log('🔄 AppContent - User state changed:', user);
    console.log('🔄 AppContent - User role:', user?.role);
    console.log('🔄 AppContent - logout function exists:', !!logout);
  }, [user, logout]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#013271" />
      </View>
    );
  }

  // Custom wrapper to conditionally show navbar based on route
  const AppContentWrapper = ({ children, routeName }) => {
    const hideNavbarRoutes = ['SafetyModule', 'PermitToWork', 'SafetyDashboard', 
      'ChemicalSafety', 'CapaScreen', 'AuditAndInspection', 'SafetyTraining', 
      'Reports', 'IncidentManagement', 'WorkerModule'];
    
    const showNavbar = user && !hideNavbarRoutes.includes(routeName);
    
    console.log(`📍 Route: ${routeName}, Show Navbar: ${showNavbar}`);

    return (
      <View style={styles.appContainer}>
        {showNavbar && <Navbar onLogout={logout} userData={user} />}
        <View style={styles.mainContent}>
          {children}
        </View>
      </View>
    );
  };

  const createScreen = (ScreenComponent) => {
    return ({ navigation, route }) => {
      const routeName = route?.name || '';
      
      console.log(`📱 Rendering screen: ${routeName}`);
      console.log(`📱 User from context:`, user);
      console.log(`📱 logout function available:`, !!logout);
      
      const userDataToPass = user ? {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        email: user.email,
        department: user.department,
        company: user.company
      } : null;
      
      return (
        <AppContentWrapper routeName={routeName}>
          <ScreenComponent 
            {...route?.params} 
            navigation={navigation}
            route={route}
            userData={userDataToPass}
            onLogout={logout} // 👈 THIS IS CRITICAL - Pass logout directly
          />
        </AppContentWrapper>
      );
    };
  };

  // Create wrapped screens
  const WrappedLandingPage = createScreen(LandingPage);
  const WrappedSafetyModuleScreen = createScreen(SafetyModuleScreen);
  const WrappedPermitToWork = createScreen(PermitToWork);
  const WrappedSafetyDashboard = createScreen(SafetyDashboard);
  const WrappedChemicalSafety = createScreen(ChemicalSafetyScreen);
  const WrappedCapaScreen = createScreen(CapaScreen);
  const WrappedAuditAndInspection = createScreen(AuditAndInspectionScreen);
  const WrappedSafetyTraining = createScreen(SafetyTrainingScreen);
  const WrappedReports = createScreen(SafetyReportsScreen);
  const WrappedIncidentManagement = createScreen(IncidentAndInjuryScreen);
  
  // CRITICAL: Create a separate wrapper for Worker module to ensure onLogout is passed
// In App.jsx, update the WorkerModuleWrapper to include a nested navigator
const WorkerModuleWrapper = ({ navigation, route }) => {
  console.log('👷 WorkerModuleWrapper - logout function:', !!logout);
  
  // Create a nested stack for worker screens
  const WorkerStack = createNativeStackNavigator();
  
  return (
    <AppContentWrapper routeName="WorkerModule">
      <WorkerStack.Navigator screenOptions={{ headerShown: false }}>
        <WorkerStack.Screen name="Welcome">
          {props => <IncidentReportScreen {...props} userData={user} onLogout={logout} />}
        </WorkerStack.Screen>
        <WorkerStack.Screen name="SafetyTraining" component={SafetyTrainingScreen} />
      </WorkerStack.Navigator>
    </AppContentWrapper>
  );
};

  return (
    <NavigationContainer>
      {!user ? (
        <View style={styles.appContainer}>
          <LoginScreen />
        </View>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* For workers - go directly to incident reporting */}
          {user.role === ROLES.WORKER ? (
            <Stack.Screen 
              name="WorkerModule" 
              component={WorkerModuleWrapper} // Use the specific wrapper
            />
          ) : (
            /* For all other roles - first screen is Landing Page */
            <>
              <Stack.Screen name="LandingPage" component={WrappedLandingPage} />
              <Stack.Screen name="SafetyModule" component={WrappedSafetyModuleScreen} />
            </>
          )}
          
          {/* All other screens - accessible from Safety Module */}
          {user.role !== ROLES.WORKER && (
            <>
              <Stack.Screen name="PermitToWork" component={WrappedPermitToWork} />
              <Stack.Screen name="SafetyDashboard" component={WrappedSafetyDashboard} />
              <Stack.Screen name="ChemicalSafety" component={WrappedChemicalSafety} />
              <Stack.Screen name="CapaScreen" component={WrappedCapaScreen} />
              <Stack.Screen name="AuditAndInspection" component={WrappedAuditAndInspection} />
              <Stack.Screen name="SafetyTraining" component={WrappedSafetyTraining} />
              <Stack.Screen name="Reports" component={WrappedReports} />
              <Stack.Screen name="IncidentManagement" component={WrappedIncidentManagement} />
            </>
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider style={styles.safeArea}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  appContainer: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
});

export default App; 