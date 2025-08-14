import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { components } from '../../styles';
import { CloseIcon } from '../../icons';

export const Modal = ({ 
  visible, 
  onClose, 
  title,
  children, 
  style,
  overlayStyle,
  closeOnOverlay = true,
  showCloseButton = true,
  ...props 
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      {...props}
    >
      <TouchableWithoutFeedback onPress={closeOnOverlay ? onClose : undefined}>
        <View style={[components.modalOverlay, overlayStyle]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[components.modalContent, style]}>
              {(title || showCloseButton) && (
                <View style={components.modalHeader}>
                  {title && <Text style={components.modalTitle}>{title}</Text>}
                  {showCloseButton && (
                    <TouchableOpacity 
                      style={components.modalCloseButton} 
                      onPress={onClose}
                      activeOpacity={0.7}
                    >
                      <CloseIcon size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};