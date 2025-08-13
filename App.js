// App.js - Fixed Rerendering Issues
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

// Add retro fonts and icons
const retroFontLink = document.createElement('link');
retroFontLink.href = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono:wght@400&family=Orbitron:wght@400;700;900&display=swap';
retroFontLink.rel = 'stylesheet';
document.head.appendChild(retroFontLink);

// Import Gluestack UI components
import { Box } from './components/ui/box';
import { VStack } from './components/ui/vstack';
import { HStack } from './components/ui/hstack';
import { Text } from './components/ui/text';
import { Heading } from './components/ui/heading';
import { Button, ButtonText } from './components/ui/button';
import { Card } from './components/ui/card';
import { ScrollView } from './components/ui/scroll-view';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from './components/ui/modal';
import { Input, InputField } from './components/ui/input';
import { FormControl, FormControlLabel, FormControlLabelText } from './components/ui/form-control';
import { Badge, BadgeText } from './components/ui/badge';
import { Center } from './components/ui/center';
import { Spinner } from './components/ui/spinner';
import { Pressable } from './components/ui/pressable';
import { Divider } from './components/ui/divider';
import { Toast, ToastDescription, useToast } from './components/ui/toast';

// Universal file reading - FIXED for web
const readFileAsBase64 = (fileAsset) => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      // On web, we need to fetch the file from the URI to get the actual blob
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
        // Sometimes the file object is directly available
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
      // Native platforms
      if (fileAsset.uri && fileAsset.uri.startsWith('data:')) {
        const base64 = fileAsset.uri.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('File format not supported on this platform'));
      }
    }
  });
};

// Custom hook for PDF operations - OPTIMIZED
function usePDFEditor(pdfBase64) {
  const canvasRef = useRef(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [isRendering, setIsRendering] = useState(false);

  // Form field state
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // PDF Loading Effect - FIXED: Removed isRendering from dependencies
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (pdfBase64 && !pdfDocument && !pdfLoaded && !pdfError) {
        const timeoutId = setTimeout(async () => {
          // Double check before proceeding
          if (!pdfBase64 || pdfLoaded) return;
          
          try {
            setIsRendering(true);
            setPdfError(null);
            
            console.log('📖 Loading PDF...');
            
            // Use CDN version for web
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
            
            console.log(`✅ PDF loaded successfully: ${pdfDoc.numPages} pages`);
            
          } catch (error) {
            console.error('❌ PDF loading failed:', error);
            setPdfError(error.message || 'Failed to load PDF');
          } finally {
            setIsRendering(false);
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [pdfBase64, pdfDocument, pdfLoaded, pdfError]); // ✅ Removed isRendering

  // PDF Rendering Effect - FIXED: Optimized dependencies
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
        
        // Higher quality rendering with device pixel ratio
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
          console.error('❌ Page rendering failed:', error);
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
  }, [pdfDocument, currentPage, scale, pdfLoaded]); // ✅ Removed isRendering

  // Smart field placement - center of visible viewport relative to PDF
  const getViewportCenter = useCallback(() => {
    if (!canvasRef.current) return { x: 100, y: 100 };
    
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    
    // Find the ScrollView container
    let scrollContainer = canvas.parentElement;
    while (scrollContainer && !scrollContainer.getAttribute('data-scroll-container')) {
      scrollContainer = scrollContainer.parentElement;
    }
    
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      
      // Get scroll position
      const scrollTop = scrollContainer.scrollTop;
      const scrollLeft = scrollContainer.scrollLeft;
      
      // Calculate the center of the visible area within the container
      const visibleCenterX = containerRect.width / 2;
      const visibleCenterY = containerRect.height / 2;
      
      // Convert to PDF canvas coordinates
      // Account for the canvas position relative to its container
      const canvasOffsetX = canvasRect.left - containerRect.left;
      const canvasOffsetY = canvasRect.top - containerRect.top;
      
      // Calculate position on the canvas considering scroll
      const canvasX = visibleCenterX - canvasOffsetX + scrollLeft;
      const canvasY = visibleCenterY - canvasOffsetY + scrollTop;
      
      // Ensure it's within canvas bounds
      const finalX = Math.max(50, Math.min(canvasRect.width - 100, canvasX));
      const finalY = Math.max(50, Math.min(canvasRect.height - 50, canvasY));
      
      console.log('Viewport center calculation:', {
        containerRect: containerRect,
        canvasRect: canvasRect,
        scrollTop: scrollTop,
        scrollLeft: scrollLeft,
        visibleCenter: { x: visibleCenterX, y: visibleCenterY },
        canvasOffset: { x: canvasOffsetX, y: canvasOffsetY },
        finalPosition: { x: finalX, y: finalY }
      });
      
      return { x: finalX, y: finalY };
    }
    
    // Fallback: use center of canvas
    return {
      x: canvasRect.width / 2,
      y: canvasRect.height / 2
    };
  }, []);

  // Field creation functions - UPDATED with smart placement
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
    // This will be handled in the parent component
    // Just return a signal that signature modal should open
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
      content: true, // Checked by default
      fontSize: 16,
      color: '#000000',
      page: currentPage
    };
    
    setObjects(prev => [...prev, newCheckbox]);
    setSelectedId(id);
  }, [scale, currentPage, getViewportCenter]);

  // Object management functions - FIXED: Removed problematic dependencies
  const updateObject = useCallback((id, updates) => {
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []); // ✅ No dependencies needed since we use functional updates

  const deleteObject = useCallback((id) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    setSelectedId(prev => prev === id ? null : prev);
    setEditingId(prev => prev === id ? null : prev);
  }, []); // ✅ Removed selectedId, editingId dependencies

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
    setObjects // Export this for signature creation
  };
}

