// App.js - QuickSign with Heroicons
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

// Suppress development warnings
if (__DEV__ && Platform.OS === 'web') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    if (typeof args[0] === 'string') {
      if (args[0].includes('useNativeDriver') || 
          args[0].includes('numberOfLines') || 
          args[0].includes('pointerEvents is deprecated')) {
        return;
      }
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    if (typeof args[0] === 'string') {
      if (args[0].includes('message channel closed') ||
          args[0].includes('asynchronous response') ||
          args[0].includes('runtime.lastError')) {
        return;
      }
    }
    originalError.apply(console, args);
  };
}

import "./global.css";
import { GluestackUIProvider } from "./components/ui/gluestack-ui-provider";
import { StatusBar } from 'expo-status-bar';

// Heroicons via CDN (since we can't install packages)
// We'll create SVG components for the icons we need
const HeroIcon = ({ path, className = "w-6 h-6", ...props }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

// Heroicon paths
const icons = {
  upload: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
  documentText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  pencil: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  checkSquare: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  download: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  zoomIn: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7",
  zoomOut: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7",
  chevronLeft: "M15 19l-7-7 7-7",
  chevronRight: "M9 5l7 7-7 7",
  x: "M6 18L18 6M6 6l12 12",
  check: "M5 13l4 4L19 7",
  lightning: "M13 10V3L4 14h7v7l9-11h-7z"
};

// Import Gluestack UI components
import { Box } from './components/ui/box';
import { VStack } from './components/ui/vstack';
import { HStack } from './components/ui/hstack';
import { Text } from './components/ui/text';
import { Heading } from './components/ui/heading';
import { Button, ButtonText } from './components/ui/button';
import { Card } from './components/ui/card';
import { ScrollView } from './components/ui/scroll-view';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalCloseButton, ModalBody } from './components/ui/modal';
import { Badge, BadgeText } from './components/ui/badge';
import { Center } from './components/ui/center';
import { Spinner } from './components/ui/spinner';
import { Pressable } from './components/ui/pressable';
import { Toast, ToastDescription, useToast } from './components/ui/toast';

// Universal file reading
const readFileAsBase64 = (fileAsset) => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      if (fileAsset.uri) {
        fetch(fileAsset.uri)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
          .catch(reject);
      } else if (fileAsset.file) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileAsset.file);
      } else {
        reject(new Error('No valid file or URI found'));
      }
    } else {
      if (fileAsset.uri && fileAsset.uri.startsWith('data:')) {
        const base64 = fileAsset.uri.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('File format not supported on this platform'));
      }
    }
  });
};

