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
        const devicePixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * devicePixelRatio });
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / devicePixelRatio}px`;
        canvas.style.height = `${viewport.height / devicePixelRatio}px`;
        
        context.scale(devicePixelRatio, devicePixelRatio);
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        const renderContext = {
          canvasContext: context,
          viewport: page.getViewport({ scale })
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
    <VStack space="md" className="items-center">
      <Heading size="lg" className="text-primary-600 font-semibold flex items-center">
        <HeroIcon path={icons.pencil} className="w-6 h-6 mr-2 text-primary-500" />
        <span className="text-windows-gradient">Create Your Signature</span>
      </Heading>
      
      <Box className="window-xp p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          className="shadow-xp-inset rounded-xp bg-background-0 border-2 border-outline-300"
          style={{
            cursor: 'crosshair',
            display: 'block',
            width: '400px',
            height: '200px'
          }}
        />
      </Box>
      
      <Text className="text-typography-600 text-sm font-medium">
        Click and drag to draw your signature
      </Text>
      
      <HStack space="md" className="items-center">
        <Button className="btn-windows-grey" onPress={clearSignature}>
          <HeroIcon path={icons.refresh} className="w-4 h-4 mr-2 text-white" />
          <ButtonText className="text-white font-bold">Clear</ButtonText>
        </Button>
        
        <Button className="btn-windows-red" onPress={onCancel}>
          <HeroIcon path={icons.x} className="w-4 h-4 mr-2 text-white" />
          <ButtonText className="text-white font-bold">Cancel</ButtonText>
        </Button>
        
        <Button className="btn-windows-green" onPress={saveSignature}>
          <HeroIcon path={icons.check} className="w-4 h-4 mr-2 text-white" />
          <ButtonText className="text-white font-bold">Save</ButtonText>
        </Button>
      </HStack>
    </VStack>
  );
});

// Simple Editable Field Component
const EditableField = React.memo(({ object, scale, selected, editing, onUpdate, onSelect, onStartEdit, onFinishEdit }) => {
  const [value, setValue] = useState(object.content || '');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setValue(object.content || '');
  }, [object.content]);

  const fieldStyle = useMemo(() => ({
    position: 'absolute',
    left: `${object.x * scale}px`,
    top: `${object.y * scale}px`,
    width: `${object.width * scale}px`,
    height: `${object.height * scale}px`,
    fontSize: object.fontSize ? `${object.fontSize * scale}px` : undefined,
    color: object.color || '#000000',
    border: selected ? '2px solid rgb(var(--color-primary-500))' : '1px solid transparent',
    backgroundColor: selected ? 'rgba(var(--color-primary-50), 0.1)' : 'transparent',
    borderRadius: '4px',
    padding: '4px',
    cursor: isDragging ? 'grabbing' : (selected ? 'grab' : 'pointer'),
    zIndex: selected ? 1000 : 100,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: object.type === 'checkbox' ? 'center' : 'flex-start',
    userSelect: editing ? 'auto' : 'none',
    boxShadow: selected ? '0 2px 8px rgba(var(--color-primary-500), 0.3)' : 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, system-ui, sans-serif'
  }), [object, scale, selected, isDragging, editing]);

  return (
    <div style={fieldStyle} onClick={() => onSelect(object.id)}>
      {object.type === 'checkbox' ? (
        <div className={`checkbox-xp ${object.content ? 'checked' : ''}`} style={{ 
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px'
        }}>
          {object.content ? '✓' : ''}
        </div>
      ) : (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          fontWeight: '500'
        }}>
          {value || `[${object.type}]`}
        </div>
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

  // Home Screen - Clean and Simple with Windows Logo Theme
  if (currentView === 'picker') {
    return (
      <Box className="flex-1 bg-gradient-to-br from-background-0 to-background-100 min-h-screen">
        <StatusBar style="auto" />
        
        <Center className="flex-1 px-6">
          <VStack space="2xl" className="items-center max-w-md w-full">
            
            {/* Brand Header with Windows Colors */}
            <VStack space="lg" className="items-center">
              <Heading className="text-6xl font-bold text-light-blue-gradient animate-stagger-1">
                QuickSign
              </Heading>
              <HStack space="md" className="items-center animate-float animate-stagger-2">
                <Box className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg animate-glow-1">
                  <HeroIcon path={icons.pencil} className="w-6 h-6 text-white" />
                </Box>
                <Box className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg animate-glow-2">
                  <HeroIcon path={icons.documentText} className="w-6 h-6 text-white" />
                </Box>
                <Box className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg animate-glow-3">
                  <HeroIcon path={icons.calendar} className="w-6 h-6 text-white" />
                </Box>
                <Box className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg animate-glow-4">
                  <HeroIcon path={icons.checkCircle} className="w-6 h-6 text-white" />
                </Box>
              </HStack>
            </VStack>

            {/* Upload Section with Windows Logo Styling */}
            <VStack space="xl" className="items-center w-full">
              
              {/* Large Upload Zone with Windows Logo Border */}
              <Box className="upload-zone-windows p-12 w-full animate-stagger-3">
                <VStack space="md" className="items-center">
                  <HeroIcon path={icons.upload} className="w-24 h-24 text-primary-500 animate-pulse-icon" />
                  <Text className="text-typography-600 font-semibold text-lg">
                    Drop your PDF here or click to browse
                  </Text>
                </VStack>
              </Box>

              {/* Windows Logo Animated Upload Button */}
              <Button
                size="xl"
                className="btn-windows-animated w-full animate-stagger-4"
                onPress={handlePickDocument}
                disabled={isLoading}
              >
                {isLoading ? (
                  <HStack space="sm" className="items-center">
                    <div className="spinner-fb" />
                    <ButtonText className="text-white font-bold text-xl">
                      Processing...
                    </ButtonText>
                  </HStack>
                ) : (
                  <HStack space="sm" className="items-center">
                    <HeroIcon path={icons.documentText} className="w-7 h-7 text-white" />
                    <ButtonText className="text-white font-bold text-xl">
                      Choose PDF File
                    </ButtonText>
                  </HStack>
                )}
              </Button>

              {/* Feature Highlights with Windows Colors */}
              <HStack space="sm" className="items-center justify-center flex-wrap">
                <Box className="badge-windows-red">
                  <Text className="text-white font-bold text-xs">SIGN</Text>
                </Box>
                <Box className="badge-windows-orange">
                  <Text className="text-white font-bold text-xs">TEXT</Text>
                </Box>
                <Box className="badge-windows-yellow">
                  <Text className="text-white font-bold text-xs">DATE</Text>
                </Box>
                <Box className="badge-windows-green">
                  <Text className="text-white font-bold text-xs">CHECK</Text>
                </Box>
              </HStack>

              <Text className="text-center text-typography-600 text-sm font-medium max-w-xs leading-relaxed">
                Add signatures, text fields, dates, and checkboxes to your PDF documents
              </Text>
            </VStack>

          </VStack>
        </Center>
      </Box>
    );
  }

  // Editor View
  return (
    <Box className="flex-1 bg-background-50">
      <StatusBar style="auto" />
      
      {/* Simple Header */}
      <Box className="nav-fb border-b">
        <Box className="px-4 py-3">
          <HStack className="items-center justify-between">
            <HStack space="md" className="items-center">
              <Button
                size="sm"
                className="nav-fb-item"
                onPress={() => setCurrentView('picker')}
              >
                <HStack space="xs" className="items-center">
                  <HeroIcon path={icons.chevronLeft} className="w-4 h-4" />
                  <ButtonText className="font-semibold">Back</ButtonText>
                </HStack>
              </Button>
              <VStack>
                <Heading size="md" className="text-typography-800 font-bold">
                  {selectedFile?.name || 'Document.pdf'}
                </Heading>
                <Box className="badge-windows-green">
                  <Text className="text-white font-bold text-xs">Page {currentPage} of {totalPages}</Text>
                </Box>
              </VStack>
            </HStack>
            
            {isRendering && (
              <HStack space="sm" className="items-center">
                <div className="spinner-fb" />
                <Text className="text-typography-600 text-sm">Rendering...</Text>
              </HStack>
            )}
          </HStack>
        </Box>
      </Box>

      {/* Tools with Windows Logo Colors */}
      <Box className="nav-fb border-b">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space="sm" className="items-center px-4 py-2">
            {tools.map((tool, index) => {
              const colorClasses = [
                'btn-windows-red',
                'btn-windows-grey', 
                'btn-windows-yellow',
                'btn-windows-green'
              ];
              const animationClasses = [
                'animate-glow-1',
                'animate-glow-2',
                'animate-glow-3',
                'animate-glow-4'
              ];
              const colorClass = colorClasses[index % colorClasses.length];
              const animationClass = animationClasses[index % animationClasses.length];
              
              return (
                <Button
                  key={tool.id}
                  size="sm"
                  className={`${colorClass} ${animationClass}`}
                  onPress={tool.action}
                >
                  <HStack space="xs" className="items-center">
                    <HeroIcon path={tool.icon} className="w-4 h-4 text-white" />
                    <ButtonText className="text-white font-bold text-sm">{tool.label}</ButtonText>
                  </HStack>
                </Button>
              );
            })}
            
            <Box className="w-px h-6 bg-outline-300 mx-2" />
            
            <Button
              size="sm"
              className="nav-fb-item bg-error-50 hover:bg-error-100"
              onPress={clearAllObjects}
            >
              <HStack space="xs" className="items-center">
                <HeroIcon path={icons.x} className="w-4 h-4 text-error-600" />
                <ButtonText className="text-error-600 font-medium text-sm">Clear All</ButtonText>
              </HStack>
            </Button>
          </HStack>
        </ScrollView>
      </Box>

      {/* PDF Viewer */}
      <Box className="flex-1 bg-background-100">
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
                    <Button className="btn-xp mt-4" onPress={() => setCurrentView('picker')}>
                      <ButtonText className="text-white font-semibold">Try Another File</ButtonText>
                    </Button>
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

      {/* Bottom Controls */}
      <Box className="nav-fb border-t">
        <Box className="px-4 py-3">
          <HStack className="items-center justify-between">
            <HStack space="sm" className="items-center">
              <Button
                size="sm"
                className="btn-windows-red"
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <HStack space="xs" className="items-center">
                  <HeroIcon path={icons.chevronLeft} className="w-4 h-4 text-white" />
                  <ButtonText className="text-white font-bold">Previous</ButtonText>
                </HStack>
              </Button>
              
              <Box className="badge-windows-yellow px-4 py-2">
                <Text className="text-white font-bold font-mono">{currentPage} / {totalPages}</Text>
              </Box>
              
              <Button
                size="sm"
                className="btn-windows-green"
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              >
                <HStack space="xs" className="items-center">
                  <ButtonText className="text-white font-bold">Next</ButtonText>
                  <HeroIcon path={icons.chevronRight} className="w-4 h-4 text-white" />
                </HStack>
              </Button>
            </HStack>
            
            <HStack space="sm" className="items-center">
              <Button
                size="sm"
                className="btn-windows-orange"
                onPress={() => setScale(Math.max(0.25, scale - 0.25))}
                disabled={scale <= 0.25}
              >
                <HeroIcon path={icons.zoomOut} className="w-4 h-4 text-white" />
              </Button>
              <Box className="badge-windows-red px-3 py-2">
                <Text className="text-white font-bold font-mono text-xs" onPress={() => setScale(1.0)}>
                  {Math.round(scale * 100)}%
                </Text>
              </Box>
              <Button
                size="sm"
                className="btn-windows-orange"
                onPress={() => setScale(Math.min(4, scale + 0.25))}
                disabled={scale >= 4}
              >
                <HeroIcon path={icons.zoomIn} className="w-4 h-4 text-white" />
              </Button>
            </HStack>
          </HStack>
        </Box>
      </Box>

      {/* Signature Modal */}
      <Modal isOpen={showSignatureModal} onClose={() => setShowSignatureModal(false)}>
        <ModalBackdrop className="bg-black/50 backdrop-blur-sm" />
        <ModalContent className="window-xp m-4 max-w-lg shadow-xp">
          <ModalHeader className="window-xp-header">
            <HStack className="items-center justify-between w-full">
              <Heading className="text-white font-semibold text-shadow-xp">
                Digital Signature
              </Heading>
              <ModalCloseButton 
                className="p-2 rounded-fb bg-error-500 shadow-fb"
                onPress={() => setShowSignatureModal(false)}
              >
                <HeroIcon path={icons.x} className="w-4 h-4 text-white" />
              </ModalCloseButton>
            </HStack>
          </ModalHeader>
          <ModalBody className="bg-background-0 p-6">
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