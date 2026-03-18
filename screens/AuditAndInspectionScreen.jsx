import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { pick, types, isCancel } from '@react-native-documents/picker';
import { auditAPI, attachmentAPI, incidentAPI } from './api/Audit&Inspection/AuditAPI';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isTablet = width >= 768;

const AuditAndInspectionScreen = () => {
  const navigation = useNavigation();
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal and form states
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingAudit, setEditingAudit] = useState(null);
  
  // Dropdown states for form
  const [showSourceTypeDropdown, setShowSourceTypeDropdown] = useState(false);
  const [showTypePickerDropdown, setShowTypePickerDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showAuditorDropdown, setShowAuditorDropdown] = useState(false);
  const [showIncidentDropdown, setShowIncidentDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data states
  const [audits, setAudits] = useState([]);
  const [availableIncidents, setAvailableIncidents] = useState([]);
  const [stats, setStats] = useState({
    totalAudits: 0,
    completedAudits: 0,
    scheduledAudits: 0,
    inProgress: 0,
    averageScore: 0
  });

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Audit form state - UPDATED to match backend
  const [auditFormData, setAuditFormData] = useState({
    s_title: '',
    sourceType: '',
    linkedIncident: '',
    e_audit_type: '',
    s_location: '',
    s_auditor_name: '',
    dt_scheduled: new Date(),
    t_description: '',
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadAudits();
  }, [statusFilter, typeFilter, searchTerm]);

  const loadData = async () => {
    await Promise.all([
      loadAudits(),
      loadIncidents(),
      loadStats()
    ]);
  };

  const loadAudits = async () => {
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.type = typeFilter;
      if (searchTerm) filters.search = searchTerm;

      const response = await auditAPI.getAll(filters);
      
      if (response.success && response.audits) {
        setAudits(response.audits);
      }
    } catch (error) {
      console.error('Error loading audits:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadIncidents = async () => {
    try {
      const response = await incidentAPI.getAll();
      console.log('Incidents response:', response);
      
      if (response?.success && Array.isArray(response.incidents)) {
        setAvailableIncidents(response.incidents);
      } else {
        setAvailableIncidents([]);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      setAvailableIncidents([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await auditAPI.getStats();
      if (response.success && response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleAuditInputChange = (field, value) => {
    setAuditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSourceTypeChange = (value) => {
    setAuditFormData(prev => ({
      ...prev,
      sourceType: value,
      linkedIncident: value === 'Incident' ? prev.linkedIncident : ''
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAuditFormData(prev => ({
        ...prev,
        dt_scheduled: selectedDate
      }));
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  // Handle file selection
  const handleFileSelect = async () => {
    try {
      const results = await pick({
        allowMultiSelection: true,
        type: [types.allFiles],
      });

      const newFiles = results.map(doc => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: doc.name,
        size: doc.size,
        type: doc.type,
        uri: doc.uri,
        file: {
          uri: doc.uri,
          type: doc.type,
          name: doc.name,
        }
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
    } catch (error) {
      if (isCancel(error)) {
        console.log('User cancelled document picker');
      } else {
        console.error('Document picker error:', error);
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    // Validate required fields - UPDATED field names
    if (!auditFormData.s_title || !auditFormData.e_audit_type || !auditFormData.s_location || !auditFormData.s_auditor_name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    // Prepare data for backend - UPDATED to match backend field names
    const auditData = {
      s_title: auditFormData.s_title,
      dt_scheduled: auditFormData.dt_scheduled.toISOString(),
      s_location: auditFormData.s_location,
      e_audit_type: auditFormData.e_audit_type,
      e_severity: 'Minor', // Default severity
      s_auditor_name: auditFormData.s_auditor_name,
      s_reporter_name: auditFormData.s_auditor_name, // Using same as auditor
      fk_linked_incident_id: auditFormData.linkedIncident || null,
      t_description: auditFormData.t_description || '',
    };

    try {
      let response;
      if (editingAudit) {
        response = await auditAPI.update(editingAudit.id, auditData);
      } else {
        response = await auditAPI.create(auditData);
      }

      if (response.success) {
        // Upload files if any
        if (uploadedFiles.length > 0) {
          const auditId = editingAudit ? editingAudit.id : response.audit.id;
          await attachmentAPI.add(auditId, uploadedFiles.map(f => f.file));
        }

        Alert.alert('Success', editingAudit ? 'Audit updated successfully!' : 'Audit scheduled successfully!');
        resetForm();
        await loadData();
      }
    } catch (error) {
      console.error('Error saving audit:', error);
      Alert.alert('Error', 'Failed to save audit');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowAuditForm(false);
    setEditingAudit(null);
    setAuditFormData({
      s_title: '',
      sourceType: '',
      linkedIncident: '',
      e_audit_type: '',
      s_location: '',
      s_auditor_name: '',
      dt_scheduled: new Date(),
      t_description: '',
    });
    setUploadedFiles([]);
  };

  const handleEditClick = (audit) => {
    setEditingAudit(audit);
    setAuditFormData({
      s_title: audit.s_title,
      sourceType: audit.fk_linked_incident_id ? 'Incident' : '',
      linkedIncident: audit.fk_linked_incident_id || '',
      e_audit_type: audit.e_audit_type,
      s_location: audit.s_location,
      s_auditor_name: audit.s_auditor_name,
      dt_scheduled: new Date(audit.dt_scheduled),
      t_description: audit.t_description || '',
    });
    setShowAuditForm(true);
    setShowDetailsModal(false);
  };

  const handleDeleteAudit = async (auditId) => {
    Alert.alert(
      'Delete Audit',
      'Are you sure you want to delete this audit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await auditAPI.delete(auditId);
              if (response.success) {
                Alert.alert('Success', 'Audit deleted successfully');
                await loadData();
                setShowDetailsModal(false);
              }
            } catch (error) {
              console.error('Error deleting audit:', error);
              Alert.alert('Error', 'Failed to delete audit');
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = (audit) => {
    setSelectedAudit(audit);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (auditId, newStatus) => {
    try {
      const response = await auditAPI.updateStatus(auditId, newStatus);
      if (response.success) {
        await loadAudits();
        if (selectedAudit && selectedAudit.id === auditId) {
          setSelectedAudit(prev => ({ ...prev, e_status: newStatus }));
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filterAudits = () => {
    return audits;
  };

  const getTypeBadgeStyle = (type) => {
    switch(type?.toLowerCase()) {
      case 'safety':
        return { backgroundColor: '#FDECEA', color: '#E74C3C' };
      case 'quality':
        return { backgroundColor: '#E8F8F0', color: '#2ECC71' };
      case 'environmental':
        return { backgroundColor: '#FFEEEE', color: '#FF6B6B' };
      case '5s':
        return { backgroundColor: '#E8F4F8', color: '#45B7D1' };
      case 'behavioral':
        return { backgroundColor: '#F0F9F8', color: '#4ECDC4' };
      case 'incident follow-up':
        return { backgroundColor: '#FEF5E7', color: '#F39C12' };
      default:
        return { backgroundColor: '#E8F2FC', color: '#4A90E2' };
    }
  };

  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'open':
        return { backgroundColor: '#FEF5E7', color: '#F39C12' };
      case 'investigating':
        return { backgroundColor: '#E8F2FC', color: '#4A90E2' };
      case 'closed':
        return { backgroundColor: '#E8F8F0', color: '#2ECC71' };
      default:
        return { backgroundColor: '#E8F8F0', color: '#2ECC71' };
    }
  };

  const getScoreStyle = (score) => {
    if (!score || score === 'Pending') return { backgroundColor: '#E5E7EB', color: '#6B7280' };
    const scoreNum = parseInt(score);
    if (scoreNum >= 90) return { backgroundColor: '#E8F8F0', color: '#2ECC71' };
    if (scoreNum >= 80) return { backgroundColor: '#E8F2FC', color: '#4A90E2' };
    if (scoreNum >= 70) return { backgroundColor: '#FEF5E7', color: '#F39C12' };
    return { backgroundColor: '#FDECEA', color: '#E74C3C' };
  };

  const filteredAudits = filterAudits();

  // Dropdown render function
  const renderDropdown = (visible, items, onSelect, onClose, selectedValue, renderItem) => {
    if (!visible) return null;
    
    return (
      <View style={styles.dropdownMenu}>
        <ScrollView nestedScrollEnabled={true} style={styles.dropdownScroll}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dropdownMenuItem,
                selectedValue === (item.value || item) && styles.dropdownMenuItemSelected
              ]}
              onPress={() => {
                onSelect(item.value || item);
                onClose();
              }}
            >
              {renderItem ? renderItem(item, selectedValue) : (
                <Text style={[
                  styles.dropdownMenuItemText,
                  selectedValue === (item.value || item) && styles.dropdownMenuItemTextSelected
                ]}>
                  {item.label || item}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Stats data - UPDATED to match backend response
  const statsData = [
    {
      id: 1,
      number: stats.totalAudits || 0,
      label: 'Total Audits',
      icon: 'clipboard-list',
      color: '#4A90E2',
      bgColor: '#E8F2FC'
    },
    {
      id: 2,
      number: stats.closedAudits || 0,
      label: 'Completed',
      icon: 'check-circle',
      color: '#2ECC71',
      bgColor: '#E8F8F0'
    },
    {
      id: 3,
      number: (stats.openAudits || 0) + (stats.investigatingAudits || 0),
      label: 'In Progress',
      icon: 'clock',
      color: '#F39C12',
      bgColor: '#FEF5E7'
    },
    {
      id: 4,
      number: stats.averageScore || 0,
      label: 'Avg. Score',
      icon: 'star',
      color: '#4F46E5',
      bgColor: '#E0E7FF',
      suffix: '%'
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#11269c" />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#f1f2f5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit & Inspection</Text>
        <TouchableOpacity 
          style={styles.scheduleButton}
          onPress={() => {
            resetForm();
            setShowAuditForm(true);
          }}
        >
          <Icon name="plus" size={16} color="#03197a" />
          <Text style={styles.scheduleButtonText}>Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {statsData.map(stat => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                <Icon name={stat.icon} size={20} color={stat.color} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>
                  {stat.number}{stat.suffix || ''}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>Recent Audits & Inspections</Text>
          <View style={styles.recordCount}>
            <Text style={styles.recordCountText}>{filteredAudits.length} records</Text>
          </View>
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search audits..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <View style={styles.filterRow}>
            {/* Status Filter - UPDATED: Removed 'Scheduled' */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <Text style={styles.filterButtonText}>
                {statusFilter || 'All Status'}
              </Text>
              <Icon name="chevron-down" size={12} color="#666" />
            </TouchableOpacity>

            {/* Type Filter */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <Text style={styles.filterButtonText}>
                {typeFilter || 'All Types'}
              </Text>
              <Icon name="chevron-down" size={12} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Status Dropdown - UPDATED: Removed 'Scheduled' */}
          {showStatusDropdown && renderDropdown(
            true,
            ['Open', 'Investigating', 'Closed'],
            (value) => {
              setStatusFilter(value);
              setShowStatusDropdown(false);
            },
            () => setShowStatusDropdown(false),
            statusFilter
          )}

          {/* Type Dropdown */}
          {showTypeDropdown && renderDropdown(
            true,
            ['Safety', 'Quality', 'Environmental', '5S', 'Behavioral', 'Incident Follow-up'],
            (value) => {
              setTypeFilter(value);
              setShowTypeDropdown(false);
            },
            () => setShowTypeDropdown(false),
            typeFilter
          )}
        </View>

        {/* Audit Cards List */}
        <View style={styles.listContainer}>
          {filteredAudits.map((audit) => (
            <TouchableOpacity
              key={audit.id}
              style={styles.auditCard}
              activeOpacity={0.7}
              onPress={() => handleViewDetails(audit)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.idContainer}>
                  <Text style={styles.auditId}>{audit.s_audit_number}</Text>
                  <View style={[styles.typeBadge, getTypeBadgeStyle(audit.e_audit_type)]}>
                    <Text style={[styles.badgeText, { color: getTypeBadgeStyle(audit.e_audit_type).color }]}>
                      {audit.e_audit_type}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, getStatusStyle(audit.e_status)]}>
                  <Text style={[styles.badgeText, { color: getStatusStyle(audit.e_status).color }]}>
                    {audit.e_status}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>{audit.s_title}</Text>

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Icon name="map-marker-alt" size={12} color="#666" />
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{audit.s_location}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="user" size={12} color="#666" />
                  <Text style={styles.detailLabel}>Auditor:</Text>
                  <Text style={styles.detailValue}>{audit.s_auditor_name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="calendar" size={12} color="#666" />
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(audit.dt_scheduled)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="star" size={12} color="#666" />
                  <Text style={styles.detailLabel}>Score:</Text>
                  <View style={[styles.scoreBadge, getScoreStyle(audit.i_score)]}>
                    <Text style={[styles.badgeText, { color: getScoreStyle(audit.i_score).color }]}>
                      {audit.i_score || 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>

              {audit.fk_linked_incident_id && (
                <View style={styles.linkedIndicator}>
                  <Icon name="link" size={10} color="#11269C" />
                  <Text style={styles.linkedText}>Linked to Incident</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          
          {filteredAudits.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="clipboard-list" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>No audits found</Text>
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Schedule/Edit Audit Modal */}
      <Modal
        visible={showAuditForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAuditForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAudit ? 'Edit Audit' : 'Schedule New Audit'}
              </Text>
              <TouchableOpacity onPress={() => setShowAuditForm(false)}>
                <Icon name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
              <View style={styles.modalBody}>
                {/* Audit Source Section */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>
                    <Icon name="link" size={14} color="#11269C" /> Audit Source
                  </Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Link to Existing Record</Text>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowSourceTypeDropdown(!showSourceTypeDropdown)}
                    >
                      <Text style={styles.pickerButtonText}>
                        {auditFormData.sourceType === 'Incident' ? 'Link to Incident' : 'None - Standalone Audit'}
                      </Text>
                      <Icon name="chevron-down" size={12} color="#666" />
                    </TouchableOpacity>
                    
                    {showSourceTypeDropdown && renderDropdown(
                      true,
                      [
                        { label: 'None - Standalone Audit', value: '' },
                        { label: 'Link to Incident', value: 'Incident' }
                      ],
                      (value) => {
                        handleSourceTypeChange(value);
                        setShowSourceTypeDropdown(false);
                      },
                      () => setShowSourceTypeDropdown(false),
                      auditFormData.sourceType,
                      (item) => (
                        <Text style={[
                          styles.dropdownMenuItemText,
                          auditFormData.sourceType === item.value && styles.dropdownMenuItemTextSelected
                        ]}>
                          {item.label}
                        </Text>
                      )
                    )}
                  </View>

                  {/* Incident Selection */}
                  {auditFormData.sourceType === 'Incident' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Select Incident *</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowIncidentDropdown(!showIncidentDropdown)}
                      >
                        <Text style={styles.pickerButtonText} numberOfLines={1}>
                          {auditFormData.linkedIncident ? 
                            availableIncidents.find(i => i.id === auditFormData.linkedIncident)?.s_incident_number + ' - ' + 
                            availableIncidents.find(i => i.id === auditFormData.linkedIncident)?.s_title 
                            : 'Select an incident...'}
                        </Text>
                        <Icon name="chevron-down" size={12} color="#666" />
                      </TouchableOpacity>
                      
                      {showIncidentDropdown && renderDropdown(
                        true,
                        availableIncidents,
                        (value) => {
                          handleAuditInputChange('linkedIncident', value);
                          setShowIncidentDropdown(false);
                        },
                        () => setShowIncidentDropdown(false),
                        auditFormData.linkedIncident,
                        (incident) => (
                          <View>
                            <Text style={[
                              styles.dropdownMenuItemText,
                              auditFormData.linkedIncident === incident.id && styles.dropdownMenuItemTextSelected
                            ]}>
                              {incident.s_incident_number} - {incident.s_title}
                            </Text>
                            <Text style={styles.incidentDate}>{incident.dt_incident}</Text>
                          </View>
                        )
                      )}
                      <Text style={styles.helpText}>
                        Audit will be linked to this incident for follow-up investigation
                      </Text>
                    </View>
                  )}
                </View>

                {/* Audit Details Section - UPDATED field names */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>
                    <Icon name="info-circle" size={14} color="#11269C" /> Audit Details
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Audit Title *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Monthly Safety Audit - Building A"
                      placeholderTextColor="#999"
                      value={auditFormData.s_title}
                      onChangeText={(value) => handleAuditInputChange('s_title', value)}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 4 }]}>
                      <Text style={styles.label}>Audit Type *</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowTypePickerDropdown(!showTypePickerDropdown)}
                      >
                        <Text style={styles.pickerButtonText}>
                          {auditFormData.e_audit_type || 'Select Type'}
                        </Text>
                        <Icon name="chevron-down" size={12} color="#666" />
                      </TouchableOpacity>
                      
                      {showTypePickerDropdown && renderDropdown(
                        true,
                        ['Safety', 'Quality', 'Environmental', '5S', 'Behavioral', 'Incident Follow-up'],
                        (value) => {
                          handleAuditInputChange('e_audit_type', value);
                          setShowTypePickerDropdown(false);
                        },
                        () => setShowTypePickerDropdown(false),
                        auditFormData.e_audit_type
                      )}
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 4 }]}>
                      <Text style={styles.label}>Location *</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowLocationDropdown(!showLocationDropdown)}
                      >
                        <Text style={styles.pickerButtonText}>
                          {auditFormData.s_location || 'Select Location'}
                        </Text>
                        <Icon name="chevron-down" size={12} color="#666" />
                      </TouchableOpacity>
                      
                      {showLocationDropdown && renderDropdown(
                        true,
                        ['Building A', 'Building B', 'Warehouse', 'Office'],
                        (value) => {
                          handleAuditInputChange('s_location', value);
                          setShowLocationDropdown(false);
                        },
                        () => setShowLocationDropdown(false),
                        auditFormData.s_location
                      )}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 4 }]}>
                      <Text style={styles.label}>Auditor *</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowAuditorDropdown(!showAuditorDropdown)}
                      >
                        <Text style={styles.pickerButtonText}>
                          {auditFormData.s_auditor_name || 'Select Auditor'}
                        </Text>
                        <Icon name="chevron-down" size={12} color="#666" />
                      </TouchableOpacity>
                      
                      {showAuditorDropdown && renderDropdown(
                        true,
                        ['Sarah Johnson', 'Mike Chen', 'Lisa Park'],
                        (value) => {
                          handleAuditInputChange('s_auditor_name', value);
                          setShowAuditorDropdown(false);
                        },
                        () => setShowAuditorDropdown(false),
                        auditFormData.s_auditor_name
                      )}
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 4 }]}>
                      <Text style={styles.label}>Scheduled Date *</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text style={styles.dateText}>
                          {formatDate(auditFormData.dt_scheduled)}
                        </Text>
                        <Icon name="calendar" size={16} color="#11269C" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Enter audit description..."
                      placeholderTextColor="#999"
                      value={auditFormData.t_description}
                      onChangeText={(value) => handleAuditInputChange('t_description', value)}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* File Attachments */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Attachments</Text>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={handleFileSelect}
                    >
                      <Icon name="paperclip" size={16} color="#11269C" />
                      <Text style={styles.uploadButtonText}>Choose Files</Text>
                    </TouchableOpacity>
                    
                    {uploadedFiles.length > 0 && (
                      <View style={styles.fileList}>
                        {uploadedFiles.map(file => (
                          <View key={file.id} style={styles.fileItem}>
                            <View style={styles.fileInfo}>
                              <Icon name="file" size={14} color="#11269C" />
                              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                              <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.removeFileButton}
                              onPress={() => removeFile(file.id)}
                            >
                              <Icon name="times" size={12} color="#E74C3C" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={resetForm}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>
                      {editingAudit ? 'Update Audit' : 'Schedule Audit'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={auditFormData.dt_scheduled}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audit Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Icon name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedAudit && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Audit ID:</Text>
                    <Text style={styles.modalValue}>{selectedAudit.s_audit_number}</Text>
                  </View>

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Title:</Text>
                    <Text style={styles.modalValue}>{selectedAudit.s_title}</Text>
                  </View>

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Type:</Text>
                    <View style={[styles.typeBadge, getTypeBadgeStyle(selectedAudit.e_audit_type)]}>
                      <Text style={[styles.badgeText, { color: getTypeBadgeStyle(selectedAudit.e_audit_type).color }]}>
                        {selectedAudit.e_audit_type}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Location:</Text>
                    <Text style={styles.modalValue}>{selectedAudit.s_location}</Text>
                  </View>

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Auditor:</Text>
                    <Text style={styles.modalValue}>{selectedAudit.s_auditor_name}</Text>
                  </View>

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Date:</Text>
                    <Text style={styles.modalValue}>{formatDateTime(selectedAudit.dt_scheduled)}</Text>
                  </View>

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Status:</Text>
                    <View style={[styles.statusBadge, getStatusStyle(selectedAudit.e_status)]}>
                      <Text style={[styles.badgeText, { color: getStatusStyle(selectedAudit.e_status).color }]}>
                        {selectedAudit.e_status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Score:</Text>
                    <View style={[styles.scoreBadge, getScoreStyle(selectedAudit.i_score)]}>
                      <Text style={[styles.badgeText, { color: getScoreStyle(selectedAudit.i_score).color }]}>
                        {selectedAudit.i_score || 'Pending'}
                      </Text>
                    </View>
                  </View>

                  {selectedAudit.t_description && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Description:</Text>
                      <Text style={styles.modalValue}>{selectedAudit.t_description}</Text>
                    </View>
                  )}

                  {selectedAudit.fk_linked_incident_id && (
                    <View style={styles.linkedPreview}>
                      <View style={styles.previewHeader}>
                        <Icon name="link" size={12} color="#11269C" />
                        <Text style={styles.previewHeaderText}>Linked Incident</Text>
                      </View>
                      <Text style={styles.previewContent}>
                        Incident ID: {selectedAudit.fk_linked_incident_id}
                      </Text>
                    </View>
                  )}

                  {/* Status Update - UPDATED: Removed 'Scheduled' */}
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Update Status:</Text>
                    <View style={styles.statusUpdateContainer}>
                      {['Open', 'Investigating', 'Closed'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusOption,
                            getStatusStyle(status),
                            selectedAudit.e_status === status && styles.statusOptionSelected
                          ]}
                          onPress={() => handleUpdateStatus(selectedAudit.id, status)}
                        >
                          <Text style={[styles.statusOptionText, { color: getStatusStyle(status).color }]}>
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={() => handleEditClick(selectedAudit)}
                  >
                    <Icon name="edit" size={16} color="#fff" />
                    <Text style={styles.modalButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonDanger]}
                    onPress={() => handleDeleteAudit(selectedAudit.id)}
                  >
                    <Icon name="trash-alt" size={16} color="#fff" />
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Styles remain the same as your original code
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 75,
    paddingTop: 27,
    paddingVertical: 12,
    backgroundColor: '#021679',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 2,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#f9f4f4',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f1f7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  scheduleButtonText: {
    color: '#031a81',
    fontSize: 14,
    fontWeight: '600',
  },
  mainScrollView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    width: (width - 44) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11269C',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  titleSection: {
    backgroundColor: '#11269C',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  titleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  recordCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  recordCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#000',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 240,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownMenuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownMenuItemSelected: {
    backgroundColor: '#f0f3ff',
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownMenuItemTextSelected: {
    color: '#11269C',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  auditCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  auditId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#11269C',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardDetails: {
    marginBottom: 8,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    width: 50,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  linkedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  linkedText: {
    fontSize: 11,
    color: '#11269C',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: width * 0.95,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11269C',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f5f7fa',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f5f7fa',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f5f7fa',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  incidentDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  helpText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f5f7fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#11269C',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#11269C',
    fontSize: 14,
    fontWeight: '600',
  },
  fileList: {
    marginTop: 8,
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  fileSize: {
    fontSize: 10,
    color: '#999',
  },
  removeFileButton: {
    padding: 4,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  modalLabel: {
    width: 80,
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  modalValue: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  linkedPreview: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0f5ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#11269C',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  previewHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#11269C',
  },
  previewContent: {
    fontSize: 12,
    color: '#374151',
  },
  statusUpdateContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  statusOption: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusOptionSelected: {
    borderColor: '#11269C',
    borderWidth: 2,
  },
  statusOptionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#11269C',
  },
  modalButtonSecondary: {
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#11269C',
  },
  modalButtonDanger: {
    backgroundColor: '#E74C3C',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#11269C',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuditAndInspectionScreen;