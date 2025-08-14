import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { components, colors, layout } from '../../styles';

export const EditableField = React.memo(({ 
  field, 
  isSelected, 
  isEditing,
  scale = 1,
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

  // Update temp value when field content changes
  useEffect(() => {
    setTempValue(field.content || '');
  }, [field.content]);

  const getEventPos = useCallback((e) => {
    if (e.touches) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
    return {
      x: e.clientX,
      y: e.clientY
    };
  }, []);

  const handleFieldPress = useCallback((e) => {
    e.stopPropagation();
    onSelect?.(field.id);
    
    // Double tap/click to edit
    if (isSelected && !isEditing) {
      const now = Date.now();
      const lastTap = fieldRef.current?.lastTap || 0;
      if (now - lastTap < 300) {
        onEditStart?.(field.id);
      }
      fieldRef.current.lastTap = now;
    }
  }, [field.id, isSelected, isEditing, onSelect, onEditStart]);

  const handleDragStart = useCallback((e) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    
    const pos = getEventPos(e);
    setIsDragging(true);
    setDragStart(pos);
    setStartPosition({ x: field.x, y: field.y });
    onSelect?.(field.id);
  }, [field.x, field.y, field.id, isEditing, getEventPos, onSelect]);

  const handleResizeStart = useCallback((e) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    
    const pos = getEventPos(e);
    setIsResizing(true);
    setDragStart(pos);
    setStartSize({ width: field.width, height: field.height });
    onSelect?.(field.id);
  }, [field.width, field.height, field.id, isEditing, getEventPos, onSelect]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging && !isResizing) return;
    e.preventDefault();
    
    const pos = getEventPos(e);
    const deltaX = (pos.x - dragStart.x) / scale;
    const deltaY = (pos.y - dragStart.y) / scale;
    
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

  useEffect(() => {
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
    onUpdate?.(field.id, { content: tempValue });
    onEditEnd?.(field.id);
  }, [field.id, tempValue, onUpdate, onEditEnd]);

  const handleTextCancel = useCallback(() => {
    setTempValue(field.content || '');
    onEditEnd?.(field.id);
  }, [field.id, field.content, onEditEnd]);

  const handleCheckboxToggle = useCallback(() => {
    onUpdate?.(field.id, { content: !field.content });
  }, [field.id, field.content, onUpdate]);

  const renderFieldContent = () => {
    if (isEditing && field.type === 'text') {
      return (
        <View style={{ flex: 1 }}>
          <TextInput
            value={tempValue}
            onChangeText={setTempValue}
            onBlur={handleTextSubmit}
            onSubmitEditing={handleTextSubmit}
            style={[
              components.input,
              {
                fontSize: Math.max(8, field.fontSize * scale),
                color: field.color || '#000000',
                padding: 4,
                margin: 0,
                minHeight: 'auto',
                height: '100%',
                textAlignVertical: 'center'
              }
            ]}
            multiline={field.height > 30}
            autoFocus
          />
        </View>
      );
    }

    switch (field.type) {
      case 'text':
        return (
          <Text 
            style={[
              components.pdfFieldText,
              {
                fontSize: Math.max(8, field.fontSize * scale),
                color: field.color || '#000000',
                textAlign: 'left'
              }
            ]}
            numberOfLines={field.height > 30 ? undefined : 1}
          >
            {field.content || 'Text Field'}
          </Text>
        );
        
      case 'signature':
        return field.content ? (
          <img 
            src={field.content} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' 
            }} 
            alt="Signature"
          />
        ) : (
          <Text style={[components.pdfFieldText, { fontSize: Math.max(8, 10 * scale) }]}>
            Signature
          </Text>
        );
        
      case 'date':
        return (
          <Text 
            style={[
              components.pdfFieldText,
              { 
                fontSize: Math.max(8, field.fontSize * scale),
                color: field.color || '#000000' 
              }
            ]}
          >
            {field.content || new Date().toLocaleDateString()}
          </Text>
        );
        
      case 'checkbox':
        return (
          <TouchableOpacity 
            onPress={handleCheckboxToggle}
            style={[
              {
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: field.color || '#000000',
                backgroundColor: field.content ? field.color || '#000000' : 'transparent'
              }
            ]}
          >
            {field.content && (
              <Text style={{ 
                color: 'white', 
                fontSize: Math.max(8, 12 * scale),
                fontWeight: 'bold' 
              }}>
                ✓
              </Text>
            )}
          </TouchableOpacity>
        );
        
      default:
        return (
          <Text style={[components.pdfFieldText, { fontSize: Math.max(8, 10 * scale) }]}>
            {field.type}
          </Text>
        );
    }
  };

  const fieldStyle = {
    position: 'absolute',
    left: field.x * scale,
    top: field.y * scale,
    width: field.width * scale,
    height: field.height * scale,
    borderWidth: isSelected ? 2 : 1,
    borderColor: isSelected ? colors.primary[500] : 'rgba(0, 0, 0, 0.3)',
    borderStyle: isEditing ? 'solid' : 'dashed',
    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.8)',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    ...style
  };

  return (
    <View
      ref={fieldRef}
      style={fieldStyle}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      <TouchableOpacity
        style={{ flex: 1, padding: 2 }}
        onPress={handleFieldPress}
        activeOpacity={0.8}
      >
        {renderFieldContent()}
      </TouchableOpacity>
      
      {/* Resize handle - only show when selected and not editing */}
      {isSelected && !isEditing && (
        <View
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 12,
            height: 12,
            backgroundColor: colors.primary[500],
            borderRadius: 6,
            cursor: 'se-resize',
            borderWidth: 1,
            borderColor: 'white'
          }}
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        />
      )}
      
      {/* Delete button - only show when selected and not editing */}
      {isSelected && !isEditing && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 20,
            height: 20,
            backgroundColor: colors.error[500],
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'white'
          }}
          onPress={() => onDelete?.(field.id)}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});