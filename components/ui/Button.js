import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { components, colors } from '../../styles';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  children,
  icon,
  pointerEvents,
  ...props 
}) => {
  const getButtonStyle = () => {
    const baseStyle = components.button;
    switch (variant) {
      case 'secondary':
        return [baseStyle, components.buttonSecondary];
      case 'success':
        return [baseStyle, components.buttonSuccess];
      case 'error':
        return [baseStyle, components.buttonError];
      default:
        return [baseStyle, components.buttonPrimary];
    }
  };

  const getTextStyle = () => {
    const baseStyle = components.buttonText;
    switch (variant) {
      case 'secondary':
        return [baseStyle, components.buttonTextSecondary];
      case 'success':
        return [baseStyle, components.buttonTextSuccess];
      case 'error':
        return [baseStyle, components.buttonTextError];
      default:
        return [baseStyle, components.buttonTextPrimary];
    }
  };

  const content = loading ? (
    <ActivityIndicator 
      color={variant === 'secondary' ? colors.primary[500] : colors.white} 
      size="small" 
    />
  ) : (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center',
      flex: 1
    }}>
      {icon && <View style={{ marginRight: title && title.trim() ? 8 : 0 }}>{icon}</View>}
      {children || (title && title.trim() && (
        <Text style={[getTextStyle(), disabled && components.buttonTextDisabled, textStyle]}>
          {title}
        </Text>
      ))}
    </View>
  );

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && components.buttonDisabled,
        pointerEvents && { pointerEvents },
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};