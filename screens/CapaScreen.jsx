// screens/CapaScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { capaAPI, incidentAPI, auditAPI } from './api/CAPA/CapaAPI';
import CapaFormModal from './CapaFormModal';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

const CapaScreen = () => {
  const navigation = useNavigation();
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('register');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedCapa, setSelectedCapa] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Data states
  const [capas, setCapas] = useState([]);
  const [availableIncidents, setAvailableIncidents] = useState([]);
  const [availableAudits, setAvailableAudits] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verification: 0,
    closed: 0,
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadCapas();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [selectedPriority, selectedStatus, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCapas(),
        loadIncidents(),
        loadAudits(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const transformCapaData = (capa) => ({
    id: capa.id,
    capaId: capa.s_capa_number,
    priority: capa.e_priority,
    title: capa.s_title,
    source: capa.e_source,
    sourceId: capa.fk_incident_id || capa.fk_audit_id,
    sourceTitle: capa.incident_title || capa.audit_title || '',
    sourceNumber: capa.incident_number || capa.audit_number || '',
    date: capa.dt_created || capa.dt_created_at,
    status: capa.e_status,
    description: capa.t_description,
    assignedTo: capa.s_assigned_to,
    dueDate: capa.dt_due_date,
    verificationMethod: capa.s_verification_method,
  });

  const loadCapas = async () => {
    try {
      const filters = {
        priority: selectedPriority !== 'all' ? selectedPriority : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchTerm || undefined,
      };

      const response = await capaAPI.getAll(filters);
      console.log("Raw response from API:", response);

      if (response?.success && Array.isArray(response?.capas)) {
        const transformedCapas = response.capas.map(transformCapaData);
        console.log("Transformed CAPAs:", transformedCapas);
        setCapas(transformedCapas);
      } else {
        setCapas([]);
      }
    } catch (error) {
      console.error('Error loading CAPAs:', error);
      setCapas([]);
      Alert.alert('Error', 'Failed to load CAPAs');
    } finally {
      setRefreshing(false);
    }
  };

  const loadIncidents = async () => {
    try {
      const response = await incidentAPI.getAll();
      if (response?.success && Array.isArray(response?.incidents)) {
        const incidents = response.incidents.map(inc => ({
          id: inc.id,
          displayId: inc.s_incident_number,
          title: inc.s_title,
          date: inc.dt_incident,
        }));
        setAvailableIncidents(incidents);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      setAvailableIncidents([]);
    }
  };

  const loadAudits = async () => {
    try {
      const response = await auditAPI.getAll();
      if (response?.success && Array.isArray(response?.audits)) {
        const audits = response.audits.map(audit => ({
          id: audit.id,
          displayId: audit.s_audit_number,
          title: audit.s_title,
          date: audit.dt_scheduled,
        }));
        setAvailableAudits(audits);
      }
    } catch (error) {
      console.error('Error loading audits:', error);
      setAvailableAudits([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await capaAPI.getStats();
      if (response?.success && response?.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleAddCapa = () => {
    setModalMode('add');
    setSelectedCapa(null);
    setShowFormModal(true);
  };

  const handleEditCapa = (capa) => {
    console.log("Editing CAPA:", capa);
    setModalMode('edit');
    setSelectedCapa(capa);
    setShowFormModal(true);
    setShowDetailsModal(false);
  };

  const handleFormSubmit = async (formData) => {
    setActionLoading(true);
    console.log("Form submitted with data:", formData);

    // Prepare data for backend with correct field names
    const capaData = {
      s_title: formData.title,
      e_priority: formData.priority,
      e_source: formData.source,
      e_status: formData.status,
      t_description: formData.description || '',
      s_assigned_to: formData.assignedTo || '',
      dt_due_date: formData.dueDate || null,
      s_verification_method: formData.verificationMethod || '',
    };

    // Add source ID based on source type
    if (formData.source === 'Incident' && formData.sourceId) {
      capaData.fk_incident_id = parseInt(formData.sourceId);
    } else if (formData.source === 'Audit' && formData.sourceId) {
      capaData.fk_audit_id = parseInt(formData.sourceId);
    }

    try {
      let response;
      if (modalMode === 'edit' && selectedCapa) {
        console.log("Updating CAPA with ID:", selectedCapa.id);
        response = await capaAPI.update(selectedCapa.id, capaData);
      } else {
        console.log("Creating new CAPA");
        response = await capaAPI.create(capaData);
      }

      console.log("Save response:", response);

      if (response?.success) {
        Alert.alert('Success', modalMode === 'add' ? 'CAPA created successfully!' : 'CAPA updated successfully!');
        setShowFormModal(false);
        await loadData(); // Reload all data
      } else {
        Alert.alert('Error', response?.message || 'Failed to save CAPA');
      }
    } catch (error) {
      console.error('Error saving CAPA:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save CAPA');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCapa = (id) => {
    Alert.alert(
      'Delete CAPA',
      'Are you sure you want to delete this CAPA?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              console.log("Deleting CAPA ID:", id);
              const response = await capaAPI.delete(id);
              console.log("Delete response:", response);
              
              if (response?.success) {
                Alert.alert('Success', 'CAPA deleted successfully');
                await loadData();
                setShowDetailsModal(false);
              } else {
                Alert.alert('Error', response?.message || 'Failed to delete CAPA');
              }
            } catch (error) {
              console.error('Error deleting CAPA:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete CAPA');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (capa) => {
    console.log("Viewing CAPA details:", capa);
    setSelectedCapa(capa);
    setShowDetailsModal(true);
  };

  // Filter capas locally
  const filteredCapas = capas.filter(capa => {
    const matchesSearch = searchTerm === '' || 
      capa.capaId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capa.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capa.source?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = selectedPriority === 'all' || 
      capa.priority?.toLowerCase() === selectedPriority.toLowerCase();
    
    const matchesStatus = selectedStatus === 'all' || 
      capa.status?.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Stats data for display
  const statsData = [
    {
      id: 1,
      title: 'Total CAPAs',
      value: stats.total || 0,
      icon: 'clipboard-list',
      color: '#11269C',
      bgColor: 'rgba(17, 38, 156, 0.1)',
    },
    {
      id: 2,
      title: 'Pending Action',
      value: stats.pending || 0,
      icon: 'clock',
      color: '#F39C12',
      bgColor: 'rgba(243, 156, 18, 0.1)',
    },
    {
      id: 3,
      title: 'In Verification',
      value: stats.verification || 0,
      icon: 'check-circle',
      color: '#1e40af',
      bgColor: 'rgba(30, 64, 175, 0.1)',
    },
    {
      id: 4,
      title: 'Closed Effective',
      value: stats.closed || 0,
      icon: 'check-double',
      color: '#166534',
      bgColor: 'rgba(22, 101, 52, 0.1)',
    },
  ];

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      case 'medium':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'low':
        return { backgroundColor: '#dcfce7', color: '#166534' };
      default:
        return { backgroundColor: '#e2e8f0', color: '#64748b' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending action':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'in verification':
        return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'closed effective':
        return { backgroundColor: '#dcfce7', color: '#166534' };
      default:
        return { backgroundColor: '#e2e8f0', color: '#64748b' };
    }
  };

  const renderDropdown = (visible, items, onSelect, onClose, selectedValue) => {
    if (!visible) return null;

    return (
      <View style={styles.dropdown}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dropdownItem}
            onPress={() => {
              onSelect(item.value);
              onClose();
            }}
          >
            <Text
              style={[
                styles.dropdownItemText,
                selectedValue === item.value && styles.dropdownItemSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Loading Overlay */}
      {(loading || actionLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#11269c" />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#f0f0f4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAPA</Text>
        <TouchableOpacity onPress={handleAddCapa} style={styles.addButton}>
          <Icon name="plus" size={16} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Main ScrollView */}
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {statsData.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                <Icon name={stat.icon} size={24} color={stat.color} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.title}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'register' && styles.activeTab]}
            onPress={() => setActiveTab('register')}
          >
            <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
              Register
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
            onPress={() => setActiveTab('documents')}
          >
            <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>
              Documents
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchFilterContainer}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search CAPA ID, Title or Source..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <View style={styles.filterRow}>
            {/* Priority Filter */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
            >
              <Text style={styles.filterButtonText}>
                {selectedPriority === 'all' ? 'All Priorities' : selectedPriority}
              </Text>
              <Icon name="chevron-down" size={12} color="#666" />
            </TouchableOpacity>

            {/* Status Filter */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <Text style={styles.filterButtonText}>
                {selectedStatus === 'all' ? 'All Status' : selectedStatus}
              </Text>
              <Icon name="chevron-down" size={12} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Priority Dropdown */}
          {showPriorityDropdown &&
            renderDropdown(
              showPriorityDropdown,
              [
                { label: 'All Priorities', value: 'all' },
                { label: 'High', value: 'high' },
                { label: 'Medium', value: 'medium' },
                { label: 'Low', value: 'low' },
              ],
              setSelectedPriority,
              () => setShowPriorityDropdown(false),
              selectedPriority
            )}

          {/* Status Dropdown */}
          {showStatusDropdown &&
            renderDropdown(
              showStatusDropdown,
              [
                { label: 'All Status', value: 'all' },
                { label: 'Pending Action', value: 'pending action' },
                { label: 'In Verification', value: 'in verification' },
                { label: 'Closed Effective', value: 'closed effective' },
              ],
              setSelectedStatus,
              () => setShowStatusDropdown(false),
              selectedStatus
            )}
        </View>

        {/* Content based on active tab */}
        {activeTab === 'register' ? (
          <View style={styles.contentContainer}>
            {filteredCapas.length > 0 ? (
              filteredCapas.map((capa) => (
                <TouchableOpacity
                  key={capa.id}
                  style={styles.capaCard}
                  activeOpacity={0.7}
                  onPress={() => handleViewDetails(capa)}
                >
                  <View style={styles.capaCardHeader}>
                    <Text style={styles.capaId}>{capa.capaId}</Text>
                    <View style={[styles.priorityBadge, getPriorityStyle(capa.priority)]}>
                      <Text style={[styles.priorityText, { color: getPriorityStyle(capa.priority).color }]}>
                        {capa.priority}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.capaTitle} numberOfLines={2}>
                    {capa.title}
                  </Text>

                  <View style={styles.capaDetails}>
                    <View style={styles.detailRow}>
                      <Icon name="clipboard" size={12} color="#666" />
                      <Text style={styles.detailLabel}>Source:</Text>
                      <Text style={styles.detailValue}>{capa.source}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="calendar" size={12} color="#666" />
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>
                        {capa.date ? new Date(capa.date).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.capaCardFooter}>
                    <View style={[styles.statusBadge, getStatusStyle(capa.status)]}>
                      <Text style={[styles.statusText, { color: getStatusStyle(capa.status).color }]}>
                        {capa.status}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          handleViewDetails(capa);
                                        }}
                                      >
                                        <Icon name="eye" size={14} color="#11269C" />
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          handleEditCapa(capa);
                                        }}
                                      >
                                        <Icon name="edit" size={14} color="#11269C" />
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          handleDeleteCapa(capa.id);
                                        }}
                                      >
                                        <Icon name="trash" size={14} color="#dc2626" />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
          
                                  {capa.sourceId && capa.sourceTitle && (
                                    <View style={styles.linkedIndicator}>
                                      <Icon name="link" size={10} color="#11269C" />
                                      <Text style={styles.linkedText} numberOfLines={1}>
                                        Linked to {capa.source}: {capa.sourceTitle}
                                      </Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              ))
                            ) : (
                              <View style={styles.emptyState}>
                                <Icon name="clipboard-list" size={50} color="#ccc" />
                                <Text style={styles.emptyStateText}>No CAPAs found</Text>
                                {!loading && (
                                  <TouchableOpacity 
                                    style={styles.emptyStateButton}
                                    onPress={handleAddCapa}
                                  >
                                    <Text style={styles.emptyStateButtonText}>Create your first CAPA</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            )}
                          </View>
                        ) : (
                          <View style={styles.contentContainer}>
                            {filteredCapas.length > 0 ? (
                              filteredCapas.map((capa) => (
                                <View key={capa.id} style={styles.documentCard}>
                                  <View style={styles.documentHeader}>
                                    <Text style={styles.documentTitle}>{capa.capaId}</Text>
                                    <View style={[styles.priorityBadge, getPriorityStyle(capa.priority)]}>
                                      <Text style={[styles.priorityText, { color: getPriorityStyle(capa.priority).color }]}>
                                        {capa.priority}
                                      </Text>
                                    </View>
                                  </View>
          
                                  <Text style={styles.documentSubtitle}>{capa.title}</Text>
          
                                  <View style={styles.documentDetails}>
                                    <View style={styles.detailRow}>
                                      <Icon name="clipboard" size={12} color="#666" />
                                      <Text style={styles.detailLabel}>Source:</Text>
                                      <Text style={styles.detailValue}>{capa.source}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                      <Icon name="calendar" size={12} color="#666" />
                                      <Text style={styles.detailLabel}>Date:</Text>
                                      <Text style={styles.detailValue}>
                                        {capa.date ? new Date(capa.date).toLocaleDateString() : 'N/A'}
                                      </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                      <Icon name="tag" size={12} color="#666" />
                                      <Text style={styles.detailLabel}>Status:</Text>
                                      <Text style={[styles.detailValue, { color: getStatusStyle(capa.status).color }]}>
                                        {capa.status}
                                      </Text>
                                    </View>
                                  </View>
          
                                  <View style={styles.documentActions}>
                                    <TouchableOpacity
                                      style={[styles.docButton, styles.primaryButton]}
                                      onPress={() => handleViewDetails(capa)}
                                    >
                                      <Icon name="eye" size={14} color="#fff" />
                                      <Text style={styles.primaryButtonText}>View Report</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.docButton, styles.secondaryButton]}>
                                      <Icon name="download" size={14} color="#11269C" />
                                      <Text style={styles.secondaryButtonText}>Download</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ))
                            ) : (
                              <View style={styles.emptyState}>
                                <Icon name="file-alt" size={50} color="#ccc" />
                                <Text style={styles.emptyStateText}>No documents found</Text>
                              </View>
                            )}
                          </View>
                        )}
        
                        {/* Bottom Padding */}
                        <View style={styles.bottomPadding} />
                      </ScrollView>
        
                      {/* Add/Edit CAPA Form Modal */}
                      <CapaFormModal
                        visible={showFormModal}
                        onClose={() => setShowFormModal(false)}
                        onSubmit={handleFormSubmit}
                        mode={modalMode}
                        initialData={selectedCapa}
                        availableIncidents={availableIncidents}
                        availableAudits={availableAudits}
                        loading={actionLoading}
                      />
        
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
                              <Text style={styles.modalTitle}>CAPA Details</Text>
                              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                <Icon name="times" size={20} color="#666" />
                              </TouchableOpacity>
                            </View>
        
                            {selectedCapa && (
                              <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.modalBody}>
                                  <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>CAPA ID:</Text>
                                    <Text style={styles.modalValue}>{selectedCapa.capaId}</Text>
                                  </View>
        
                                  <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Priority:</Text>
                                    <View style={[styles.priorityBadge, getPriorityStyle(selectedCapa.priority)]}>
                                      <Text style={[styles.priorityText, { color: getPriorityStyle(selectedCapa.priority).color }]}>
                                        {selectedCapa.priority}
                                      </Text>
                                    </View>
                                  </View>
        
                                  <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Title:</Text>
                                    <Text style={styles.modalValue}>{selectedCapa.title}</Text>
                                  </View>
        
                                  {selectedCapa.description && (
                                    <View style={styles.modalRow}>
                                      <Text style={styles.modalLabel}>Description:</Text>
                                      <Text style={styles.modalValue}>{selectedCapa.description}</Text>
                                    </View>
                                  )}
        
                                  <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Source:</Text>
                                    <Text style={styles.modalValue}>{selectedCapa.source}</Text>
                                  </View>
        
                                  {selectedCapa.sourceId && selectedCapa.sourceTitle && (
                                    <View style={styles.linkedPreview}>
                                      <View style={styles.previewHeader}>
                                        <Icon name="link" size={12} color="#11269C" />
                                        <Text style={styles.previewHeaderText}>
                                          Linked {selectedCapa.source}
                                        </Text>
                                      </View>
                                      <Text style={styles.previewContent}>
                                        {selectedCapa.sourceTitle}
                                      </Text>
                                    </View>
                                  )}
        
                                  <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Assigned To:</Text>
                                    <Text style={styles.modalValue}>{selectedCapa.assignedTo || 'Unassigned'}</Text>
                                  </View>
        
                                  <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Date:</Text>
                                    <Text style={styles.modalValue}>
                                      {selectedCapa.date ? new Date(selectedCapa.date).toLocaleDateString() : 'N/A'}
                                    </Text>
                                  </View>
        
                                  {selectedCapa.dueDate && (
                                    <View style={styles.modalRow}>
                                      <Text style={styles.modalLabel}>Due Date:</Text>
                                      <Text style={styles.modalValue}>
                                        {new Date(selectedCapa.dueDate).toLocaleDateString()}
                                      </Text>
                                    </View>
                                  )}
        
                                  <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Status:</Text>
                                    <View style={[styles.statusBadge, getStatusStyle(selectedCapa.status)]}>
                                      <Text style={[styles.statusText, { color: getStatusStyle(selectedCapa.status).color }]}>
                                        {selectedCapa.status}
                                      </Text>
                                    </View>
                                  </View>
        
                                  {selectedCapa.verificationMethod && (
                                    <View style={styles.modalRow}>
                                      <Text style={styles.modalLabel}>Verification:</Text>
                                      <Text style={styles.modalValue}>{selectedCapa.verificationMethod}</Text>
                                    </View>
                                  )}
                                </View>
        
                                <View style={styles.modalActions}>
                                  <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonPrimary]}
                                    onPress={() => handleEditCapa(selectedCapa)}
                                  >
                                    <Icon name="edit" size={16} color="#fff" />
                                    <Text style={styles.modalButtonText}>Edit</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonDanger]}
                                    onPress={() => handleDeleteCapa(selectedCapa.id)}
                                  >
                                    <Icon name="trash" size={16} color="#fff" />
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
                    height: 71,
                    paddingTop: 22,
                    paddingVertical: 12,
                    backgroundColor: '#061b78',
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
                    color: '#faf6f6',
                  },
                  addButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    gap: 4,
                  },
                  addButtonText: {
                    color: '#fff',
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
                  statsGrid: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    paddingHorizontal: 12,
                    paddingVertical: 16,
                    gap: 12,
                    backgroundColor: '#f5f7fa',
                  },
                  statCard: {
                    width: (width - 36) / 2,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderWidth: 1,
                    borderColor: '#c0c1c4',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                    height: 90,
                  },
                  statIconContainer: {
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  statInfo: {
                    flex: 1,
                  },
                  statNumber: {
                    fontSize: 22,
                    fontWeight: '800',
                    color: '#051886',
                    marginBottom: 2,
                  },
                  statLabel: {
                    fontSize: 11,
                    color: '#64748b',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  },
                  tabContainer: {
                    flexDirection: 'row',
                    backgroundColor: '#fff',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e7eb',
                    marginTop: 0,
                  },
                  tab: {
                    flex: 1,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: '#05215b',
                    alignItems: 'center',
                    borderRadius: 8,
                    marginHorizontal: 4,
                  },
                  activeTab: {
                    backgroundColor: '#11269C',
                  },
                  tabText: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#0d0d0d',
                  },
                  activeTabText: {
                    color: '#fff',
                  },
                  searchFilterContainer: {
                    backgroundColor: '#fff',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e7eb',
                  },
                  searchBox: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#f5f7fa',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  },
                  searchInput: {
                    flex: 1,
                    paddingVertical: 12,
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
                  dropdown: {
                    position: 'absolute',
                    top: 180,
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
                  },
                  dropdownItem: {
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e7eb',
                  },
                  dropdownItemText: {
                    fontSize: 14,
                    color: '#333',
                  },
                  dropdownItemSelected: {
                    color: '#11269C',
                    fontWeight: '600',
                  },
                  contentContainer: {
                    padding: 16,
                    gap: 12,
                    backgroundColor: '#f5f7fa',
                  },
                  capaCard: {
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  },
                  capaCardHeader: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  },
                  capaId: {
                    fontSize: 15,
                    fontWeight: '700',
                    color: '#11269C',
                  },
                  priorityBadge: {
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  },
                  priorityText: {
                    fontSize: 11,
                    fontWeight: '600',
                  },
                  capaTitle: {
                    fontSize: 14,
                    color: '#000',
                    marginBottom: 10,
                    lineHeight: 20,
                  },
                  capaDetails: {
                    marginBottom: 12,
                  },
                  detailRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  },
                  detailLabel: {
                    fontSize: 11,
                    color: '#999',
                    width: 45,
                  },
                  detailValue: {
                    fontSize: 11,
                    color: '#333',
                    fontWeight: '500',
                    flex: 1,
                  },
                  capaCardFooter: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                  },
                  statusBadge: {
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  },
                  statusText: {
                    fontSize: 11,
                    fontWeight: '600',
                  },
                  cardActions: {
                    flexDirection: 'row',
                    gap: 8,
                  },
                  actionButton: {
                    padding: 6,
                    backgroundColor: '#f5f7fa',
                    borderRadius: 6,
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
                    fontSize: 10,
                    color: '#11269C',
                    fontWeight: '500',
                    flex: 1,
                  },
                  documentCard: {
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  },
                  documentHeader: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  },
                  documentTitle: {
                    fontSize: 15,
                    fontWeight: '700',
                    color: '#11269C',
                  },
                  documentSubtitle: {
                    fontSize: 13,
                    color: '#333',
                    marginBottom: 10,
                  },
                  documentDetails: {
                    marginBottom: 12,
                  },
                  documentActions: {
                    flexDirection: 'row',
                    gap: 8,
                    marginTop: 8,
                  },
                  docButton: {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    borderRadius: 8,
                  },
                  primaryButton: {
                    backgroundColor: '#11269C',
                  },
                  secondaryButton: {
                    backgroundColor: '#f5f7fa',
                    borderWidth: 1,
                    borderColor: '#11269C',
                  },
                  primaryButtonText: {
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: '600',
                  },
                  secondaryButtonText: {
                    color: '#11269C',
                    fontSize: 12,
                    fontWeight: '600',
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
                  emptyStateButton: {
                    marginTop: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    backgroundColor: '#11269C',
                    borderRadius: 8,
                  },
                  emptyStateButtonText: {
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: '600',
                  },
                  bottomPadding: {
                    height: 20,
                  },
                  modalOverlay: {
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end',
                  },
                  modalContent: {
                    backgroundColor: '#fff',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: height * 0.8,
                  },
                  modalHeader: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e7eb',
                  },
                  modalTitle: {
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#000',
                  },
                  modalBody: {
                    padding: 20,
                    gap: 12,
                  },
                  modalRow: {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 8,
                  },
                  modalLabel: {
                    width: 90,
                    fontSize: 13,
                    color: '#666',
                    fontWeight: '500',
                  },
                  modalValue: {
                    flex: 1,
                    fontSize: 13,
                    color: '#000',
                    fontWeight: '500',
                  },
                  linkedPreview: {
                    marginTop: 4,
                    marginBottom: 8,
                    padding: 10,
                    backgroundColor: '#f0f9ff',
                    borderRadius: 6,
                    borderLeftWidth: 3,
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
                  modalActions: {
                    flexDirection: 'row',
                    padding: 20,
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
                  modalButtonDanger: {
                    backgroundColor: '#dc2626',
                  },
                  modalButtonText: {
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: '600',
                  },
                });
                
                export default CapaScreen;