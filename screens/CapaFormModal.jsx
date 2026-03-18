// components/CapaFormModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions, 
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

const CapaFormModal = ({
  visible,
  onClose,
  onSubmit,
  mode,
  initialData,
  availableIncidents,
  availableAudits,
  loading,
}) => {
  const [formData, setFormData] = useState({
    priority: 'Medium',
    title: '',
    source: 'Incident',
    sourceId: '',
    status: 'Pending Action',
    description: '',
    assignedTo: '',
    dueDate: '',
    verificationMethod: '',
  });

  // Dropdown states
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showSourceIdDropdown, setShowSourceIdDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        priority: initialData.priority || 'Medium',
        title: initialData.title || '',
        source: initialData.source || 'Incident',
        sourceId: initialData.sourceId ? String(initialData.sourceId) : '',
        status: initialData.status || 'Pending Action',
        description: initialData.description || '',
        assignedTo: initialData.assignedTo || '',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        verificationMethod: initialData.verificationMethod || '',
      });
    } else {
      // Reset form for add mode
      setFormData({
        priority: 'Medium',
        title: '',
        source: 'Incident',
        sourceId: '',
        status: 'Pending Action',
        description: '',
        assignedTo: '',
        dueDate: '',
        verificationMethod: '',
      });
    }
  }, [initialData, mode, visible]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleInputChange('dueDate', formattedDate);
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.title) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    onSubmit(formData);
  };

  const getSourceItems = () => {
    if (formData.source === 'Incident') {
      return availableIncidents.map(item => ({
        value: String(item.id),
        label: `${item.displayId} - ${item.title}`,
      }));
    } else {
      return availableAudits.map(item => ({
        value: String(item.id),
        label: `${item.displayId} - ${item.title}`,
      }));
    }
  };

  const renderDropdown = (visible, items, onSelect, onClose, selectedValue) => {
    if (!visible) return null;

    return (
      <View style={styles.dropdownMenu}>
        <ScrollView nestedScrollEnabled={true} style={styles.dropdownScroll}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dropdownMenuItem,
                selectedValue === (item.value || item) && styles.dropdownMenuItemSelected,
              ]}
              onPress={() => {
                onSelect(item.value || item);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.dropdownMenuItemText,
                  selectedValue === (item.value || item) && styles.dropdownMenuItemTextSelected,
                ]}
              >
                {item.label || item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {mode === 'add' ? 'Create New CAPA' : 'Edit CAPA'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter CAPA title"
                  placeholderTextColor="#999"
                  value={formData.title}
                  onChangeText={(value) => handleInputChange('title', value)}
                />
              </View>

              {/* Priority and Status Row */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 4 }]}>
                  <Text style={styles.label}>Priority *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
                  >
                    <Text style={styles.pickerButtonText}>{formData.priority}</Text>
                    <Icon name="chevron-down" size={12} color="#666" />
                  </TouchableOpacity>
                  {renderDropdown(
                    showPriorityDropdown,
                    ['High', 'Medium', 'Low'],
                    (value) => {
                      handleInputChange('priority', value);
                      setShowPriorityDropdown(false);
                    },
                    () => setShowPriorityDropdown(false),
                    formData.priority
                  )}
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 4 }]}>
                  <Text style={styles.label}>Status *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <Text style={styles.pickerButtonText}>{formData.status}</Text>
                    <Icon name="chevron-down" size={12} color="#666" />
                  </TouchableOpacity>
                  {renderDropdown(
                    showStatusDropdown,
                    ['Pending Action', 'In Verification', 'Closed Effective'],
                    (value) => {
                      handleInputChange('status', value);
                      setShowStatusDropdown(false);
                    },
                    () => setShowStatusDropdown(false),
                    formData.status
                  )}
                </View>
              </View>

              {/* Source and Link Row */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 4 }]}>
                  <Text style={styles.label}>Source *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowSourceDropdown(!showSourceDropdown)}
                  >
                    <Text style={styles.pickerButtonText}>{formData.source}</Text>
                    <Icon name="chevron-down" size={12} color="#666" />
                  </TouchableOpacity>
                  {renderDropdown(
                    showSourceDropdown,
                    ['Incident', 'Audit'],
                    (value) => {
                      handleInputChange('source', value);
                      handleInputChange('sourceId', ''); // Reset source ID when source changes
                      setShowSourceDropdown(false);
                    },
                    () => setShowSourceDropdown(false),
                    formData.source
                  )}
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 4 }]}>
                  <Text style={styles.label}>
                    <Icon name="link" size={12} color="#11269C" /> Link to {formData.source}
                  </Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowSourceIdDropdown(!showSourceIdDropdown)}
                  >
                    <Text style={styles.pickerButtonText} numberOfLines={1}>
                      {formData.sourceId
                        ? getSourceItems().find(item => item.value === formData.sourceId)?.label || 'Select...'
                        : `Select ${formData.source}...`}
                    </Text>
                    <Icon name="chevron-down" size={12} color="#666" />
                  </TouchableOpacity>
                  {renderDropdown(
                    showSourceIdDropdown,
                    getSourceItems(),
                    (value) => {
                      handleInputChange('sourceId', value);
                      setShowSourceIdDropdown(false);
                    },
                    () => setShowSourceIdDropdown(false),
                    formData.sourceId
                  )}
                </View>
              </View>

              {/* Assigned To and Due Date Row */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 4 }]}>
                  <Text style={styles.label}>Assigned To</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter name"
                    placeholderTextColor="#999"
                    value={formData.assignedTo}
                    onChangeText={(value) => handleInputChange('assignedTo', value)}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 4 }]}>
                  <Text style={styles.label}>Due Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {formData.dueDate || 'Select date'}
                    </Text>
                    <Icon name="calendar" size={16} color="#11269C" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the corrective action..."
                  placeholderTextColor="#999"
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Verification Method */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Verification Method</Text>
                <TextInput
                  style={styles.input}
                  placeholder="How will this be verified?"
                  placeholderTextColor="#999"
                  value={formData.verificationMethod}
                  onChangeText={(value) => handleInputChange('verificationMethod', value)}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={onClose}
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
                    {mode === 'add' ? 'Create CAPA' : 'Save Changes'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.dueDate ? new Date(formData.dueDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
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
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2000,
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

export default CapaFormModal;