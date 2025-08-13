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

// Add custom scrollbar styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Custom scrollbar styles for both vertical and horizontal */
    .pdf-scroll-container::-webkit-scrollbar {
      width: 12px;
      height: 12px; /* Add height for horizontal scrollbar */
      background-color: #f1f1f1;
    }
    
    .pdf-scroll-container::-webkit-scrollbar-track {
      background-color: #f1f1f1;
      border-radius: 6px;
    }
    
    .pdf-scroll-container::-webkit-scrollbar-thumb {
      background-color: #888;
      border-radius: 6px;
      border: 2px solid #f1f1f1;
    }
    
    .pdf-scroll-container::-webkit-scrollbar-thumb:hover {
      background-color: #555;
    }
    
    /* Corner where scrollbars meet */
    .pdf-scroll-container::-webkit-scrollbar-corner {
      background-color: #f1f1f1;
    }
    
    /* Firefox scrollbar */
    .pdf-scroll-container {
      scrollbar-width: thin;
      scrollbar-color: #888 #f1f1f1;
    }
    
    /* Ensure the container has proper scroll behavior */
    .pdf-scroll-container {
      overflow: auto !important;
      width: 100%;
      height: 100%;
    }
  `;
  document.head.appendChild(style);
}

// Heroicons via CDN (since we can't install packages)
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
  chevronUp: "M19 15l-7-7-7 7",
  chevronDown: "M5 9l7 7 7-7",
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

// PDF Editor Hook
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

  // PDF Rendering Effect
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

  // Consolidate field creation functions
  const createField = useCallback((type, x, y) => {
    const center = x && y ? { x, y } : getViewportCenter();
    const id = `${type}_${Date.now()}`;
    
    const fieldConfigs = {
      text: { width: 200, height: 60, content: '', fontSize: 11 },
      date: { width: 100, height: 24, content: new Date().toLocaleDateString(), fontSize: 11 },
      checkbox: { width: 20, height: 20, content: true, fontSize: 16 },
      signature: { width: 200, height: 80, content: '', fontSize: 12 }
    };
    
    const config = fieldConfigs[type];
    const newField = {
      id,
      type,
      x: center.x / scale,
      y: center.y / scale,
      width: config.width / scale,
      height: config.height / scale,
      content: config.content,
      fontSize: config.fontSize,
      color: '#000000',
      page: currentPage
    };
    
    setObjects(prev => [...prev, newField]);
    setSelectedId(id);
    
    return type === 'signature' ? 'open_signature_modal' : null;
  }, [scale, currentPage, getViewportCenter]);

  const addTextObject = useCallback((x, y) => createField('text', x, y), [createField]);
  const addDateObject = useCallback((x, y) => createField('date', x, y), [createField]);
  const addCheckboxObject = useCallback((x, y) => createField('checkbox', x, y), [createField]);
  const addSignatureObject = useCallback(() => createField('signature'), [createField]);

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
    pdfDocument,
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

// Simplified Signature Drawing Component
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
    <Box className="p-6 bg-white">
      <VStack space="lg" className="items-center">
        <Text className="text-lg font-bold text-typography-800 text-center">
          Draw Your Signature
        </Text>
        
        {/* Canvas - Mobile-friendly */}
        <Box className="w-full border-2 border-outline-300 rounded-lg bg-white overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onTouchStart={startDrawing}
            style={{
              cursor: 'crosshair',
              display: 'block',
              width: '100%',
              height: '200px',
              touchAction: 'none' // Prevent scrolling on touch
            }}
          />
        </Box>
        
        <Text className="text-center text-typography-500 text-sm">
          Draw with your finger or mouse
        </Text>
        
        {/* Simple Button Row */}
        <HStack space="md" className="w-full">
          <Button 
            onPress={onCancel}
            className="flex-1 bg-background-200"
          >
            <ButtonText className="text-typography-700 font-semibold">Cancel</ButtonText>
          </Button>
          
          <Button 
            onPress={clearSignature}
            className="flex-1 bg-warning-500"
          >
            <ButtonText className="text-white font-semibold">Clear</ButtonText>
          </Button>
          
          <Button 
            onPress={saveSignature}
            className="flex-1 bg-primary-500"
          >
            <ButtonText className="text-white font-semibold">Save</ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
});

// Editable Field Component
const EditableField = React.memo(({ object, scale, selected, editing, onUpdate, onSelect, onStartEdit, onFinishEdit, setShowSignatureModal, setSigningFieldId }) => {
  const [value, setValue] = useState(object.content || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

  useEffect(() => {
    setValue(object.content || '');
  }, [object.content]);

  // Clean field styling - minimal approach with larger draggable area
  const fieldStyle = useMemo(() => ({
    position: 'absolute',
    left: `${object.x * scale - 4}px`,
    top: `${object.y * scale - 4}px`,
    width: `${object.width * scale + 8}px`,
    height: `${object.height * scale + 8}px`,
    fontSize: object.fontSize ? `${object.fontSize * scale}px` : `${12 * scale}px`,
    color: object.color || '#000000',
    border: selected ? (editing ? '2px solid #1e40af' : '2px solid #3b82f6') : 'none',
    backgroundColor: 'transparent',
    borderRadius: '0px',
    padding: '6px',
    cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : (selected ? 'grab' : 'pointer'),
    zIndex: selected ? 1000 : 100,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: object.type === 'checkbox' ? 'center' : 'flex-start',
    userSelect: editing ? 'auto' : 'none',
    boxShadow: 'none',
    transition: isDragging || isResizing ? 'none' : 'all 0.15s ease',
    transform: 'scale(1)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '500',
    willChange: isDragging || isResizing ? 'transform' : 'auto'
  }), [object, scale, selected, isDragging, editing, isResizing]);

  // Simplified render functions
  const renderCheckbox = (object, scale, editing) => (
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
      color: '#000000',
      backgroundColor: 'transparent'
    }}>
      {object.content ? '✓' : ''}
    </div>
  );

  const renderSignature = (object, scale, editing) => {
    if (object.content && object.content.startsWith('data:image')) {
      return (
        <img
          src={object.content}
          alt="Signature"
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        />
      );
    }
    
    return (
      <div style={{ 
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgb(var(--color-typography-400))', fontSize: `${10 * scale}px`, fontStyle: 'italic',
        border: '2px dashed rgb(var(--color-outline-300))', borderRadius: '4px'
      }}>
        {editing ? 'Draw signature...' : 'Click to sign'}
      </div>
    );
  };

  const renderEditableInput = (object, value, handleContentChange, onFinishEdit) => {
    const commonStyle = {
      width: '100%', height: '100%', border: 'none', background: 'transparent',
      outline: 'none', fontSize: 'inherit', color: 'inherit', padding: '2px',
      fontFamily: 'inherit', fontWeight: 'inherit'
    };

    return object.type === 'text' ? (
      <textarea
        value={value}
        onChange={handleContentChange}
        onBlur={onFinishEdit}
        autoFocus
        placeholder="Enter text..."
        style={{ ...commonStyle, resize: 'none' }}
      />
    ) : (
      <input
        type={object.type === 'date' ? 'date' : 'text'}
        value={value}
        onChange={handleContentChange}
        onBlur={onFinishEdit}
        autoFocus
        placeholder={`Enter ${object.type}...`}
        style={commonStyle}
      />
    );
  };

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
        // For signatures, open the signature modal
        setShowSignatureModal(true);
        setSigningFieldId(object.id);
        return;
      } else {
        onStartEdit(object.id);
      }
      return;
    }
    
    if (object.type === 'checkbox' && !editing) {
      // Double click to toggle checkbox
      if (isDoubleClick) {
        handleContentChange({ target: { value: !object.content } });
        return;
      }
    }
    
    // Start drag operation with smooth animation
    if (!editing) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - object.x * scale,
        y: e.clientY - object.y * scale
      });
      
      // Prevent scrolling during drag
      document.body.style.userSelect = 'none';
      document.body.style.overflow = 'hidden';
      
      // Also prevent scrolling on the scroll container
      const scrollContainer = document.querySelector('.pdf-scroll-container');
      if (scrollContainer) {
        scrollContainer.style.overflow = 'hidden';
      }
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
    
    // Prevent scrolling during resize
    document.body.style.userSelect = 'none';
    document.body.style.overflow = 'hidden';
    
    // Also prevent scrolling on the scroll container
    const scrollContainer = document.querySelector('.pdf-scroll-container');
    if (scrollContainer) {
      scrollContainer.style.overflow = 'hidden';
    }
  }, [object.width, object.height]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && !editing) {
      e.preventDefault();
      
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const maxX = (canvasRect.width / scale) - object.width;
        const maxY = (canvasRect.height / scale) - object.height;
        
        const newX = (e.clientX - dragStart.x) / scale;
        const newY = (e.clientY - dragStart.y) / scale;
        
        onUpdate(object.id, { 
          x: Math.max(0, Math.min(maxX, newX)), 
          y: Math.max(0, Math.min(maxY, newY))
        });
      });
    } else if (isResizing) {
      e.preventDefault();
      
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const maxWidth = (canvasRect.width / scale) - object.x;
        const maxHeight = (canvasRect.height / scale) - object.y;
        
        const deltaX = e.clientX - resizeStart.mouseX;
        const deltaY = e.clientY - resizeStart.mouseY;
        
        const newWidth = Math.max(30 / scale, Math.min(maxWidth, resizeStart.width + deltaX / scale));
        const newHeight = Math.max(20 / scale, Math.min(maxHeight, resizeStart.height + deltaY / scale));
        
        onUpdate(object.id, { width: newWidth, height: newHeight });
      });
    }
  }, [isDragging, isResizing, editing, dragStart, resizeStart, scale, object.id, object.x, object.y, object.width, object.height, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    
    // Restore scrolling
    document.body.style.userSelect = '';
    document.body.style.overflow = '';
    
    // Restore scrolling on the scroll container
    const scrollContainer = document.querySelector('.pdf-scroll-container');
    if (scrollContainer) {
      scrollContainer.style.overflow = 'auto';
    }
  }, []);

  // Add global mouse event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      const handleTouchMove = (e) => {
        if (e.touches && e.touches[0]) {
          const touch = e.touches[0];
          const mouseEvent = {
            ...e,
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: e.preventDefault.bind(e),
            stopPropagation: e.stopPropagation.bind(e)
          };
          handleMouseMove(mouseEvent);
        }
      };

      const handleTouchEnd = () => {
        handleMouseUp();
      };

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
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const renderFieldContent = () => {
    if (object.type === 'checkbox') {
      return renderCheckbox(object, scale, editing);
    }
    
    if (object.type === 'signature') {
      return renderSignature(object, scale, editing);
    }
    
    if (editing && object.type !== 'signature') {
      return renderEditableInput(object, value, handleContentChange, onFinishEdit);
    }
    
    return (
      <div style={{ 
        width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none',
        display: 'flex', alignItems: 'center',
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
      onTouchStart={(e) => {
        // Convert touch to mouse event for mobile compatibility
        const touch = e.touches[0];
        const mouseEvent = {
          ...e,
          clientX: touch.clientX,
          clientY: touch.clientY,
          preventDefault: e.preventDefault.bind(e),
          stopPropagation: e.stopPropagation.bind(e)
        };
        handleMouseDown(mouseEvent);
      }}
    >
      {renderFieldContent()}
      
      {/* Clean Resize Handle */}
      {selected && !editing && (
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '8px',
            height: '8px',
            backgroundColor: '#3b82f6',
            cursor: 'se-resize',
            zIndex: 1001
          }}
          onMouseDown={handleResizeMouseDown}
          onTouchStart={(e) => {
            // Convert touch to mouse event for mobile compatibility
            const touch = e.touches[0];
            const mouseEvent = {
              ...e,
              clientX: touch.clientX,
              clientY: touch.clientY,
              preventDefault: e.preventDefault.bind(e),
              stopPropagation: e.stopPropagation.bind(e)
            };
            handleResizeMouseDown(mouseEvent);
          }}
        />
      )}
    </div>
  );
});

// Create reusable UI components
const ToolButton = ({ tool, onPress, bgColor = "bg-tertiary-500" }) => (
  <Pressable onPress={onPress} className="items-center">
    <Box className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center mb-1`}>
      <HeroIcon path={tool.icon} className="w-5 h-5 text-white" />
    </Box>
    <Text className="text-xs font-medium text-typography-600 text-center max-w-16">
      {tool.label}
    </Text>
  </Pressable>
);