// Signature Drawing Component
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
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 200;
    
    // Clear canvas with transparent background
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

  // Add global mouse event listeners
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
    <VStack space="md" className="items-center">
      <Text style={{ color: '#000080', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 16 }}>
        DRAW YOUR SIGNATURE
      </Text>
      
      <Box className="border-2 rounded-lg" style={{ 
        padding: 8,
        borderColor: '#808080',
        backgroundColor: '#ffffff',
        boxShadow: 'inset 2px 2px 4px #c0c0c0'
      }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          style={{
            cursor: 'crosshair',
            display: 'block',
            width: '400px',
            height: '200px',
            backgroundColor: 'transparent'
          }}
        />
      </Box>
      
      <Text style={{ color: '#008000', fontFamily: 'monospace', fontSize: 12 }}>
        CLICK AND DRAG TO DRAW YOUR SIGNATURE
      </Text>
      
      <HStack space="md" className="items-center">
        <Button
          size="sm"
          className="rounded px-4"
          style={{
            backgroundColor: '#c0c0c0',
            border: '2px outset #c0c0c0'
          }}
          onPress={clearSignature}
        >
          <ButtonText style={{ color: '#000080', fontFamily: 'monospace', fontWeight: 'bold' }}>
            CLEAR
          </ButtonText>
        </Button>
        
        <Button
          size="sm"
          className="rounded px-4"
          style={{
            backgroundColor: '#ff8080',
            border: '2px outset #ff8080'
          }}
          onPress={onCancel}
        >
          <ButtonText style={{ color: '#800000', fontFamily: 'monospace', fontWeight: 'bold' }}>
            CANCEL
          </ButtonText>
        </Button>
        
        <Button
          size="sm"
          className="rounded px-4"
          style={{
            backgroundColor: '#80ff80',
            border: '2px outset #80ff80'
          }}
          onPress={saveSignature}
        >
          <ButtonText style={{ color: '#008000', fontFamily: 'monospace', fontWeight: 'bold' }}>
            SAVE SIGNATURE
          </ButtonText>
        </Button>
      </HStack>
    </VStack>
  );
});

