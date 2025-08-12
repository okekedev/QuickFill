// components/Navigation/NavigationHeader.js - Clean component with imported styles
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { navigationStyles } from './NavigationStyles';

const NavigationHeader = ({ 
  currentView, 
  onNavigate, 
  hasFiles, 
  showBackButton, 
  onBack 
}) => {
  const getTitle = () => {
    switch (currentView) {
      case 'editor':
        return 'Edit PDF';
      case 'combine':
        return 'Combine PDFs';
      default:
        return 'QuickFill';
    }
  };

  return (
    <View style={navigationStyles.header}>
      {/* Left Side - Back Button */}
      <View style={navigationStyles.leftSection}>
        {showBackButton && (
          <TouchableOpacity style={navigationStyles.backButton} onPress={onBack}>
            <Text style={navigationStyles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Center - Title */}
      <View style={navigationStyles.centerSection}>
        <Text style={navigationStyles.title}>{getTitle()}</Text>
      </View>
      
      {/* Right Side - Action Button */}
      <View style={navigationStyles.rightSection}>
        {currentView === 'upload' && hasFiles && (
          <TouchableOpacity 
            style={navigationStyles.actionButton}
            onPress={() => onNavigate('combine')}
          >
            <Text style={navigationStyles.actionButtonText}>Combine</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default NavigationHeader;