import React, { useState, useEffect } from 'react';
import { View, TextInput, Text } from 'react-native';
import { Modal, Button } from '../ui';
import { components, layout } from '../../styles';

export const FieldEditor = ({ 
  visible, 
  field,
  onSave,
  onClose,
  ...props 
}) => {
  const [value, setValue] = useState('');
  const [fieldType, setFieldType] = useState('text');

  useEffect(() => {
    if (field) {
      setValue(field.value || '');
      setFieldType(field.type || 'text');
    }
  }, [field]);

  const handleSave = () => {
    if (field) {
      onSave({
        ...field,
        value,
        type: fieldType
      });
    }
    onClose();
  };

  if (!field) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Edit Field"
      {...props}
    >
      <View style={{ minWidth: 300, padding: 20 }}>
        <Text style={[components.bodyText, layout.py2]}>
          Field Value:
        </Text>
        
        <TextInput
          style={[components.input, layout.py3]}
          value={value}
          onChangeText={setValue}
          placeholder="Enter field value..."
          multiline={fieldType === 'textarea'}
          numberOfLines={fieldType === 'textarea' ? 4 : 1}
        />

        <Text style={[components.bodyText, layout.py2]}>
          Field Type: {fieldType}
        </Text>

        <View style={[layout.row, layout.spaceBetween, layout.py4]}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onClose}
            style={[{ flex: 1 }, layout.mx2]}
          />
          <Button
            title="Save"
            onPress={handleSave}
            style={[{ flex: 1 }, layout.mx2]}
          />
        </View>
      </View>
    </Modal>
  );
};