// PDF Editor Hook (simplified)
function usePDFEditor(pdfBase64) {
  const canvasRef = useRef(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // PDF Loading Effect
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (pdfBase64 && !pdfDocument && !pdfLoaded && !pdfError) {
        const timeoutId = setTimeout(async () => {
          if (!pdfBase64 || pdfLoaded) return;
          
          try {
            setIsRendering(true);
            setPdfError(null);
            
            if (!window.pdfjsLib) {
              await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.onload = () => {
                  if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    resolve();
                  } else {
                    reject(new Error('PDF.js failed to load'));
                  }
                };
                script.onerror = () => reject(new Error('Failed to load PDF.js'));
                document.head.appendChild(script);
              });
            }
            
            const pdfSource = `data:application/pdf;base64,${pdfBase64}`;
            const loadingTask = window.pdfjsLib.getDocument(pdfSource);
            const pdfDoc = await loadingTask.promise;
            
            setPdfDocument(pdfDoc);
            setTotalPages(pdfDoc.numPages);
            setPdfLoaded(true);
            
          } catch (error) {
            console.error('PDF loading failed:', error);
            setPdfError(error.message || 'Failed to load PDF');
          } finally {
            setIsRendering(false);
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [pdfBase64, pdfDocument, pdfLoaded, pdfError]);

  // PDF Rendering Effect - Restored to working version
  useEffect(() => {
    if (!pdfDocument || !pdfLoaded || !canvasRef.current) return;
    
    let timeoutId;
    let isCancelled = false;
    
    const renderPage = async () => {
      if (isCancelled) return;
      
      try {
        setIsRendering(true);
        
        const page = await pdfDocument.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas || isCancelled) return;
        
        const context = canvas.getContext('2d');
        
        // Standard quality rendering
        const devicePixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * devicePixelRatio });
        
        // Set actual canvas size for high DPI
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Scale canvas back down using CSS for crisp display
        canvas.style.width = `${viewport.width / devicePixelRatio}px`;
        canvas.style.height = `${viewport.height / devicePixelRatio}px`;
        
        // Scale the drawing context to match device pixel ratio
        context.scale(devicePixelRatio, devicePixelRatio);
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        const renderContext = {
          canvasContext: context,
          viewport: page.getViewport({ scale }) // Use original scale for rendering context
        };
        
        await page.render(renderContext).promise;
        
      } catch (error) {
        if (!isCancelled) {
          console.error('Page rendering failed:', error);
          setPdfError('Failed to render PDF page');
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    timeoutId = setTimeout(renderPage, 100);
    
    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pdfDocument, currentPage, scale, pdfLoaded]);

  const getViewportCenter = useCallback(() => {
    if (!canvasRef.current) return { x: 100, y: 100 };
    
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    
    return {
      x: canvasRect.width / 2,
      y: canvasRect.height / 2
    };
  }, []);

  const addTextObject = useCallback((x, y) => {
    const center = x && y ? { x, y } : getViewportCenter();
    const id = `text_${Date.now()}`;
    const newText = {
      id,
      type: 'text',
      x: center.x / scale,
      y: center.y / scale,
      width: 200 / scale,
      height: 60 / scale,
      content: '',
      fontSize: 11,
      color: '#000000',
      page: currentPage
    };
    
    setObjects(prev => [...prev, newText]);
    setSelectedId(id);
  }, [scale, currentPage, getViewportCenter]);

  const addSignatureObject = useCallback(() => {
    return 'open_signature_modal';
  }, []);

  const addDateObject = useCallback((x, y) => {
    const center = x && y ? { x, y } : getViewportCenter();
    const id = `date_${Date.now()}`;
    const today = new Date().toLocaleDateString();
    
    const newDate = {
      id,
      type: 'date',
      x: center.x / scale,
      y: center.y / scale,
      width: 100 / scale,
      height: 24 / scale,
      content: today,
      fontSize: 11,
      color: '#000000',
      page: currentPage
    };
    
    setObjects(prev => [...prev, newDate]);
    setSelectedId(id);
  }, [scale, currentPage, getViewportCenter]);

  const addCheckboxObject = useCallback((x, y) => {
    const center = x && y ? { x, y } : getViewportCenter();
    const id = `checkbox_${Date.now()}`;
    const newCheckbox = {
      id,
      type: 'checkbox',
      x: center.x / scale,
      y: center.y / scale,
      width: 30 / scale,
      height: 30 / scale,
      content: true,
      fontSize: 16,
      color: '#000000',
      page: currentPage
    };
    
    setObjects(prev => [...prev, newCheckbox]);
    setSelectedId(id);
  }, [scale, currentPage, getViewportCenter]);

  const updateObject = useCallback((id, updates) => {
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []);

  const deleteObject = useCallback((id) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    setSelectedId(prev => prev === id ? null : prev);
    setEditingId(prev => prev === id ? null : prev);
  }, []);

  const clearAllObjects = useCallback(() => {
    setObjects([]);
    setSelectedId(null);
    setEditingId(null);
  }, []);

  return {
    canvasRef,
    pdfLoaded,
    pdfError,
    currentPage,
    setCurrentPage,
    totalPages,
    scale,
    setScale,
    objects,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    addTextObject,
    addSignatureObject,
    addDateObject,
    addCheckboxObject,
    updateObject,
    deleteObject,
    clearAllObjects,
    isRendering,
    getViewportCenter,
    setObjects
  };
}

// Signature Drawing Component - Updated styling to match current theme
const SignaturePad = React.memo(({ onSave, onCancel }) => {
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

  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getMousePos(e);
    setLastPos(pos);
  }, [getMousePos]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentPos = getMousePos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
    
    setLastPos(currentPos);
  }, [isDrawing, lastPos, getMousePos]);

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
      document.addEventListener('mousemove', draw);
      document.addEventListener('mouseup', stopDrawing);
      
      return () => {
        document.removeEventListener('mousemove', draw);
        document.removeEventListener('mouseup', stopDrawing);
      };
    }
  }, [isDrawing, draw, stopDrawing]);

  return (
    <VStack space="lg" className="items-center p-6">
      <Heading size="lg" className="text-typography-800 font-bold text-center">
        Create Your Signature
      </Heading>
      
      {/* Canvas Container - Modern styling */}
      <Box className="w-full max-w-md">
        <Box className="w-full h-48 rounded-2xl border-2 border-outline-300 bg-white shadow-sm overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            style={{
              cursor: 'crosshair',
              display: 'block',
              width: '100%',
              height: '100%'
            }}
          />
        </Box>
        <Text className="text-center text-typography-500 text-sm mt-2 font-medium">
          Click and drag to draw your signature
        </Text>
      </Box>
      
      {/* Action Buttons - Circular style matching our theme */}
      <HStack space="lg" className="items-center justify-center">
        <Pressable
          onPress={clearSignature}
          className="items-center"
        >
          <Box className="w-12 h-12 rounded-full bg-warning-500 flex items-center justify-center mb-1 shadow-sm">
            <HeroIcon path={icons.refresh} className="w-6 h-6 text-white" />
          </Box>
          <Text className="text-xs font-medium text-typography-600">Clear</Text>
        </Pressable>
        
        <Pressable
          onPress={onCancel}
          className="items-center"
        >
          <Box className="w-12 h-12 rounded-full bg-error-500 flex items-center justify-center mb-1 shadow-sm">
            <HeroIcon path={icons.x} className="w-6 h-6 text-white" />
          </Box>
          <Text className="text-xs font-medium text-typography-600">Cancel</Text>
        </Pressable>
        
        <Pressable
          onPress={saveSignature}
          className="items-center"
        >
          <Box className="w-12 h-12 rounded-full bg-tertiary-500 flex items-center justify-center mb-1 shadow-sm">
            <HeroIcon path={icons.check} className="w-6 h-6 text-white" />
          </Box>
          <Text className="text-xs font-medium text-typography-600">Save</Text>
        </Pressable>
      </HStack>
    </VStack>
  );
});

