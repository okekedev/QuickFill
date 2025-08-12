// components/PDFEditor/SignatureOptionsDialog.js - Clean component with imported styles
import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal
} from 'react-native';
import { signatureOptionsStyles } from './PDFEditorStyles';

const SignatureOptionsDialog = ({
  visible,
  onClose,
  onUseExisting,
  onReplace,
  onCreateNew,
  hasExistingSignature
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={signatureOptionsStyles.modalOverlay}>
        <View style={signatureOptionsStyles.modalDialog}>
          {/* Header */}
          <View style={signatureOptionsStyles.modalHeader}>
            <Text style={signatureOptionsStyles.modalTitle}>Signature Options</Text>
            <Text style={signatureOptionsStyles.modalSubtitle}>
              You have a saved signature. What would you like to do?
            </Text>
          </View>

          {/* Option Buttons */}
          <View style={signatureOptionsStyles.optionButtons}>
            {hasExistingSignature && (
              <TouchableOpacity 
                style={[signatureOptionsStyles.optionButton, signatureOptionsStyles.useExistingButton]} 
                onPress={onUseExisting}
                activeOpacity={0.8}
              >
                <Text style={signatureOptionsStyles.optionIcon}>✓</Text>
                <Text style={signatureOptionsStyles.optionButtonText}>Use Existing Signature</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[signatureOptionsStyles.optionButton, signatureOptionsStyles.replaceButton]} 
              onPress={onReplace}
              activeOpacity={0.8}
            >
              <Text style={signatureOptionsStyles.optionIcon}>✏️</Text>
              <Text style={signatureOptionsStyles.optionButtonText}>Replace My Signature</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[signatureOptionsStyles.optionButton, signatureOptionsStyles.createNewButton]} 
              onPress={onCreateNew}
              activeOpacity={0.8}
            >
              <Text style={signatureOptionsStyles.optionIcon}>➕</Text>
              <Text style={signatureOptionsStyles.optionButtonText}>Create Customer Field</Text>
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity 
            style={signatureOptionsStyles.cancelButton} 
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={signatureOptionsStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SignatureOptionsDialog;