// components/PDFEditor/EditableField.js - Fixed drag functionality and styling
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  PanResponder,
  Image,
  Dimensions
} from 'react-native';
import { editableFieldStyles } from './PDFEditorStyles';
import { colors } from '../../styles/AppStyles';

const EditableField = ({
  object,
  scale,
  selected,
  editing,
  onUpdate,
  onSelect,
  onStartEdit,
  onFinishEdit
}) => {
  const [value, setValue] = useState(object.content || '');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    setValue(object.content || '');
  }, [object.content]);

  // Pan responder for drag functionality
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only allow dragging if field is selected and not editing
        return selected && !editing && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5);
      },
      
      onPanResponderGrant: (evt, gestureState) => {
        setIsDragging(true);
        // Calculate offset from touch point to field origin
        setDragOffset({
          x: gestureState.x0 - (object.x * scale),
          y: gestureState.y0 - (object.y * scale)
        });
      },
      
      onPanResponderMove: (evt, gestureState) => {
        if (!selected || editing) return;
        
        // Calculate new position accounting for drag offset and scale
        const newX = (gestureState.moveX - dragOffset.x) / scale;
        const newY = (gestureState.moveY - dragOffset.y) / scale;
        
        // Constrain to screen bounds
        const maxX = (screenWidth - object.width * scale) / scale;
        const maxY = (screenHeight - object.height * scale) / scale;
        
        const constrainedX = Math.max(0, Math.min(maxX, newX));
        const constrainedY = Math.max(0, Math.min(maxY, newY));
        
        onUpdate(object.id, { 
          x: constrainedX, 
          y: constrainedY 
        });
      },
      
      onPanResponderRelease: () => {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
      },
      
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
      },
    })
  ).current;

  const handleTap = () => {
    if (isDragging) return; // Don't handle tap if we were dragging
    
    onSelect(object.id);
    if (object.type === 'checkbox') {
      const newValue = !Boolean(value);
      setValue(newValue);
      onUpdate(object.id, { content: newValue });
    } else if (object.type === 'signature' && !object.content) {
      onStartEdit(object.id);
    }
  };

  const handleDoubleTap = () => {
    if (object.type !== 'checkbox' && object.type !== 'signature') {
      onStartEdit(object.id);
    }
  };

  const handleContentChange = (newValue) => {
    setValue(newValue);
    onUpdate(object.id, { content: newValue });
  };

  const renderContent = () => {
    if (object.type === 'checkbox') {
      return (
        <View style={editableFieldStyles.checkboxContainer}>
          <Text style={[
            editableFieldStyles.checkboxText, 
            { 
              fontSize: object.fontSize * scale, 
              color: Boolean(value) ? colors.iosBlue : '#000000'
            }
          ]}>
            {Boolean(value) ? '✓' : ''}
          </Text>
        </View>
      );
    }
    
    if (object.type === 'signature' && object.content) {
      return (
        <Image 
          source={{ uri: object.content }}
          style={editableFieldStyles.signatureImage}
          resizeMode="contain"
        />
      );
    }
    
    if (editing && (object.type === 'text' || object.type === 'date' || object.type === 'timestamp')) {
      return (
        <TextInput
          style={[
            editableFieldStyles.fieldInput, 
            { 
              fontSize: object.fontSize * scale,
              color: '#000000' // Black text by default
            }
          ]}
          value={value}
          onChangeText={handleContentChange}
          onBlur={onFinishEdit}
          autoFocus
          multiline={object.type === 'text'}
          placeholder={`Enter ${object.type}...`}
          placeholderTextColor="#999999"
        />
      );
    }
    
    // Display mode
    return (
      <Text style={[
        editableFieldStyles.fieldText, 
        { 
          fontSize: object.fontSize * scale,
          color: object.type === 'signature' && !object.content ? 
            '#999999' : // Gray placeholder for signature
            '#000000'   // Black text by default
        }
      ]}>
        {object.type === 'signature' && !object.content ? 
          'Tap to sign' : 
          value || `[${object.type}]`
        }
      </Text>
    );
  };

  const fieldStyle = {
    position: 'absolute',
    left: object.x * scale,
    top: object.y * scale,
    width: object.width * scale,
    height: object.height * scale,
    borderWidth: selected ? 2 : 0,
    borderColor: selected ? colors.iosBlue : 'transparent',
    borderStyle: selected ? 'dashed' : 'solid',
    backgroundColor: 'transparent', // No background
    borderRadius: 4,
    zIndex: selected ? 1000 : 100,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <View 
      style={fieldStyle}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={editableFieldStyles.fieldTouchable}
        onPress={handleTap}
        onLongPress={handleDoubleTap}
        activeOpacity={0.8}
        disabled={isDragging} // Disable touch when dragging
      >
        {renderContent()}
      </TouchableOpacity>
      
      {selected && !editing && (
        <TouchableOpacity
          style={editableFieldStyles.resizeHandle}
          onPressIn={(e) => {
            console.log('Resize handle pressed');
            // TODO: Implement resize functionality
          }}
        >
          <View style={editableFieldStyles.resizeHandleIndicator} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EditableField;