// Smooth Editable Field Component with enhanced drag animation
const EditableField = React.memo(({ object, scale, selected, editing, onUpdate, onSelect, onStartEdit, onFinishEdit }) => {
  const [value, setValue] = useState(object.content || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

  useEffect(() => {
    setValue(object.content || '');
  }, [object.content]);

  // Enhanced field styling with smooth animations
  const fieldStyle = useMemo(() => ({
    position: 'absolute',
    left: `${object.x * scale}px`,
    top: `${object.y * scale}px`,
    width: `${object.width * scale}px`,
    height: `${object.height * scale}px`,
    fontSize: object.fontSize ? `${object.fontSize * scale}px` : `${12 * scale}px`,
    color: object.color || '#000000',
    border: selected ? '2px solid rgb(var(--color-primary-500))' : '1px solid transparent',
    backgroundColor: selected ? 'rgba(var(--color-primary-50), 0.1)' : 'rgba(255, 255, 255, 0.9)',
    borderRadius: '6px',
    padding: '4px',
    cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : (selected ? 'grab' : 'pointer'),
    zIndex: selected ? 1000 : 100,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: object.type === 'checkbox' ? 'center' : 'flex-start',
    userSelect: editing ? 'auto' : 'none',
    boxShadow: selected ? '0 4px 12px rgba(var(--color-primary-500), 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: isDragging || isResizing ? 'none' : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '500',
    willChange: isDragging || isResizing ? 'transform' : 'auto'
  }), [object, scale, selected, isDragging, editing, isResizing]);

  const handleContentChange = useCallback((e) => {
    if (object.type === 'checkbox') {
      const newValue = !object.content;
      setValue(newValue);
      onUpdate(object.id, { content: newValue });
    } else {
      const newValue = e.target.value;
      setValue(newValue);
      onUpdate(object.id, { content: newValue });
    }
  }, [object.id, object.type, object.content, onUpdate]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    const isDoubleClick = now - lastClickTime < 300;
    
    setLastClickTime(now);
    
    // Select the field first
    onSelect(object.id);
    
    if (isDoubleClick && !editing) {
      // Double click to edit
      if (object.type === 'signature') {
        onStartEdit(object.id);
      } else {
        onStartEdit(object.id);
      }
      return;
    }
    
    if (object.type === 'checkbox' && !editing) {
      // Single click toggles checkbox
      if (!isDoubleClick) {
        setTimeout(() => {
          if (Date.now() - lastClickTime >= 300) {
            handleContentChange({ target: { value: !object.content } });
          }
        }, 300);
      }
    }
    
    // Start drag operation with smooth animation
    if (!editing) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - object.x * scale,
        y: e.clientY - object.y * scale
      });
      
      // Add smooth drag class
      document.body.style.userSelect = 'none';
    }
  }, [lastClickTime, editing, object.id, object.type, object.x, object.y, scale, onSelect, onStartEdit, handleContentChange, object.content]);

  const handleResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeStart({
      width: object.width,
      height: object.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
    
    document.body.style.userSelect = 'none';
  }, [object.width, object.height]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && !editing) {
      e.preventDefault();
      
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        const newX = (e.clientX - dragStart.x) / scale;
        const newY = (e.clientY - dragStart.y) / scale;
        
        onUpdate(object.id, { 
          x: Math.max(0, newX), 
          y: Math.max(0, newY) 
        });
      });
    } else if (isResizing) {
      e.preventDefault();
      
      requestAnimationFrame(() => {
        const deltaX = e.clientX - resizeStart.mouseX;
        const deltaY = e.clientY - resizeStart.mouseY;
        
        const newWidth = Math.max(30 / scale, resizeStart.width + deltaX / scale);
        const newHeight = Math.max(20 / scale, resizeStart.height + deltaY / scale);
        
        onUpdate(object.id, { width: newWidth, height: newHeight });
      });
    }
  }, [isDragging, isResizing, editing, dragStart, resizeStart, scale, object.id, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    document.body.style.userSelect = '';
  }, []);

  // Add global mouse event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const renderFieldContent = () => {
    if (object.type === 'checkbox') {
      return (
        <div style={{ 
          fontSize: `${14 * scale}px`, 
          userSelect: 'none', 
          pointerEvents: editing ? 'none' : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          fontWeight: 'bold',
          color: object.content ? '#16a34a' : '#dc2626'
        }}>
          {object.content ? '✓' : '✗'}
        </div>
      );
    }
    
    if (object.type === 'signature') {
      if (object.content && object.content.startsWith('data:image')) {
        return (
          <img
            src={object.content}
            alt="Signature"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none'
            }}
          />
        );
      } else {
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'rgb(var(--color-typography-400))',
            fontSize: `${10 * scale}px`,
            fontStyle: 'italic',
            border: '2px dashed rgb(var(--color-outline-300))',
            borderRadius: '4px'
          }}>
            {editing ? 'Draw signature...' : 'Click to sign'}
          </div>
        );
      }
    }
    
    if (editing && object.type !== 'signature') {
      return object.type === 'text' ? (
        <textarea
          value={value}
          onChange={handleContentChange}
          onBlur={onFinishEdit}
          autoFocus
          placeholder="Enter text..."
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'transparent',
            resize: 'none',
            outline: 'none',
            fontSize: 'inherit',
            color: 'inherit',
            padding: '2px',
            fontFamily: 'inherit',
            fontWeight: 'inherit'
          }}
        />
      ) : (
        <input
          type={object.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={handleContentChange}
          onBlur={onFinishEdit}
          autoFocus
          placeholder={`Enter ${object.type}...`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 'inherit',
            color: 'inherit',
            padding: '2px',
            fontFamily: 'inherit',
            fontWeight: 'inherit'
          }}
        />
      );
    }
    
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: object.type === 'checkbox' ? 'center' : 'flex-start',
        fontWeight: 'inherit'
      }}>
        {value || `[${object.type}]`}
      </div>
    );
  };

  return (
    <div
      style={fieldStyle}
      onMouseDown={handleMouseDown}
    >
      {renderFieldContent()}
      
      {/* Smooth Resize Handle */}
      {selected && !editing && (
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            right: '-6px',
            width: '12px',
            height: '12px',
            backgroundColor: 'rgb(var(--color-primary-500))',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'se-resize',
            zIndex: 1001,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isResizing ? 'scale(1.2)' : 'scale(1)'
          }}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
});

