import React, { useState, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { CheckIcon, CloseIcon } from '../../icons';
import { components, colors, layout } from '../../styles';

export const Toast = React.memo(({ 
  visible, 
  message, 
  type = 'success', 
  duration = 3000,
  onHide 
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false
        })
      ]).start();

      // Auto hide after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: false
      })
    ]).start(() => {
      onHide?.();
    });
  };

  if (!visible && fadeAnim._value === 0) {
    return null;
  }

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success[50],
          borderColor: colors.success[200],
          iconColor: colors.success[600]
        };
      case 'error':
        return {
          backgroundColor: colors.error[50],
          borderColor: colors.error[200],
          iconColor: colors.error[600]
        };
      case 'warning':
        return {
          backgroundColor: colors.warning[50],
          borderColor: colors.warning[200],
          iconColor: colors.warning[600]
        };
      case 'info':
      default:
        return {
          backgroundColor: colors.primary[50],
          borderColor: colors.primary[200],
          iconColor: colors.primary[600]
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckIcon size={20} color={getToastStyle().iconColor} />;
      case 'error':
        return <CloseIcon size={20} color={getToastStyle().iconColor} />;
      default:
        return <CheckIcon size={20} color={getToastStyle().iconColor} />;
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View 
      style={[
        {
          position: 'fixed',
          top: 20,
          right: 20,
          left: 20,
          zIndex: 9999,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          maxWidth: 400,
          alignSelf: 'center'
        }
      ]}
    >
      <View 
        style={[
          {
            backgroundColor: toastStyle.backgroundColor,
            borderWidth: 1,
            borderColor: toastStyle.borderColor,
            borderRadius: 8,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          },
          layout.row,
          { alignItems: 'center' }
        ]}
      >
        <View style={{ marginRight: 12 }}>
          {getIcon()}
        </View>
        <Text 
          style={[
            components.bodyText,
            { 
              flex: 1,
              color: colors.text.primary,
              fontSize: 14
            }
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
});

// Toast Context Provider
const ToastContext = React.createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, duration, visible: true });
  };

  const hideToast = () => {
    setToast(prev => prev ? { ...prev, visible: false } : null);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={() => setToast(null)}
        />
      )}
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};