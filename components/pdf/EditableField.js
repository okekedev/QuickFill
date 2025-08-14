// components/pdf/EditableField.js
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
  const [wasDragged, setWasDragged] = useState(false);

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
      x: e.clientX || e.pageX,
      y: e.clientY || e.pageY
    };
  }, []);

  const handleFieldPress = useCallback((e) => {
    if (e) {
      e.stopPropagation();
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
    
    // If selected and not editing, check for double-click to start editing
    if (isSelected) {
      const now = Date.now();
      const lastClick = fieldRef.current?.lastClick || 0;
      if (now - lastClick < 300) {
        // Double-click detected - start editing
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
    if (e) {
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
    if (e) {
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
    if (e) {
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
    if (e) {
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
          className="hide-scrollbars"
          style={{
            fontSize: Math.max(8, (field.fontSize || 11) * scale),
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
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          multiline={true}
          autoFocus
        />
      );
    }

    switch (field.type) {
      case 'text':
        return (
          <div
            style={{
              fontSize: Math.max(8, (field.fontSize || 11) * scale),
              color: field.color || '#000000',
              padding: 4,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: field.content ? 'flex-start' : 'center',
              justifyContent: 'flex-start',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden'
            }}
          >
{field.content || 'Text Field'}
          </div>
        );
        
      case 'signature':
        return field.content ? (
          <img 
            src={field.content} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              pointerEvents: 'none'
            }} 
            alt="Signature"
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
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {field.content || new Date().toLocaleDateString()}
          </Text>
        );
        
      case 'checkbox':
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
                fontSize: 11,
                fontWeight: 'bold',
                userSelect: 'none'
              }}>
                X
              </span>
            )}
          </div>
        );
        
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

  const fieldStyle = {
    position: 'absolute',
    left: field.x * scale,
    top: field.y * scale,
    width: field.width * scale,
    height: field.height * scale,
    border: isSelected ? `2px solid ${colors.primary[500]}` : '2px solid transparent',
    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: field.type === 'checkbox' ? 'center' : 'flex-start',
    ...style
  };

  return (
    <div
      ref={fieldRef}
      style={fieldStyle}
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
});