const NavButton = ({ icon, label, onPress, disabled, bgColor = "bg-warning-500" }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className={`items-center ${disabled ? 'opacity-50' : ''}`}
  >
    <Box className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center mb-1`}>
      <HeroIcon path={icon} className="w-5 h-5 text-white" />
    </Box>
    <Text className="text-xs font-medium text-typography-600 text-center max-w-16">{label}</Text>
  </Pressable>
);

const ToggleButton = ({ show, onToggle, showText, hideText }) => (
  <Pressable
    onPress={onToggle}
    className="px-4 py-2 bg-background-200 rounded-lg flex-row items-center space-x-2"
  >
    <HeroIcon 
      path={show ? icons.chevronUp : icons.chevronDown} 
      className="w-4 h-4 text-typography-600" 
    />
    <Text className="text-typography-600 font-medium text-sm">
      {show ? hideText : showText}
    </Text>
  </Pressable>
);

function AppContent() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentView, setCurrentView] = useState('picker');
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingFieldId, setSigningFieldId] = useState(null);
  const [showTools, setShowTools] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const toast = useToast();

  const {
    canvasRef,
    pdfDocument,
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

  // Delete selected object function
  const handleDeleteSelected = useCallback(() => {
    if (selectedId) {
      deleteObject(selectedId);
      setSelectedId(null);
      setEditingId(null);
    }
  }, [selectedId, deleteObject]);

  const tools = useMemo(() => [
    { id: 'text', label: 'Text', icon: icons.documentText, action: addTextObject },
    { id: 'signature', label: 'Signature', icon: icons.pencil, action: () => {
      const result = addSignatureObject();
      if (result === 'open_signature_modal') {
        setShowSignatureModal(true);
        setSigningFieldId('new');
      }
    }},
    { id: 'date', label: 'Date', icon: icons.calendar, action: addDateObject },
    { id: 'checkbox', label: 'Checkbox', icon: icons.checkSquare, action: addCheckboxObject }
  ], [addTextObject, addDateObject, addCheckboxObject, addSignatureObject]);

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

  // Save function - Export as PDF
  const handleSavePDF = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeId={id} className="bg-error-500">
            <ToastDescription className="text-white font-semibold">
              No PDF loaded to save
            </ToastDescription>
          </Toast>
        ),
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Load PDF-lib
      if (!window.PDFLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { PDFDocument, rgb } = window.PDFLib;
      
      // Get the original PDF bytes
      const existingPdfBytes = await fetch(`data:application/pdf;base64,${pdfBase64}`).then(res => res.arrayBuffer());
      
      // Load the existing PDF
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const page = pages[currentPage - 1]; // PDF pages are 0-indexed
      
      if (!page) {
        throw new Error('Page not found');
      }

      const { width, height } = page.getSize();
      
      // Helper function to wrap text
      const wrapText = (text, maxWidth, fontSize) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = testLine.length * fontSize * 0.6; // Approximate width calculation
          
          if (textWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              lines.push(word); // Word is too long, add it anyway
            }
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        return lines;
      };
      
      // Add form fields to the current page
      for (const obj of objects.filter(obj => obj.page === currentPage)) {
        // Convert coordinates from canvas to PDF coordinate system
        const pdfX = obj.x;
        const pdfY = height - obj.y - obj.height; // PDF Y-axis is flipped
        
        if (obj.type === 'text' || obj.type === 'date') {
          if (obj.content) {
            const fontSize = obj.fontSize || 11;
            const lineHeight = fontSize * 1.2; // 20% line spacing
            
            if (obj.type === 'text') {
              // Wrap text for multi-line text boxes
              const lines = wrapText(obj.content, obj.width, fontSize);
              const totalTextHeight = lines.length * lineHeight;
              const startY = pdfY + (obj.height + totalTextHeight) / 2 - lineHeight; // Center the text block
              
              lines.forEach((line, index) => {
                page.drawText(line, {
                  x: pdfX + 4, // 4px padding
                  y: startY - (index * lineHeight), // Start from centered position
                  size: fontSize,
                  color: rgb(0, 0, 0),
                });
              });
            } else {
              // Single line for dates - center vertically
              page.drawText(obj.content, {
                x: pdfX + 4, // 4px padding
                y: pdfY + (obj.height - fontSize) / 2, // Center vertically
                size: fontSize,
                color: rgb(0, 0, 0),
              });
            }
          }
        } else if (obj.type === 'checkbox' && obj.content) {
          // Draw "X" mark for checked checkboxes (✓ causes encoding issues)
          page.drawText('X', {
            x: pdfX + 6, // Center the X in the checkbox
            y: pdfY + 6,
            size: 12,
            color: rgb(0, 0, 0),
          });
        } else if (obj.type === 'signature' && obj.content && obj.content.startsWith('data:image')) {
          try {
            // Convert signature image to PNG and embed it
            const signatureBytes = await fetch(obj.content).then(res => res.arrayBuffer());
            const signatureImage = await pdfDoc.embedPng(signatureBytes);
            
            // Draw the signature image
            page.drawImage(signatureImage, {
              x: pdfX,
              y: pdfY,
              width: obj.width,
              height: obj.height,
            });
          } catch (error) {
            console.error('Failed to embed signature:', error);
            // Fallback to text if image embedding fails
            page.drawText('[Signature]', {
              x: pdfX + 4,
              y: pdfY + obj.height * 0.5,
              size: obj.fontSize || 12,
              color: rgb(0.5, 0.5, 0.5),
            });
          }
        }
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedFile?.name?.replace('.pdf', '') || 'document'}_filled.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeId={id} className="bg-success-500">
            <ToastDescription className="text-white font-semibold">
              PDF saved successfully!
            </ToastDescription>
          </Toast>
        ),
      });
      
    } catch (error) {
      console.error('Save failed:', error);
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeId={id} className="bg-error-500">
            <ToastDescription className="text-white font-semibold">
              Failed to save PDF: {error.message}
            </ToastDescription>
          </Toast>
        ),
      });
    } finally {
      setIsLoading(false);
    }
  }, [pdfDocument, canvasRef, currentPage, objects, selectedFile, toast, pdfBase64]);

  const getCurrentPageFields = useCallback(() => {
    return objects.filter(obj => obj.page === currentPage);
  }, [objects, currentPage]);

  // Home Screen
  if (currentView === 'picker') {
    return (
      <Box className="flex-1 bg-white min-h-screen">
        <StatusBar style="auto" />
        
        {/* Content */}
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

  // Editor View
  return (
    <Box className="flex-1 bg-white overflow-hidden">
      <StatusBar style="auto" />
      
      {/* Simple Header */}
      <Box className="bg-white border-b border-outline-200 shadow-sm">
        <Box className="px-6 py-4">
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
            
            <HStack space="md" className="items-center">
              <Pressable
                onPress={handleSavePDF}
                disabled={isLoading}
                className="flex-row items-center space-x-2 px-4 py-2 bg-success-500 rounded-lg"
              >
                <HeroIcon path={icons.download} className="w-4 h-4 text-white" />
                <Text className="font-semibold text-white">
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            
              {isRendering && (
                <HStack space="sm" className="items-center">
                  <Spinner size="small" color="#0064EA" />
                  <Text className="text-typography-600 text-sm">Rendering...</Text>
                </HStack>
              )}
            </HStack>
          </HStack>
        </Box>
      </Box>

      {/* Tools - Collapsible */}
      {showTools && (
        <Box className="bg-white border-b border-outline-200">
          <Center className="py-3 px-2">
            {/* Mobile: Smaller buttons and spacing */}
            <HStack space="sm" className="items-center flex-wrap justify-center">
              {tools.map((tool) => (
                <ToolButton key={tool.id} tool={tool} onPress={tool.action} />
              ))}
              
              <Box className="w-px h-8 bg-outline-300 mx-1" />
              
              <ToolButton 
                tool={{ icon: icons.x, label: 'Clear' }} 
                onPress={clearAllObjects}
                bgColor="bg-error-500"
              />
              
              <ToolButton 
                tool={{ icon: icons.x, label: 'Delete' }} 
                onPress={handleDeleteSelected}
                bgColor="bg-warning-500"
              />
            </HStack>
          </Center>
        </Box>
      )}
      
      {/* Collapse/Expand Tools Button */}
      <Box className="bg-background-50 border-b border-outline-200">
        <Center className="py-2">
          <ToggleButton 
            show={showTools}
            onToggle={() => setShowTools(!showTools)}
            showText="Show Tools"
            hideText="Hide Tools"
          />
        </Center>
      </Box>

      {/* PDF Viewer - FIXED SECTION */}
      <Box className="flex-1 bg-background-50 overflow-hidden">
        <div 
          className="pdf-scroll-container"
          style={{ 
            width: '100%',
            height: '100%',
            overflow: 'auto'
          }}
        >
          <div style={{
            minWidth: 'max-content',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '24px',
            boxSizing: 'border-box'
          }}>
            <Box className="window-xp shadow-xp rounded-xp overflow-hidden bg-white" style={{ 
              minWidth: '600px',
              maxWidth: 'fit-content',
              position: 'relative'
            }}>
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
                    onClick={(e) => {
                      // Click on canvas background deselects all elements
                      if (e.target === canvasRef.current) {
                        setSelectedId(null);
                        setEditingId(null);
                      }
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      maxWidth: 'none'
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
                      setShowSignatureModal={setShowSignatureModal}
                      setSigningFieldId={setSigningFieldId}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </div>
        </div>
      </Box>

      {/* Bottom Controls - Collapsible */}
      {showControls && (
        <Box className="bg-white border-t border-outline-200">
          <Center className="py-3 px-2">
            <HStack space="sm" className="items-center flex-wrap justify-center">
              <NavButton
                icon={icons.chevronLeft}
                label="Previous"
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              />
              
              <VStack className="items-center">
                <Box className="bg-warning-500 px-3 py-1.5 rounded-full">
                  <Text className="text-white font-bold font-mono text-xs">{currentPage} / {totalPages}</Text>
                </Box>
              </VStack>
              
              <NavButton
                icon={icons.chevronRight}
                label="Next"
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              />
              
              <Box className="w-px h-8 bg-outline-300 mx-1" />
              
              <NavButton
                icon={icons.zoomOut}
                label="Zoom Out"
                onPress={() => setScale(Math.max(0.25, scale - 0.25))}
                disabled={scale <= 0.25}
                bgColor="bg-primary-500"
              />
              
              <VStack className="items-center">
                <Pressable onPress={() => setScale(1.0)} className="px-3 py-1.5 bg-primary-500 rounded-full">
                  <Text className="font-bold font-mono text-xs text-white">
                    {Math.round(scale * 100)}%
                  </Text>
                </Pressable>
              </VStack>
              
              <NavButton
                icon={icons.zoomIn}
                label="Zoom In"
                onPress={() => setScale(Math.min(4, scale + 0.25))}
                disabled={scale >= 4}
                bgColor="bg-primary-500"
              />
            </HStack>
          </Center>
        </Box>
      )}
      
      {/* Collapse/Expand Controls Button */}
      <Box className="bg-background-50 border-t border-outline-200">
        <Center className="py-2">
          <ToggleButton 
            show={showControls}
            onToggle={() => setShowControls(!showControls)}
            showText="Show Controls"
            hideText="Hide Controls"
          />
        </Center>
      </Box>

      {/* Signature Modal - Clean styling */}
      <Modal isOpen={showSignatureModal} onClose={() => setShowSignatureModal(false)}>
        <ModalBackdrop className="bg-black/30 backdrop-blur-sm" />
        <ModalContent className="bg-white rounded-lg m-4 max-w-lg shadow-xl border-0">
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