function AppContent() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentView, setCurrentView] = useState('picker');
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingFieldId, setSigningFieldId] = useState(null);

  const toast = useToast();

  const {
    canvasRef,
    pdfLoaded,
    pdfError,
    currentPage,
    setCurrentPage,
    totalPages,
    scale,
    setScale,
    objects,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    addTextObject,
    addSignatureObject,
    addDateObject,
    addCheckboxObject,
    updateObject,
    deleteObject,
    clearAllObjects,
    isRendering,
    getViewportCenter,
    setObjects
  } = usePDFEditor(pdfBase64);

  const tools = useMemo(() => [
    { id: 'text', label: 'Text', icon: icons.documentText, action: () => addTextObject() },
    { id: 'signature', label: 'Signature', icon: icons.pencil, action: () => {
      setShowSignatureModal(true);
      setSigningFieldId('new');
    }},
    { id: 'date', label: 'Date', icon: icons.calendar, action: () => addDateObject() },
    { id: 'checkbox', label: 'Checkbox', icon: icons.checkSquare, action: () => addCheckboxObject() }
  ], [addTextObject, addDateObject, addCheckboxObject]);

  const handlePickDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        
        try {
          const base64 = await readFileAsBase64(file);
          setPdfBase64(base64);
          setCurrentView('editor');
          
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeId={id} className="bg-success-500 shadow-fb">
                <ToastDescription className="text-white font-semibold">
                  ✅ PDF loaded successfully!
                </ToastDescription>
              </Toast>
            ),
          });
          
        } catch (error) {
          console.error('File reading error:', error);
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeId={id} className="bg-error-500 shadow-fb">
                <ToastDescription className="text-white font-semibold">
                  ❌ Failed to read PDF file
                </ToastDescription>
              </Toast>
            ),
          });
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleSaveSignature = useCallback((signatureDataURL) => {
    if (signingFieldId === 'new') {
      const center = getViewportCenter();
      const id = `signature_${Date.now()}`;
      const newSignature = {
        id,
        type: 'signature',
        x: center.x / scale,
        y: center.y / scale,
        width: 200 / scale,
        height: 80 / scale,
        content: signatureDataURL,
        page: currentPage
      };
      
      setObjects(prev => [...prev, newSignature]);
      setSelectedId(id);
    } else if (signingFieldId) {
      updateObject(signingFieldId, { content: signatureDataURL });
    }
    
    setShowSignatureModal(false);
    setSigningFieldId(null);
  }, [signingFieldId, updateObject, getViewportCenter, scale, currentPage, setObjects, setSelectedId]);

  const getCurrentPageFields = useCallback(() => {
    return objects.filter(obj => obj.page === currentPage);
  }, [objects, currentPage]);

  // Home Screen - Simplistic Design with White Background
  if (currentView === 'picker') {
    return (
      <Box className="flex-1 bg-white min-h-screen">
        <StatusBar style="auto" />
        
        <Center className="flex-1 px-6">
          <VStack space="2xl" className="items-center max-w-md w-full">
            
            {/* Logo */}
            <Box className="mb-4">
              <img 
                src="/logo.png" 
                alt="QuickSign Logo" 
                style={{ 
                  width: '120px', 
                  height: 'auto',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }} 
              />
            </Box>

            {/* Upload Section - Icon as Button */}
            <VStack space="lg" className="items-center w-full">
              
              {/* Animated Upload Icon Button */}
              <Pressable
                onPress={handlePickDocument}
                disabled={isLoading}
                className="items-center"
              >
                <Box className="upload-zone-windows p-16 w-full items-center">
                  <VStack space="sm" className="items-center">
                    {isLoading ? (
                      <Spinner size="large" color="#0064EA" />
                    ) : (
                      <Box className="animate-pulse">
                        <HeroIcon 
                          path={icons.upload} 
                          className="w-20 h-20 text-primary-500"
                          style={{
                            animation: 'windowsPulse 2s ease-in-out infinite'
                          }}
                        />
                      </Box>
                    )}
                    <Text className="text-typography-600 font-medium text-lg mt-2">
                      {isLoading ? 'Processing...' : 'PDF'}
                    </Text>
                  </VStack>
                </Box>
              </Pressable>

              {/* Key Features */}
              <VStack space="md" className="items-center w-full mt-6">
                <HStack space="sm" className="items-center">
                  <Box className="w-6 h-6 rounded-full bg-secondary-500 flex items-center justify-center">
                    <HeroIcon path={icons.pencil} className="w-4 h-4 text-white" />
                  </Box>
                  <Text className="text-typography-700 font-medium">Sign, Text, Date & Check Fields</Text>
                </HStack>
                
                <HStack space="sm" className="items-center">
                  <Box className="w-6 h-6 rounded-full bg-tertiary-500 flex items-center justify-center">
                    <HeroIcon path={icons.check} className="w-4 h-4 text-white" />
                  </Box>
                  <Text className="text-typography-700 font-medium">Offline Mode - No Cloud Required</Text>
                </HStack>
                
                <HStack space="sm" className="items-center">
                  <Box className="w-6 h-6 rounded-full bg-warning-500 flex items-center justify-center">
                    <HeroIcon path={icons.check} className="w-4 h-4 text-white" />
                  </Box>
                  <Text className="text-typography-700 font-medium">Simple & Fast</Text>
                </HStack>
              </VStack>

            </VStack>

          </VStack>
        </Center>
      </Box>
    );
  }

  // Editor View - Updated to match simplistic style
  return (
    <Box className="flex-1 bg-white">
      <StatusBar style="auto" />
      
      {/* Simple Header */}
      <Box className="bg-white border-b border-outline-200 shadow-sm">
        <Box className="px-4 py-3">
          <HStack className="items-center justify-between">
            <HStack space="md" className="items-center">
              <Pressable
                onPress={() => setCurrentView('picker')}
                className="flex-row items-center space-x-2 px-3 py-2 rounded-lg hover:bg-background-50"
              >
                <HeroIcon path={icons.chevronLeft} className="w-4 h-4 text-typography-600" />
                <Text className="font-semibold text-typography-700">Back</Text>
              </Pressable>
              <Heading size="md" className="text-typography-800 font-bold">
                {selectedFile?.name || 'Document.pdf'}
              </Heading>
            </HStack>
            
            {isRendering && (
              <HStack space="sm" className="items-center">
                <Spinner size="small" color="#0064EA" />
                <Text className="text-typography-600 text-sm">Rendering...</Text>
              </HStack>
            )}
          </HStack>
        </Box>
      </Box>

      {/* Tools - Simplified and Centered */}
      <Box className="bg-white border-b border-outline-200">
        <Center className="py-3">
          <HStack space="lg" className="items-center">
            {tools.map((tool, index) => (
              <Pressable
                key={tool.id}
                onPress={tool.action}
                className="items-center"
              >
                <Box className="w-12 h-12 rounded-full bg-tertiary-500 flex items-center justify-center mb-1">
                  <HeroIcon path={tool.icon} className="w-6 h-6 text-white" />
                </Box>
                <Text className="text-xs font-medium text-typography-600">{tool.label}</Text>
              </Pressable>
            ))}
            
            <Box className="w-px h-12 bg-outline-300 mx-2" />
            
            <Pressable
              onPress={clearAllObjects}
              className="items-center"
            >
              <Box className="w-12 h-12 rounded-full bg-error-500 flex items-center justify-center mb-1">
                <HeroIcon path={icons.x} className="w-6 h-6 text-white" />
              </Box>
              <Text className="text-xs font-medium text-error-600">Clear</Text>
            </Pressable>
          </HStack>
        </Center>
      </Box>

      {/* PDF Viewer */}
      <Box className="flex-1 bg-background-50">
        <ScrollView className="flex-1" contentContainerStyle={{ minHeight: '100%', justifyContent: 'center' }}>
          <Center className="p-6">
            <Box className="window-xp shadow-xp rounded-xp overflow-hidden">
              {pdfError ? (
                <Box className="p-12 text-center">
                  <VStack space="md" className="items-center">
                    <HeroIcon path={icons.x} className="w-16 h-16 text-error-500" />
                    <Heading className="text-error-600 text-lg font-semibold">
                      PDF Loading Error
                    </Heading>
                    <Text className="text-error-500 font-medium">{pdfError}</Text>
                    <Pressable 
                      onPress={() => setCurrentView('picker')}
                      className="mt-4 px-6 py-3 bg-primary-500 rounded-lg"
                    >
                      <Text className="text-white font-semibold">Try Another File</Text>
                    </Pressable>
                  </VStack>
                </Box>
              ) : (
                <Box className="relative bg-white">
                  <canvas
                    ref={canvasRef}
                    style={{
                      display: 'block',
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                  />
                  
                  {getCurrentPageFields().map((object) => (
                    <EditableField
                      key={object.id}
                      object={object}
                      scale={scale}
                      selected={selectedId === object.id}
                      editing={editingId === object.id}
                      onUpdate={updateObject}
                      onSelect={setSelectedId}
                      onStartEdit={() => setEditingId(object.id)}
                      onFinishEdit={() => setEditingId(null)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Center>
        </ScrollView>
      </Box>

      {/* Bottom Controls - Simplified and Centered */}
      <Box className="bg-white border-t border-outline-200">
        <Center className="py-3">
          <HStack space="lg" className="items-center">
            <Pressable
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className={`items-center ${currentPage <= 1 ? 'opacity-50' : ''}`}
            >
              <Box className="w-12 h-12 rounded-full bg-warning-500 flex items-center justify-center mb-1">
                <HeroIcon path={icons.chevronLeft} className="w-6 h-6 text-white" />
              </Box>
              <Text className="text-xs font-medium text-typography-600">Previous</Text>
            </Pressable>
            
            <VStack className="items-center">
              <Box className="bg-warning-500 px-4 py-2 rounded-full">
                <Text className="text-white font-bold font-mono text-sm">{currentPage} / {totalPages}</Text>
              </Box>
            </VStack>
            
            <Pressable
              onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className={`items-center ${currentPage >= totalPages ? 'opacity-50' : ''}`}
            >
              <Box className="w-12 h-12 rounded-full bg-warning-500 flex items-center justify-center mb-1">
                <HeroIcon path={icons.chevronRight} className="w-6 h-6 text-white" />
              </Box>
              <Text className="text-xs font-medium text-typography-600">Next</Text>
            </Pressable>
            
            <Box className="w-px h-12 bg-outline-300 mx-2" />
            
            <Pressable
              onPress={() => setScale(Math.max(0.25, scale - 0.25))}
              disabled={scale <= 0.25}
              className={`items-center ${scale <= 0.25 ? 'opacity-50' : ''}`}
            >
              <Box className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center mb-1">
                <HeroIcon path={icons.zoomOut} className="w-6 h-6 text-white" />
              </Box>
              <Text className="text-xs font-medium text-typography-600">Zoom Out</Text>
            </Pressable>
            
            <VStack className="items-center">
              <Pressable onPress={() => setScale(1.0)} className="px-4 py-2 bg-primary-500 rounded-full">
                <Text className="font-bold font-mono text-sm text-white">
                  {Math.round(scale * 100)}%
                </Text>
              </Pressable>
            </VStack>
            
            <Pressable
              onPress={() => setScale(Math.min(4, scale + 0.25))}
              disabled={scale >= 4}
              className={`items-center ${scale >= 4 ? 'opacity-50' : ''}`}
            >
              <Box className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center mb-1">
                <HeroIcon path={icons.zoomIn} className="w-6 h-6 text-white" />
              </Box>
              <Text className="text-xs font-medium text-typography-600">Zoom In</Text>
            </Pressable>
          </HStack>
        </Center>
      </Box>

      {/* Signature Modal - Updated styling */}
      <Modal isOpen={showSignatureModal} onClose={() => setShowSignatureModal(false)}>
        <ModalBackdrop className="bg-black/30 backdrop-blur-sm" />
        <ModalContent className="bg-white rounded-3xl m-4 max-w-lg shadow-xl border-0">
          <ModalHeader className="border-b border-outline-200 px-6 py-4">
            <HStack className="items-center justify-between w-full">
              <Heading className="text-typography-800 font-bold text-lg">
                Digital Signature
              </Heading>
              <Pressable 
                onPress={() => setShowSignatureModal(false)}
                className="w-8 h-8 rounded-full bg-background-100 hover:bg-background-200 flex items-center justify-center"
              >
                <HeroIcon path={icons.x} className="w-4 h-4 text-typography-600" />
              </Pressable>
            </HStack>
          </ModalHeader>
          <ModalBody className="p-0">
            <SignaturePad 
              onSave={handleSaveSignature}
              onCancel={() => setShowSignatureModal(false)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default function App() {
  return (
    <GluestackUIProvider mode="light">
      <AppContent />
    </GluestackUIProvider>
  );
}