// OPTIMIZED Editable Field Component
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

  // MEMOIZED styles to prevent recreation
  const fieldStyle = useMemo(() => ({
    position: 'absolute',
    left: `${object.x * scale}px`,
    top: `${object.y * scale}px`,
    width: `${object.width * scale}px`,
    height: `${object.height * scale}px`,
    fontSize: object.fontSize ? `${object.fontSize * scale}px` : undefined,
    color: object.color || '#000000',
    border: selected ? '1px solid rgba(0, 123, 255, 0.4)' : 'none',
    backgroundColor: 'transparent',
    borderRadius: '4px',
    padding: '2px',
    cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : (selected ? 'grab' : 'pointer'),
    zIndex: selected ? 1000 : 100,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: object.type === 'checkbox' ? 'center' : 'flex-start',
    userSelect: editing ? 'auto' : 'none',
  }), [object.x, object.y, object.width, object.height, object.fontSize, object.color, object.type, scale, selected, isDragging, editing]);

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
        onStartEdit(object.id); // This will trigger signature modal
      } else {
        onStartEdit(object.id);
      }
      return;
    }
    
    if (object.type === 'checkbox' && !editing) {
      // Double click toggles checkbox, single click starts drag
      if (isDoubleClick) {
        handleContentChange();
        return;
      }
    }
    
    // Start drag operation
    if (!editing) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - object.x * scale,
        y: e.clientY - object.y * scale
      });
    }
  }, [lastClickTime, editing, object.id, object.type, object.x, object.y, scale, onSelect, onStartEdit, handleContentChange]);

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
  }, [object.width, object.height]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && !editing) {
      e.preventDefault();
      const newX = (e.clientX - dragStart.x) / scale;
      const newY = (e.clientY - dragStart.y) / scale;
      
      onUpdate(object.id, { x: newX, y: newY });
    } else if (isResizing) {
      e.preventDefault();
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;
      
      const newWidth = Math.max(20 / scale, resizeStart.width + deltaX / scale);
      const newHeight = Math.max(15 / scale, resizeStart.height + deltaY / scale);
      
      onUpdate(object.id, { width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, editing, dragStart, resizeStart, scale, object.id, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
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
        <div style={{ fontSize: '14px', userSelect: 'none', pointerEvents: editing ? 'none' : 'auto', fontWeight: 'bold' }}>
          {object.content ? '✓' : ''}
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
            color: '#888',
            fontSize: '12px',
            fontStyle: 'italic'
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
            borderRadius: '4px',
            padding: '2px'
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
            borderRadius: '4px',
            padding: '2px'
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
        justifyContent: object.type === 'checkbox' ? 'center' : 'flex-start'
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
      
      {/* Resize Handle - Only show when selected and not editing */}
      {selected && !editing && (
        <div
          style={{
            position: 'absolute',
            bottom: '-5px',
            right: '-5px',
            width: '12px',
            height: '12px',
            backgroundColor: '#007bff',
            border: '2px solid white',
            borderRadius: '3px',
            cursor: 'se-resize',
            zIndex: 1001,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
});

function AppContent() {
  // ===== STATE =====
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentView, setCurrentView] = useState('picker'); // 'picker' | 'editor'
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingFieldId, setSigningFieldId] = useState(null);

  const toast = useToast();

  // PDF Editor hook
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

  // MEMOIZED tools array to prevent recreation
  const tools = useMemo(() => [
    { id: 'text', label: 'Text', icon: '📝', action: () => addTextObject() },
    { id: 'signature', label: 'Signature', icon: '✍️', action: () => {
      setShowSignatureModal(true);
      setSigningFieldId('new');
    }},
    { id: 'date', label: 'Date', icon: '📅', action: () => addDateObject() },
    { id: 'checkbox', label: 'Checkbox', icon: '☑️', action: () => addCheckboxObject() }
  ], [addTextObject, addDateObject, addCheckboxObject]);

  // ===== FILE PICKER =====
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
              <Toast nativeId={id} className="bg-green-500">
                <ToastDescription className="text-white">
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
              <Toast nativeId={id} className="bg-red-500">
                <ToastDescription className="text-white">
                  ❌ Failed to read PDF file
                </ToastDescription>
              </Toast>
            ),
          });
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeId={id} className="bg-red-500">
            <ToastDescription className="text-white">
              ❌ Error selecting file
            </ToastDescription>
          </Toast>
        ),
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // MEMOIZED handlers
  const handleCanvasClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelectedId(null);
    setEditingId(null);
  }, [setSelectedId, setEditingId]);

  const getCurrentPageFields = useCallback(() => {
    return objects.filter(obj => obj.page === currentPage);
  }, [objects, currentPage]);

  // Signature handling
  const handleStartEdit = useCallback((fieldId) => {
    const field = objects.find(obj => obj.id === fieldId);
    if (field && field.type === 'signature') {
      setSigningFieldId(fieldId);
      setShowSignatureModal(true);
    } else {
      setEditingId(fieldId);
    }
  }, [objects, setEditingId]);

  const handleSaveSignature = useCallback((signatureDataURL) => {
    if (signingFieldId === 'new') {
      // Create new signature field with the signature
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
      // Update existing signature field
      updateObject(signingFieldId, { content: signatureDataURL });
    }
    
    setShowSignatureModal(false);
    setSigningFieldId(null);
  }, [signingFieldId, updateObject, getViewportCenter, scale, currentPage, setObjects, setSelectedId]);

  const handleCancelSignature = useCallback(() => {
    setShowSignatureModal(false);
    setSigningFieldId(null);
  }, []);

  // ===== RENDER PICKER VIEW =====
  if (currentView === 'picker') {
    return (
      <Box className="flex-1" style={{ background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 100%)' }}>
        <StatusBar style="auto" />
        
        {/* Retro Header */}
        <Box className="px-6 py-8 border-b-2" style={{ 
          background: 'linear-gradient(to bottom, #c0c0c0, #a0a0a0)',
          borderBottomColor: '#000080',
          boxShadow: 'inset -2px -2px 4px #808080, inset 2px 2px 4px #ffffff'
        }}>
          <VStack space="sm" className="items-center">
            <HStack space="md" className="items-center">
              <Box className="px-3 py-2 rounded" style={{ 
                backgroundColor: '#000080',
                boxShadow: 'inset -1px -1px 2px #000040, inset 1px 1px 2px #4040ff'
              }}>
                <Text className="text-white font-bold text-2xl">💾</Text>
              </Box>
              <VStack>
                <Heading className="text-3xl font-bold" style={{ 
                  color: '#ffffff', 
                  fontFamily: 'Orbitron, monospace',
                  textShadow: '2px 2px 0px #000080, -1px -1px 0px #ffffff'
                }}>
                  PDF PROCESSOR
                </Heading>
                <Text className="text-base font-bold" style={{ 
                  color: '#000080', 
                  fontFamily: 'Share Tech Mono, monospace',
                  backgroundColor: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '2px'
                }}>
                  ENTERPRISE EDITION v3.0
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>
        
        <ScrollView className="flex-1 p-6">
          <Center>
            <Card className="rounded-lg shadow-lg p-8 m-4 w-full max-w-md" style={{
              backgroundColor: '#c0c0c0',
              border: '2px outset #c0c0c0',
              boxShadow: '4px 4px 8px rgba(0,0,0,0.3)'
            }}>
              <VStack space="lg" className="items-center">
                {/* Retro Icon */}
                <Box className="p-6 rounded" style={{ 
                  backgroundColor: '#000080',
                  border: '3px outset #000080',
                  boxShadow: '4px 4px 8px rgba(0,0,0,0.4)'
                }}>
                  <Text className="text-6xl">🗂️</Text>
                </Box>
                
                <VStack space="sm" className="items-center">
                  <Heading className="text-2xl font-bold" style={{ 
                    color: '#ffffff', 
                    fontFamily: 'Orbitron, monospace',
                    textShadow: '2px 2px 0px #000080'
                  }}>
                    LOAD DOCUMENT
                  </Heading>
                  <Text className="text-base text-center font-bold" style={{ 
                    color: '#000080', 
                    fontFamily: 'Share Tech Mono, monospace',
                    backgroundColor: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border: '1px solid #000080'
                  }}>
                    Select PDF for form field integration
                  </Text>
                </VStack>
                
                <Button
                  size="lg"
                  className="w-full rounded"
                  style={{
                    backgroundColor: '#008080',
                    border: '3px outset #008080',
                    boxShadow: '4px 4px 8px rgba(0,0,0,0.4)',
                    padding: '16px'
                  }}
                  onPress={handlePickDocument}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <HStack space="sm" className="items-center">
                      <Spinner size="small" color="white" />
                      <ButtonText className="text-white font-bold text-lg" style={{ 
                        fontFamily: 'Orbitron, monospace'
                      }}>
                        PROCESSING...
                      </ButtonText>
                    </HStack>
                  ) : (
                    <HStack space="sm" className="items-center">
                      <Text className="text-white text-2xl">📁</Text>
                      <ButtonText className="text-white font-bold text-lg" style={{ 
                        fontFamily: 'Orbitron, monospace'
                      }}>
                        SELECT FILE
                      </ButtonText>
                    </HStack>
                  )}
                </Button>
              </VStack>
            </Card>
          </Center>
        </ScrollView>
      </Box>
    );
  }

  // ===== RENDER EDITOR VIEW =====
  return (
    <Box className="flex-1" style={{ backgroundColor: '#c0c0c0' }}>
      <StatusBar style="auto" />
      
      {/* Retro Header */}
      <Box className="px-4 py-3 border-b-2" style={{ 
        background: 'linear-gradient(to bottom, #c0c0c0, #a0a0a0)',
        borderBottomColor: '#808080',
        boxShadow: 'inset -1px -1px 2px #808080, inset 1px 1px 2px #ffffff'
      }}>
        <HStack className="items-center justify-between">
          <HStack space="md" className="items-center">
            <Button
              size="sm"
              variant="outline"
              className="rounded"
              style={{
                backgroundColor: '#c0c0c0',
                borderColor: '#808080',
                border: '2px outset #c0c0c0'
              }}
              onPress={() => setCurrentView('picker')}
            >
              <ButtonText style={{ 
                color: '#ffffff', 
                fontFamily: 'Orbitron, monospace', 
                fontWeight: 'bold',
                textShadow: '1px 1px 0px #000080'
              }}>
                ← BACK
              </ButtonText>
            </Button>
            <VStack>
              <Heading size="md" style={{ 
                color: '#ffffff', 
                fontFamily: 'Orbitron, monospace', 
                fontWeight: 'bold',
                textShadow: '1px 1px 0px #000080'
              }}>
                {selectedFile?.name || 'DOCUMENT.PDF'}
              </Heading>
              <Text size="sm" style={{ 
                color: '#000080', 
                fontFamily: 'Share Tech Mono, monospace',
                backgroundColor: '#ffffff',
                padding: '2px 6px',
                borderRadius: '2px',
                fontWeight: 'bold'
              }}>
                PAGE {currentPage}/{totalPages}
              </Text>
            </VStack>
          </HStack>
          
          <HStack space="sm" className="items-center">
            {isRendering && (
              <Box className="flex-row items-center space-x-2">
                <Spinner size="small" />
                <Text style={{ color: '#800000', fontFamily: 'monospace', fontSize: 10 }}>RENDERING...</Text>
              </Box>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Retro Toolbar */}
      <Box className="px-4 py-2 border-b" style={{ 
        backgroundColor: '#c0c0c0',
        borderBottomColor: '#808080',
        boxShadow: 'inset 0 -1px 1px #ffffff'
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space="sm" className="items-center">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                size="sm"
                className="rounded px-3"
                style={{
                  backgroundColor: '#c0c0c0',
                  border: '2px outset #c0c0c0',
                  boxShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                }}
                onPress={tool.action}
              >
                <ButtonText style={{ color: '#000080', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 11 }}>
                  {tool.icon} {tool.label.toUpperCase()}
                </ButtonText>
              </Button>
            ))}
            
            <Box className="mx-2 h-6 w-px" style={{ backgroundColor: '#808080' }} />
            
            <Button
              size="sm"
              className="rounded px-3"
              style={{
                backgroundColor: '#ff8080',
                border: '2px outset #ff8080',
                boxShadow: '1px 1px 2px rgba(0,0,0,0.3)'
              }}
              onPress={clearAllObjects}
            >
              <ButtonText style={{ color: '#800000', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 11 }}>
                🗑️ DELETE ALL
              </ButtonText>
            </Button>
          </HStack>
        </ScrollView>
      </Box>

      {/* Main Content */}
      <Box className="flex-1" style={{ backgroundColor: '#008080' }}>
        <ScrollView className="flex-1" contentContainerStyle={{ minHeight: '100%', justifyContent: 'center' }} data-scroll-container>
          <Center className="p-4">
            <Box className="rounded-lg overflow-hidden relative" style={{
              backgroundColor: '#ffffff',
              border: '3px inset #c0c0c0',
              boxShadow: '4px 4px 8px rgba(0,0,0,0.4)'
            }}>
              {pdfError ? (
                <Box className="p-8 text-center">
                  <Text style={{ color: '#ff0000', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    ❌ ERROR: {pdfError}
                  </Text>
                  <Button 
                    className="mt-4 rounded"
                    style={{
                      backgroundColor: '#008080',
                      border: '2px outset #008080'
                    }}
                    onPress={() => setCurrentView('picker')}
                  >
                    <ButtonText style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      TRY ANOTHER FILE
                    </ButtonText>
                  </Button>
                </Box>
              ) : (
                <Box className="relative">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{
                      display: 'block',
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                  />
                  
                  {/* Overlay fields for current page */}
                  {getCurrentPageFields().map((object) => (
                    <EditableField
                      key={object.id}
                      object={object}
                      scale={scale}
                      selected={selectedId === object.id}
                      editing={editingId === object.id}
                      onUpdate={updateObject}
                      onSelect={setSelectedId}
                      onStartEdit={handleStartEdit}
                      onFinishEdit={() => setEditingId(null)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Center>
        </ScrollView>
      </Box>

      {/* Retro Bottom Navigation */}
      <Box className="px-4 py-3 border-t-2" style={{ 
        backgroundColor: '#c0c0c0',
        borderTopColor: '#ffffff',
        boxShadow: 'inset 0 1px 1px #ffffff, 0 -1px 1px #808080'
      }}>
        <HStack className="items-center justify-between">
          <HStack space="sm" className="items-center">
            <Button
              size="sm"
              className="rounded px-3"
              style={{
                backgroundColor: currentPage <= 1 ? '#a0a0a0' : '#c0c0c0',
                border: '2px outset #c0c0c0',
                opacity: currentPage <= 1 ? 0.5 : 1
              }}
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <ButtonText style={{ color: '#000080', fontFamily: 'monospace', fontWeight: 'bold' }}>
                ← PREV
              </ButtonText>
            </Button>
            
            <Box className="px-3 py-1 rounded" style={{ 
              backgroundColor: '#000080',
              border: '1px inset #000080'
            }}>
              <Text style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {currentPage}/{totalPages}
              </Text>
            </Box>
            
            <Button
              size="sm"
              className="rounded px-3"
              style={{
                backgroundColor: currentPage >= totalPages ? '#a0a0a0' : '#c0c0c0',
                border: '2px outset #c0c0c0',
                opacity: currentPage >= totalPages ? 0.5 : 1
              }}
              onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              <ButtonText style={{ color: '#000080', fontFamily: 'monospace', fontWeight: 'bold' }}>
                NEXT →
              </ButtonText>
            </Button>
          </HStack>
          
          <HStack space="sm" className="items-center">
            <Text style={{ color: '#008000', fontFamily: 'monospace', fontSize: 11 }}>ZOOM:</Text>
            <Button
              size="sm"
              className="rounded"
              style={{
                backgroundColor: '#c0c0c0',
                border: '2px outset #c0c0c0',
                width: 32,
                height: 32
              }}
              onPress={() => setScale(Math.max(0.25, scale - 0.25))}
              disabled={scale <= 0.25}
            >
              <ButtonText style={{ color: '#000080', fontFamily: 'monospace', fontWeight: 'bold' }}>−</ButtonText>
            </Button>
            <Box className="px-2 py-1 rounded" style={{ 
              backgroundColor: '#000080',
              border: '1px inset #000080',
              minWidth: 50
            }}>
              <ButtonText 
                style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: 10, textAlign: 'center' }}
                onPress={() => setScale(1.0)}
              >
                {Math.round(scale * 100)}%
              </ButtonText>
            </Box>
            <Button
              size="sm"
              className="rounded"
              style={{
                backgroundColor: '#c0c0c0',
                border: '2px outset #c0c0c0',
                width: 32,
                height: 32
              }}
              onPress={() => setScale(Math.min(4, scale + 0.25))}
              disabled={scale >= 4}
            >
              <ButtonText style={{ color: '#000080', fontFamily: 'monospace', fontWeight: 'bold' }}>+</ButtonText>
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Retro Signature Modal */}
      <Modal isOpen={showSignatureModal} onClose={handleCancelSignature}>
        <ModalBackdrop style={{ backgroundColor: 'rgba(128,128,128,0.8)' }} />
        <ModalContent className="rounded" style={{
          backgroundColor: '#c0c0c0',
          border: '3px outset #c0c0c0',
          boxShadow: '4px 4px 8px rgba(0,0,0,0.5)'
        }}>
          <ModalHeader style={{ borderBottom: '2px inset #c0c0c0' }}>
            <HStack className="items-center justify-between w-full">
              <Text style={{ color: '#000080', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 16 }}>
                SIGNATURE PAD v1.0
              </Text>
              <ModalCloseButton 
                className="rounded"
                style={{
                  backgroundColor: '#ff8080',
                  border: '2px outset #ff8080',
                  width: 24,
                  height: 24
                }}
                onPress={handleCancelSignature}
              >
                <Text style={{ color: '#800000', fontFamily: 'monospace', fontWeight: 'bold' }}>×</Text>
              </ModalCloseButton>
            </HStack>
          </ModalHeader>
          <ModalBody style={{ backgroundColor: '#c0c0c0' }}>
            <SignaturePad 
              onSave={handleSaveSignature}
              onCancel={handleCancelSignature}
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