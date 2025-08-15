// components/pdf/EditableField.js
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Image, PanResponder } from 'react-native';
import { components, colors, layout } from '../../styles';

export const EditableField = React.memo(({ 
  field, 
  isSelected, 
  isEditing,
  scale = 1,
  pdfDimensions,
  containerOffset = { x: 0, y: 0 },
  pdfZoom = 1,
  onSelect, 
  onUpdate,
  onEditStart,
  onEditEnd,
  onDelete,
  style 
}) => {
  const fieldRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [tempValue, setTempValue] = useState(field.content || '');
  const [wasDragged, setWasDragged] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState(null);
  
  // Simple touch handling for mobile drag
  const handleTouchStart = useCallback((e) => {
    if (isEditing) return;
    
    // Prevent event bubbling to parent container
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    console.log('Touch start on field', field.id);
    const pos = getEventPos(e);
    setIsDragging(true);
    setDragStart(pos);
    setStartPosition({ x: field.x, y: field.y });
    setWasDragged(false);
    setTouchStartTime(Date.now());
    onSelect?.(field.id);
    
    // Start long press timer for editing (only for text fields and if already selected)
    if (field.type === 'text' && isSelected) {
      const timer = setTimeout(() => {
        console.log('Long press detected - starting edit');
        onEditStart?.(field.id);
      }, 800); // 800ms long press
      setLongPressTimer(timer);
    }
  }, [field.id, field.x, field.y, field.type, isEditing, isSelected, getEventPos, onSelect, onEditStart]);
  
  const handleTouchMove = useCallback((e) => {
    if (!isDragging || isEditing) return;
    
    // Prevent event bubbling to parent container
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    // Clear long press timer when moving
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    const pos = getEventPos(e);
    const deltaX = (pos.x - dragStart.x) / scale;
    const deltaY = (pos.y - dragStart.y) / scale;
    
    // Only start dragging if moved more than threshold
    if ((Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
      setWasDragged(true);
      
      const newX = Math.max(0, startPosition.x + deltaX);
      const newY = Math.max(0, startPosition.y + deltaY);
      
      console.log('Touch move: Moving field to', newX, newY);
      onUpdate?.(field.id, { x: newX, y: newY });
    }
  }, [isDragging, isEditing, dragStart, startPosition, scale, field.id, onUpdate, getEventPos, longPressTimer]);
  
  const handleTouchEnd = useCallback((e) => {
    // Prevent event bubbling to parent container
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    console.log('Touch end - was dragged:', wasDragged);
    setIsDragging(false);
    setIsResizing(false);
  }, [wasDragged, longPressTimer]);

  // Update temp value when field content changes
  useEffect(() => {
    setTempValue(field.content || '');
  }, [field.content]);

  const getEventPos = useCallback((e) => {
    if (Platform.OS === 'web') {
      if (e.touches) {
        return {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
      return {
        x: e.clientX || e.pageX,
        y: e.clientY || e.pageY
      };
    } else {
      // Mobile - use nativeEvent touch coordinates
      if (e.nativeEvent && e.nativeEvent.touches && e.nativeEvent.touches.length > 0) {
        return {
          x: e.nativeEvent.touches[0].pageX,
          y: e.nativeEvent.touches[0].pageY
        };
      } else if (e.nativeEvent) {
        return {
          x: e.nativeEvent.pageX || e.nativeEvent.locationX || 0,
          y: e.nativeEvent.pageY || e.nativeEvent.locationY || 0
        };
      }
      return { x: 0, y: 0 };
    }
  }, []);

  const handleFieldPress = useCallback((e) => {
    // Always prevent event bubbling to parent container
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (Platform.OS === 'web' && e && e.preventDefault) {
      e.preventDefault();
    }
    
    // If we just finished dragging, don't process clicks
    if (wasDragged) {
      setWasDragged(false);
      return;
    }
    
    // If already editing, do nothing
    if (isEditing) {
      return;
    }
    
    // If selected and not editing, check for double-tap to start editing
    if (isSelected) {
      const now = Date.now();
      const lastClick = fieldRef.current?.lastClick || 0;
      console.log('Field selected - checking for double tap. Time since last:', now - lastClick);
      if (now - lastClick < 500) { // Increased time for mobile
        // Double-tap detected - start editing
        console.log('Double-tap detected, starting edit for field:', field.id);
        onEditStart?.(field.id);
      }
      if (fieldRef.current) {
        fieldRef.current.lastClick = now;
      }
      return;
    }
    
    // If not selected, select it
    onSelect?.(field.id);
  }, [field.id, isSelected, isEditing, onSelect, onEditStart, wasDragged]);

  const handleDragStart = useCallback((e) => {
    if (isEditing) return;
    if (Platform.OS === 'web' && e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const pos = getEventPos(e);
    setIsDragging(true);
    setDragStart(pos);
    setStartPosition({ x: field.x, y: field.y });
    setWasDragged(false); // Reset drag flag
    onSelect?.(field.id);
  }, [field.x, field.y, field.id, isEditing, getEventPos, onSelect]);

  const handleResizeStart = useCallback((e) => {
    if (isEditing) return;
    if (Platform.OS === 'web' && e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const pos = getEventPos(e);
    setIsResizing(true);
    setDragStart(pos);
    setStartSize({ width: field.width, height: field.height });
    onSelect?.(field.id);
  }, [field.width, field.height, field.id, isEditing, getEventPos, onSelect]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging && !isResizing) return;
    if (Platform.OS === 'web' && e) {
      e.preventDefault();
    }
    
    const pos = getEventPos(e);
    const deltaX = (pos.x - dragStart.x) / scale;
    const deltaY = (pos.y - dragStart.y) / scale;
    
    // If we've moved more than a few pixels, mark as dragged
    if ((Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
      setWasDragged(true);
    }
    
    if (isDragging) {
      const newX = Math.max(0, startPosition.x + deltaX);
      const newY = Math.max(0, startPosition.y + deltaY);
      
      onUpdate?.(field.id, { x: newX, y: newY });
    } else if (isResizing) {
      const newWidth = Math.max(20, startSize.width + deltaX);
      const newHeight = Math.max(20, startSize.height + deltaY);
      
      onUpdate?.(field.id, { width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dragStart, startPosition, startSize, scale, field.id, onUpdate, getEventPos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Only attach mouse/touch events on web platform
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    if (isDragging || isResizing) {
      const handleMove = (e) => handleMouseMove(e);
      const handleUp = () => handleMouseUp();
      
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleTextSubmit = useCallback(() => {
    // Calculate new height based on content (in unscaled coordinates)
    const lines = tempValue.split('\n').length;
    const lineHeight = (field.fontSize || 11) * 1.2;
    const newHeight = Math.max(24, lines * lineHeight + 8); // 8px for padding
    
    onUpdate?.(field.id, { 
      content: tempValue, 
      height: newHeight 
    });
    onEditEnd?.(null);
  }, [field.id, tempValue, onUpdate, onEditEnd, field.fontSize]);

  const handleTextCancel = useCallback(() => {
    setTempValue(field.content || '');
    onEditEnd?.(null);
  }, [field.content, onEditEnd]);

  const handleCheckboxToggle = useCallback((e) => {
    if (Platform.OS === 'web' && e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Double click detection for checkbox
    const now = Date.now();
    const lastClick = fieldRef.current?.lastCheckboxClick || 0;
    if (now - lastClick < 300) {
      onUpdate?.(field.id, { content: !field.content });
    }
    if (fieldRef.current) {
      fieldRef.current.lastCheckboxClick = now;
    }
  }, [field.id, field.content, onUpdate]);

  const renderFieldContent = () => {
    if (isEditing && field.type === 'text') {
      if (Platform.OS === 'web') {
        return (
          <TextInput
            value={tempValue}
            onChangeText={(text) => {
              setTempValue(text);
              // Auto-expand height while typing
              const lines = text.split('\n').length;
              const lineHeight = (field.fontSize || 11) * 1.2;
              const newHeight = Math.max(24, lines * lineHeight + 8);
              if (newHeight !== field.height) {
                onUpdate?.(field.id, { height: newHeight });
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Escape') {
                handleTextCancel();
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTextSubmit();
              }
            }}
            onBlur={handleTextSubmit}
            style={{
              fontSize: Math.max(8, (field.fontSize || 11) * scale),
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: field.color || '#000000',
              padding: 4,
              margin: 0,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              width: '100%',
              height: '100%',
              resize: 'none',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
              lineHeight: 1.4
            }}
            multiline={true}
            autoFocus
          />
        );
      } else {
        return (
          <TextInput
            value={tempValue}
            onChangeText={(text) => {
              setTempValue(text);
              // Auto-expand height while typing
              const lines = text.split('\n').length;
              const lineHeight = (field.fontSize || 11) * 1.2;
              const newHeight = Math.max(24, lines * lineHeight + 8);
              if (newHeight !== field.height) {
                onUpdate?.(field.id, { height: newHeight });
              }
            }}
            onBlur={handleTextSubmit}
            style={{
              fontSize: Math.max(8, (field.fontSize || 11) * scale),
              color: field.color || '#000000',
              padding: 4,
              margin: 0,
              backgroundColor: 'transparent',
              width: '100%',
              height: '100%',
              textAlignVertical: 'top',
              lineHeight: (field.fontSize || 11) * scale * 1.4
            }}
            multiline={true}
            autoFocus={false}
            blurOnSubmit={false}
          />
        );
      }
    }

    switch (field.type) {
      case 'text':
        if (Platform.OS === 'web') {
          return (
            <div
              style={{
                fontSize: Math.max(8, (field.fontSize || 11) * scale),
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                color: field.color || '#000000',
                padding: 4,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: field.content ? 'flex-start' : 'center',
                justifyContent: 'flex-start',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
                lineHeight: 1.4
              }}
            >
              {field.content || 'Text Field'}
            </div>
          );
        } else {
          return (
            <Text
              style={{
                fontSize: Math.max(8, (field.fontSize || 11) * scale),
                color: field.color || '#000000',
                padding: 4,
                width: '100%',
                height: '100%',
                textAlignVertical: 'top',
                lineHeight: (field.fontSize || 11) * scale * 1.4
              }}
            >
              {field.content || 'Text Field'}
            </Text>
          );
        }
        
      case 'signature':
        return field.content ? (
          <Image 
            source={{ uri: field.content }}
            style={{ 
              width: '100%', 
              height: '100%',
              resizeMode: 'contain'
            }}
          />
        ) : (
          <Text style={{
            fontSize: Math.max(8, 10 * scale),
            color: '#666',
            padding: 4,
            textAlign: 'center'
          }}>
            Signature
          </Text>
        );
        
      case 'date':
        return (
          <Text 
            style={{
              fontSize: Math.max(8, (field.fontSize || 12) * scale),
              color: field.color || '#000000',
              padding: 4,
              width: '100%',
              height: '100%',
              textAlignVertical: 'center'
            }}
          >
            {field.content || new Date().toLocaleDateString()}
          </Text>
        );
        
      case 'checkbox':
        if (Platform.OS === 'web') {
          return (
            <div
              onClick={handleCheckboxToggle}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              {field.content && (
                <span style={{ 
                  color: '#000000', 
                  fontSize: Math.min(field.width * 0.8, 16) * scale,
                  fontWeight: 'bold',
                  userSelect: 'none'
                }}>
                  ✓
                </span>
              )}
            </div>
          );
        } else {
          return (
            <TouchableOpacity
              onPress={handleCheckboxToggle}
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {field.content && (
                <Text style={{ 
                  color: '#000000', 
                  fontSize: Math.min(field.width * 0.8, 16) * scale,
                  fontWeight: 'bold'
                }}>
                  ✓
                </Text>
              )}
            </TouchableOpacity>
          );
        }
        
      default:
        return (
          <Text style={{
            fontSize: Math.max(8, 10 * scale),
            color: '#666',
            padding: 4
          }}>
            {field.type}
          </Text>
        );
    }
  };

  // Calculate proper positioning based on platform and container
  const getFieldPosition = () => {
    // Use consistent scaling for both platforms
    return {
      left: field.x * scale + containerOffset.x,
      top: field.y * scale + containerOffset.y,
      width: field.width * scale,
      height: field.height * scale
    };
  };
  
  const position = getFieldPosition();
  
  const fieldStyle = {
    position: 'absolute',
    ...position,
    borderWidth: 2,
    borderColor: isSelected ? colors.primary[500] : 'transparent',
    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    justifyContent: field.type === 'checkbox' ? 'center' : 'flex-start',
    alignItems: field.type === 'checkbox' ? 'center' : 'flex-start',
    zIndex: 1000, // Ensure fields are above PDF
    elevation: 10, // For Android
    ...style
  };

  if (Platform.OS === 'web') {
    return (
      <div
        ref={fieldRef}
        style={{
          ...fieldStyle,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          display: 'flex'
        }}
        onMouseDown={isEditing ? undefined : handleDragStart}
        onTouchStart={isEditing ? undefined : handleDragStart}
        onClick={handleFieldPress}
      >
        {renderFieldContent()}
        
        {/* Resize handle - only show when selected and not editing */}
        {isSelected && !isEditing && (
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 12,
              height: 12,
              backgroundColor: colors.primary[500],
              borderRadius: 6,
              cursor: 'se-resize',
              border: '1px solid white'
            }}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
          />
        )}
        
        {/* Delete button - only show when selected and not editing */}
        {isSelected && !isEditing && (
          <div
            style={{
              position: 'absolute',
              top: -8,
              left: '100%',
              marginLeft: 4,
              width: 16,
              height: 16,
              backgroundColor: colors.error[500],
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid white',
              cursor: 'pointer',
              color: 'white',
              fontSize: 12,
              fontWeight: 'bold',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              zIndex: 10
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(field.id);
            }}
          >
            ×
          </div>
        )}
      </div>
    );
  } else {
    return (
      <View 
        style={fieldStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <TouchableOpacity 
          style={{ 
            flex: 1,
            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
          }}
          onPress={(e) => {
            console.log('TouchableOpacity pressed for field:', field.id, 'isSelected:', isSelected, 'type:', field.type);
            handleFieldPress(e);
          }}
          onLongPress={() => {
            console.log('Long press detected on TouchableOpacity for field:', field.id);
            if (field.type === 'text' && isSelected) {
              onEditStart?.(field.id);
            }
          }}
          delayLongPress={600}
          activeOpacity={0.9}
          delayPressIn={0}
          delayPressOut={0}
        >
          {renderFieldContent()}
        </TouchableOpacity>
        
        {/* Resize handle - only show when selected and not editing */}
        {isSelected && !isEditing && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 12,
              height: 12,
              backgroundColor: colors.primary[500],
              borderRadius: 6,
              borderWidth: 1,
              borderColor: 'white'
            }}
            onPressIn={handleResizeStart}
          />
        )}
        
        {/* Edit button for text fields - only show when selected and not editing */}
        {isSelected && !isEditing && field.type === 'text' && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 20,
              height: 20,
              backgroundColor: colors.primary[500],
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'white'
            }}
            onPress={() => {
              console.log('Edit button pressed for field:', field.id);
              onEditStart?.(field.id);
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 10,
              fontWeight: 'bold'
            }}>
              ✎
            </Text>
          </TouchableOpacity>
        )}

        {/* Delete button - only show when selected and not editing */}
        {isSelected && !isEditing && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: -8,
              left: '100%',
              marginLeft: 4,
              width: 16,
              height: 16,
              backgroundColor: colors.error[500],
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'white'
            }}
            onPress={() => onDelete?.(field.id)}
          >
            <Text style={{
              color: 'white',
              fontSize: 12,
              fontWeight: 'bold'
            }}>
              ×
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
});