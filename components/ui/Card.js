import React from 'react';
import { View, Text } from 'react-native';
import { components } from '../../styles';

export const Card = ({ 
  children, 
  style,
  title,
  subtitle,
  headerStyle,
  ...props 
}) => {
  return (
    <View style={[components.card, style]} {...props}>
      {(title || subtitle) && (
        <View style={[components.cardHeader, headerStyle]}>
          {title && <Text style={components.cardTitle}>{title}</Text>}
          {subtitle && <Text style={components.cardSubtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
};