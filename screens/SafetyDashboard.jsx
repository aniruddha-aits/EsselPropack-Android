import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;

// Lazy load heavy chart components
const BarChart = lazy(() => import('react-native-chart-kit').then(module => ({ default: module.BarChart })));
const PieChart = lazy(() => import('react-native-chart-kit').then(module => ({ default: module.PieChart })));
const LineChart = lazy(() => import('react-native-chart-kit').then(module => ({ default: module.LineChart })));

// Loading component for charts
const ChartLoader = () => (
  <View style={styles.chartLoader}>
    <ActivityIndicator size="small" color="#11269C" />
  </View>
);

const SafetyDashboard = () => {
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState('');
  const [chartsReady, setChartsReady] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    ptw: true,
    chemical: true,
    training: true,
    incident: true,
  });
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Get current date on component mount
  useEffect(() => {
    const date = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options).toUpperCase().replace(',', '');
    setCurrentDate(formattedDate);
    
    // Mark charts as ready after a tiny delay to ensure UI renders first
    setTimeout(() => setChartsReady(true), 100);
  }, []);

  // ========== DATA STRUCTURES (Enhanced from web version) ==========
  const ptwData = {
    total: 24,
    active: 8,
    pending: 6,
    completed: 7,
    cancelled: 3,
    work_types: {
      "Hot Work": 5,
      "Height Work": 4,
      Electrical: 6,
      "Confined Space": 3,
      "Hazardous Material": 2,
      Others: 4,
    },
    departments: {
      Maintenance: 8,
      Electrical: 6,
      Civil: 4,
      Process: 3,
      Facilities: 3,
    },
    locations: {
      "Main Plant - Building A": {
        total: 8,
        active: 3,
        pending: 2,
        completed: 2,
        cancelled: 1,
        peopleCount: 45,
        supervisor: "John Smith",
        workTypes: {
          "Hot Work": 2,
          "Electrical": 3,
          "Height Work": 2,
          "Others": 1
        }
      },
      "Warehouse - Section B": {
        total: 6,
        active: 2,
        pending: 1,
        completed: 2,
        cancelled: 1,
        peopleCount: 28,
        supervisor: "Sarah Johnson",
        workTypes: {
          "Height Work": 2,
          "Confined Space": 1,
          "Electrical": 2,
          "Others": 1
        }
      },
      "Administrative Block": {
        total: 3,
        active: 1,
        pending: 1,
        completed: 1,
        cancelled: 0,
        peopleCount: 15,
        supervisor: "Mike Wilson",
        workTypes: {
          "Electrical": 1,
          "Others": 2
        }
      },
      "Production Line 2": {
        total: 4,
        active: 1,
        pending: 1,
        completed: 1,
        cancelled: 1,
        peopleCount: 32,
        supervisor: "Emily Davis",
        workTypes: {
          "Hot Work": 2,
          "Hazardous Material": 1,
          "Others": 1
        }
      },
      "Maintenance Workshop": {
        total: 3,
        active: 1,
        pending: 1,
        completed: 1,
        cancelled: 0,
        peopleCount: 18,
        supervisor: "Robert Brown",
        workTypes: {
          "Confined Space": 2,
          "Others": 1
        }
      }
    },
  };

  const incidentData = {
    total: 18,
    open: 5,
    investigating: 4,
    closed: 9,
    severity: {
      Critical: 2,
      Major: 5,
      Minor: 8,
      "Near Miss": 3,
    },
    types: {
      Injury: 7,
      "Near Miss": 4,
      "Property Damage": 3,
      Vehicle: 2,
      Environmental: 2,
    },
    monthly_trend: [3, 2, 4, 2, 3, 4],
  };

  const auditData = {
    total: 15,
    open: 4,
    investigating: 3,
    closed: 8,
    scores: [92, 78, 85, 95, 88, 82, 90, 75, 88, 92, 85, 79, 91, 87, 83],
    avgScore: 87,
  };

  const capaData = {
    total: 12,
    pending: 5,
    verification: 3,
    closed: 4,
    priority: {
      High: 4,
      Medium: 6,
      Low: 2,
    },
  };

  const chemicalData = {
    total: 45,
    active: 38,
    expired: 5,
    disposed: 2,
    hazards: {
      Flammable: 12,
      Toxic: 8,
      Corrosive: 10,
      Oxidizing: 5,
      Explosive: 3,
      Other: 7,
    },
    locations: {
      "Lab-01": 15,
      "Lab-02": 12,
      "Storage-03": 18,
    },
  };

  const trainingData = {
    total_courses: 8,
    completed: 3,
    in_progress: 4,
    not_started: 1,
    completion_rate: 68,
    avg_score: 87,
    monthly_completions: [12, 15, 18, 14, 20, 22],
  };

  // Stats data with navigation routes
  const statsData = [
    { 
      id: 1, 
      route: "PermitToWork",
      title: 'Active PTW', 
      value: ptwData.active.toString(), 
      icon: 'file-signature', 
      color: '#11269C', 
      change: '+12%',
      bgColor: 'rgba(17, 38, 156, 0.1)',
    },
    { 
      id: 2, 
      route: "IncidentManagement",
      title: 'Open Incidents', 
      value: (incidentData.open + incidentData.investigating).toString(), 
      icon: 'exclamation-circle', 
      color: '#dc2626', 
      change: '-5%',
      bgColor: 'rgba(220, 38, 38, 0.1)',
    },
    { 
      id: 3, 
      route: "CapaScreen",
      title: 'CAPA in Progress', 
      value: (capaData.pending + capaData.verification).toString(), 
      icon: 'check-double', 
      color: '#f59e0b', 
      change: '+3%',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    { 
      id: 4, 
      route: "ChemicalSafety",
      title: 'Chemicals', 
      value: chemicalData.active.toString(), 
      icon: 'flask', 
      color: '#10b981', 
      change: '+8%',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
  ];

  // Location data for dropdown
  const locations = ['All Locations', ...Object.keys(ptwData.locations)];

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(17, 38, 156, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#11269C',
    },
    propsForLabels: {
      fontSize: 10,
      fontWeight: '600',
    },
  };

  // Prepare chart data
  const ptwStatusPieData = [
    { name: 'Active', population: ptwData.active, color: '#10b981', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Pending', population: ptwData.pending, color: '#f59e0b', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Completed', population: ptwData.completed, color: '#11269C', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Cancelled', population: ptwData.cancelled, color: '#dc2626', legendFontColor: '#374151', legendFontSize: 12 },
  ];

  const workTypeData = Object.keys(ptwData.work_types).map((key, index) => ({
    name: key,
    population: ptwData.work_types[key],
    color: ['#ff6b35', '#dc2626', '#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280'][index],
    legendFontColor: '#374151',
    legendFontSize: 12,
  }));

  const locationPieData = Object.keys(ptwData.locations).map((key, index) => ({
    name: key.length > 15 ? key.substring(0, 12) + '...' : key,
    population: ptwData.locations[key].total,
    color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index],
    legendFontColor: '#374151',
    legendFontSize: 12,
  }));

  const hazardData = Object.keys(chemicalData.hazards).map((key, index) => ({
    name: key,
    population: chemicalData.hazards[key],
    color: ['#ff6b35', '#dc2626', '#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280'][index],
    legendFontColor: '#374151',
    legendFontSize: 12,
  }));

  const incidentTypeData = Object.keys(incidentData.types).map((key, index) => ({
    name: key,
    population: incidentData.types[key],
    color: ['#dc2626', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'][index],
    legendFontColor: '#374151',
    legendFontSize: 12,
  }));

  const trainingCourseData = [
    { name: 'Completed', population: trainingData.completed, color: '#10b981', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'In Progress', population: trainingData.in_progress, color: '#f59e0b', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Not Started', population: trainingData.not_started, color: '#6b7280', legendFontColor: '#374151', legendFontSize: 12 },
  ];

  const locationData = {
    labels: Object.keys(chemicalData.locations),
    datasets: [{ data: Object.values(chemicalData.locations) }],
  };

  const deptData = {
    labels: Object.keys(ptwData.departments),
    datasets: [{ data: Object.values(ptwData.departments) }],
  };

  const capaPriorityData = {
    labels: Object.keys(capaData.priority),
    datasets: [{ data: Object.values(capaData.priority) }],
  };

  // Progress Bar Component
  const ProgressBar = ({ progress, color, height = 8, showPercentage = true }) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { height }]}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progress}%`, backgroundColor: color }
          ]} 
        />
      </View>
      {showPercentage && <Text style={styles.progressText}>{progress}%</Text>}
    </View>
  );

  // Section Header Component
  const SectionHeader = ({ title, icon, badge, section, color = '#11269C' }) => (
    <TouchableOpacity 
      style={styles.sectionHeader}
      onPress={() => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <Icon name={icon} size={18} color={color} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionHeaderRight}>
        {badge && (
          <View style={[styles.sectionBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.sectionBadgeText, { color }]}>{badge}</Text>
          </View>
        )}
        <Icon 
          name={expandedSections[section] ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color="#6b7280" 
        />
      </View>
    </TouchableOpacity>
  );

  // Location Filter Component
  const LocationFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterContainer}
    >
      {locations.map((location, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.filterChip,
            selectedLocation === location && styles.filterChipActive
          ]}
          onPress={() => setSelectedLocation(location)}
        >
          <Text style={[
            styles.filterChipText,
            selectedLocation === location && styles.filterChipTextActive
          ]}>
            {location}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // People Count Card Component
  const PeopleCountCard = ({ location, data }) => (
    <View style={styles.peopleCard}>
      <View style={styles.peopleCardHeader}>
        <Text style={styles.peopleCardTitle}>{location}</Text>
        <View style={[styles.peopleBadge, { backgroundColor: '#11269C20' }]}>
          <Icon name="users" size={10} color="#11269C" />
          <Text style={styles.peopleBadgeText}>{data.peopleCount}</Text>
        </View>
      </View>
      <Text style={styles.peopleSupervisor}>
        <Icon name="user-tie" size={10} color="#6b7280" /> {data.supervisor}
      </Text>
      <View style={styles.peopleStats}>
        <View style={styles.peopleStat}>
          <Text style={styles.peopleStatValue}>{data.active}</Text>
          <Text style={styles.peopleStatLabel}>Active</Text>
        </View>
        <View style={styles.peopleStat}>
          <Text style={styles.peopleStatValue}>{data.pending}</Text>
          <Text style={styles.peopleStatLabel}>Pending</Text>
        </View>
        <View style={styles.peopleStat}>
          <Text style={styles.peopleStatValue}>{data.completed}</Text>
          <Text style={styles.peopleStatLabel}>Completed</Text>
        </View>
      </View>
    </View>
  );

  // Handle stat card press with navigation
  const handleStatPress = useCallback((route) => {
    if (route) {
      navigation.navigate(route);
    }
  }, [navigation]);

  // Handle back press
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Icon name="arrow-left" size={20} color="#f0f1f5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Dashboard</Text>
          <View style={styles.dateTag}>
            <Icon name="calendar-check" size={12} color="#11269C" />
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>

        {/* Stats Grid with Navigation */}
        <View style={styles.statsGrid}>
          {statsData.map((stat) => (
            <TouchableOpacity 
              key={stat.id} 
              style={[
                styles.statCard,
                { 
                  backgroundColor: '#fff',
                  borderLeftWidth: 4,
                  borderLeftColor: stat.color,
                }
              ]}
              activeOpacity={0.7}
              onPress={() => handleStatPress(stat.route)}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                <Icon name={stat.icon} size={isSmallScreen ? 20 : 24} color={stat.color} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.title}</Text>
                <View style={styles.statChangeContainer}>
                  <Icon 
                    name={stat.change.startsWith('+') ? 'arrow-up' : 'arrow-down'} 
                    size={8} 
                    color={stat.change.startsWith('+') ? '#10b981' : '#dc2626'} 
                  />
                  <Text style={[styles.statChange, { color: stat.change.startsWith('+') ? '#10b981' : '#dc2626' }]}>
                    {stat.change}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location Filter */}
        <LocationFilter />

        {/* Charts - Only render when ready */}
        {chartsReady && (
          <Suspense fallback={<ChartLoader />}>
            {/* PTW ANALYTICS SECTION */}
            <View style={styles.sectionContainer}>
              <SectionHeader 
                title="PTW Analytics" 
                icon="file-signature" 
                badge={`${ptwData.total} Total`}
                section="ptw"
              />

              {expandedSections.ptw && (
                <>
                  {/* Location Distribution Cards */}
                  <Text style={styles.subSectionTitle}>Location Overview</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.peopleScroll}
                  >
                    {Object.keys(ptwData.locations).map((loc, index) => (
                      <PeopleCountCard key={index} location={loc} data={ptwData.locations[loc]} />
                    ))}
                  </ScrollView>

                  {/* PTW Status Distribution */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>Status Distribution</Text>
                      <View style={styles.chartDot} />
                    </View>
                    <View style={styles.canvasContainer}>
                      <PieChart
                        data={ptwStatusPieData}
                        width={width - 64}
                        height={180}
                        chartConfig={chartConfig}
                        accessor="population"
                        paddingLeft="15"
                        absolute
                        hasLegend={false}
                        backgroundColor="transparent"
                      />
                    </View>
                    <View style={styles.chartFooter}>
                      <Text style={styles.chartTotal}>Total: {ptwData.total}</Text>
                      <View style={styles.legendContainer}>
                        {ptwStatusPieData.map((item, index) => (
                          <View key={index} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                            <Text style={styles.legendText}>{item.name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Work Type Distribution */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>Work Type Distribution</Text>
                      <View style={[styles.chartDot, { backgroundColor: '#ff6b35' }]} />
                    </View>
                    <View style={styles.canvasContainer}>
                      <PieChart
                        data={workTypeData}
                        width={width - 64}
                        height={180}
                        chartConfig={chartConfig}
                        accessor="population"
                        paddingLeft="15"
                        absolute
                        hasLegend={false}
                        backgroundColor="transparent"
                      />
                    </View>
                    <View style={styles.chartFooter}>
                      <View style={styles.legendContainer}>
                        {workTypeData.map((item, index) => (
                          <View key={index} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                            <Text style={styles.legendText}>{item.name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Monthly Incident Trend */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>Incident Trend</Text>
                      <View style={[styles.chartDot, { backgroundColor: '#dc2626' }]} />
                    </View>
                    <View style={styles.canvasContainer}>
                      <LineChart
                        data={{
                          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                          datasets: [{
                            data: incidentData.monthly_trend,
                            color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
                            strokeWidth: 3,
                          }],
                        }}
                        width={width - 64}
                        height={180}
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
                          fillShadowGradient: 'rgba(220, 38, 38, 0.1)',
                          fillShadowGradientOpacity: 1,
                        }}
                        bezier
                      />
                    </View>
                  </View>

                  {/* PTW by Department */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>PTW by Department</Text>
                      <View style={styles.chartDot} />
                    </View>
                    <View style={styles.canvasContainer}>
                      <BarChart
                        data={deptData}
                        width={width - 64}
                        height={180}
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) => `rgba(17, 38, 156, ${opacity})`,
                        }}
                        fromZero
                      />
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* CHEMICAL SAFETY SECTION */}
            <View style={styles.sectionContainer}>
              <SectionHeader 
                title="Chemical Safety" 
                icon="flask" 
                badge={`${chemicalData.active} Active`}
                section="chemical"
                color="#10b981"
              />

              {expandedSections.chemical && (
                <>
                  {/* Chemical Hazard Classification */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>By Hazard Class</Text>
                      <View style={[styles.chartDot, { backgroundColor: '#ff6b35' }]} />
                    </View>
                    <View style={styles.canvasContainer}>
                      <BarChart
                        data={{
                          labels: hazardData.map(d => d.name.substring(0, 4)),
                          datasets: [{
                            data: hazardData.map(d => d.population),
                          }],
                        }}
                        width={width - 64}
                        height={200}
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
                        }}
                        fromZero
                      />
                    </View>
                    <View style={styles.chartFooter}>
                      <View style={styles.legendContainer}>
                        {hazardData.slice(0, 3).map((item, index) => (
                          <View key={index} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                            <Text style={styles.legendText}>{item.name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Chemical Location Distribution */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>By Location</Text>
                      <View style={[styles.chartDot, { backgroundColor: '#10b981' }]} />
                    </View>
                    <View style={styles.canvasContainer}>
                      <BarChart
                        data={locationData}
                        width={width - 64}
                        height={200}
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        }}
                        fromZero
                      />
                    </View>
                  </View>

                  {/* Chemical Status Summary */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{chemicalData.active}</Text>
                      <Text style={styles.summaryLabel}>Active</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{chemicalData.expired}</Text>
                      <Text style={styles.summaryLabel}>Expired</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{chemicalData.disposed}</Text>
                      <Text style={styles.summaryLabel}>Disposed</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* TRAINING SECTION */}
            <View style={styles.sectionContainer}>
              <SectionHeader 
                title="Training" 
                icon="graduation-cap" 
                badge={`${trainingData.completion_rate}% Complete`}
                section="training"
                color="#3b82f6"
              />

              {expandedSections.training && (
                <>
                  {/* Training Completion Progress */}
                  <View style={[styles.chartCard, styles.progressCard]}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>Completion Progress</Text>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressStats}>
                        <Text style={styles.progressStatValue}>{trainingData.completion_rate}%</Text>
                        <Text style={styles.progressStatLabel}>Overall Completion</Text>
                      </View>
                      <ProgressBar progress={trainingData.completion_rate} color="#10b981" height={12} />
                      <View style={styles.scoreContainer}>
                        <Icon name="star" size={12} color="#f59e0b" />
                        <Text style={styles.scoreText}>Avg Score: {trainingData.avg_score}%</Text>
                      </View>
                    </View>
                  </View>

                  {/* Course Status */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>Course Status</Text>
                    </View>
                    <View style={styles.canvasContainer}>
                      <PieChart
                        data={trainingCourseData}
                        width={width - 64}
                        height={180}
                        chartConfig={chartConfig}
                        accessor="population"
                        paddingLeft="15"
                        absolute
                        backgroundColor="transparent"
                      />
                    </View>
                    <View style={styles.courseStats}>
                      {trainingCourseData.map((item, index) => (
                        <View key={index} style={styles.courseStatItem}>
                          <View style={[styles.courseDot, { backgroundColor: item.color }]} />
                          <Text style={styles.courseStatText}>{item.name}: {item.population}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Monthly Completions */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>Monthly Completions</Text>
                    </View>
                    <View style={styles.canvasContainer}>
                      <BarChart
                        data={{
                          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                          datasets: [{
                            data: trainingData.monthly_completions,
                          }],
                        }}
                        width={width - 64}
                        height={180}
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                        }}
                        fromZero
                      />
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* INCIDENT & CAPA SECTION */}
            <View style={styles.sectionContainer}>
              <SectionHeader 
                title="Incident & CAPA" 
                icon="exclamation-triangle" 
                badge={`${incidentData.open} Open`}
                section="incident"
                color="#dc2626"
              />

              {expandedSections.incident && (
                <>
                  {/* Incident Types */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>Incident Types</Text>
                    </View>
                    <View style={styles.canvasContainer}>
                      <PieChart
                        data={incidentTypeData}
                        width={width - 64}
                        height={180}
                        chartConfig={chartConfig}
                        accessor="population"
                        paddingLeft="15"
                        absolute
                        backgroundColor="transparent"
                      />
                    </View>
                    <View style={styles.chartFooter}>
                      <View style={styles.legendContainer}>
                        {incidentTypeData.map((item, index) => (
                          <View key={index} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                            <Text style={styles.legendText}>{item.name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Incident Severity */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>Severity Distribution</Text>
                    </View>
                    <View style={styles.severityContainer}>
                      {Object.keys(incidentData.severity).map((key, index) => (
                        <View key={key} style={styles.severityItem}>
                          <View style={styles.severityHeader}>
                            <Text style={styles.severityLabel}>{key}</Text>
                            <Text style={[
                              styles.severityValue,
                              key === 'Critical' && styles.criticalText,
                              key === 'Major' && styles.majorText,
                            ]}>
                              {incidentData.severity[key]}
                            </Text>
                          </View>
                          <ProgressBar 
                            progress={(incidentData.severity[key] / incidentData.total) * 100} 
                            color={
                              key === 'Critical' ? '#dc2626' :
                              key === 'Major' ? '#f59e0b' :
                              key === 'Minor' ? '#3b82f6' : '#10b981'
                            }
                            height={6}
                            showPercentage={false}
                          />
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* CAPA Priority */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>CAPA by Priority</Text>
                    </View>
                    <View style={styles.canvasContainer}>
                      <BarChart
                        data={capaPriorityData}
                        width={width - 64}
                        height={180}
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                        }}
                        fromZero
                      />
                    </View>
                  </View>

                  {/* CAPA Status Summary */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{capaData.pending}</Text>
                      <Text style={styles.summaryLabel}>Pending</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{capaData.verification}</Text>
                      <Text style={styles.summaryLabel}>Verification</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{capaData.closed}</Text>
                      <Text style={styles.summaryLabel}>Closed</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </Suspense>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 75,
    backgroundColor: '#021476',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 23,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    borderRadius: 20,
    marginLeft: 3,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#f5f1f1',
  },
  dateTag: {
    backgroundColor: '#f3f4f8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  dateText: {
    color: '#021696',
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 20,
    gap: 10,
  },
  statCard: {
    width: (width - 34) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '800',
    color: '#111827',
    lineHeight: isSmallScreen ? 28 : 32,
  },
  statLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  statChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChange: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterScroll: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#11269C',
    borderColor: '#11269C',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  peopleScroll: {
    marginBottom: 16,
  },
  peopleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 220,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  peopleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  peopleCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  peopleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  peopleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#11269C',
  },
  peopleSupervisor: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  peopleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  peopleStat: {
    alignItems: 'center',
  },
  peopleStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  peopleStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  progressCard: {
    minHeight: 100,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#11269C',
  },
  canvasContainer: {
    position: 'relative',
    height: 180,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartFooter: {
    marginTop: 10,
  },
  chartTotal: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#11269C',
    marginBottom: 6,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Progress Bar Styles
  progressContainer: {
    paddingVertical: 8,
  },
  progressStats: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#11269C',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#11269C',
    minWidth: 40,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  courseStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  courseStatText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  severityContainer: {
    gap: 12,
  },
  severityItem: {
    marginBottom: 8,
  },
  severityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  severityLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  severityValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  criticalText: {
    color: '#dc2626',
  },
  majorText: {
    color: '#f59e0b',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#11269C',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  scoreText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  chartLoader: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SafetyDashboard;