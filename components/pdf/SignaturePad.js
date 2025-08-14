import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Button } from '../ui';
import { components, layout } from '../../styles';

export const SignaturePad = React.memo(({ onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    canvas.width = 400;
    canvas.height = 200;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getEventPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Account for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getEventPos(e);
    setLastPos(pos);
  }, [getEventPos]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentPos = getEventPos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
    
    setLastPos(currentPos);
  }, [isDrawing, lastPos, getEventPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL);
  }, [onSave]);

  useEffect(() => {
    if (isDrawing) {
      const handleMouseMove = (e) => draw(e);
      const handleMouseUp = () => stopDrawing();
      const handleTouchMove = (e) => draw(e);
      const handleTouchEnd = () => stopDrawing();

      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDrawing, draw, stopDrawing]);

  return (
    <View style={[{ padding: 24, backgroundColor: 'white' }]}>
      <View style={[layout.column, { alignItems: 'center' }]}>
        <Text style={[components.heading3, { textAlign: 'center', marginBottom: 16 }]}>
          Draw Your Signature
        </Text>
        
        <View style={{
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderRadius: 8,
          backgroundColor: '#f9fafb',
          marginBottom: 20
        }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onTouchStart={startDrawing}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              cursor: 'crosshair',
              borderRadius: 8,
              touchAction: 'none'
            }}
          />
        </View>
        
        <View style={[layout.row, layout.spaceBetween, { width: '100%' }]}>
          <Button 
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            style={[{ flex: 1 }, layout.mx2]}
          />
          
          <Button 
            title="Clear"
            variant="secondary"
            onPress={clearSignature}
            style={[{ flex: 1 }, layout.mx2]}
          />
          
          <Button 
            title="Save"
            onPress={saveSignature}
            style={[{ flex: 1 }, layout.mx2]}
          />
        </View>
      </View>
    </View>
  );
});