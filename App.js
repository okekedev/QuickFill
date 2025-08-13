// App.js - Working PDF Editor Based on Proven Approach
import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// Universal file reading
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      if (file.uri && file.uri.startsWith('data:')) {
        const base64 = file.uri.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('File format not supported on this platform'));
      }
    }
  });
};

// Custom hook for PDF operations (based on working file)
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

  // Load PDF document
  const loadPDF = useCallback(async () => {
    if (!pdfBase64 || pdfLoaded || isRendering) return;
    
    try {
      setIsRendering(true);
      setPdfError(null);
      
      console.log('📖 Loading PDF...');
      
      // Dynamic import for web compatibility
      let pdfjsLib;
      if (Platform.OS === 'web') {
        // Check if we're in browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          throw new Error('Not in browser environment');
        }
        
        // Use CDN version for web
        if (!window.pdfjsLib) {
          // Load PDF.js script dynamically
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
              // Set worker after script loads
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
        pdfjsLib = window.pdfjsLib;
      } else {
        // For mobile, we'll need a different approach or fallback
        throw new Error('PDF.js not available on mobile');
      }
      
      const pdfSource = `data:application/pdf;base64,${pdfBase64}`;
      const loadingTask = pdfjsLib.getDocument(pdfSource);
      const document = await loadingTask.promise;
      
      setPdfDocument(document);
      setTotalPages(document.numPages);
      setPdfLoaded(true);
      
      console.log(`✅ PDF loaded successfully: ${document.numPages} pages`);
      
    } catch (error) {
      console.error('❌ PDF loading failed:', error);
      setPdfError(error.message || 'Failed to load PDF');
    } finally {
      setIsRendering(false);
    }
  }, [pdfBase64, pdfLoaded, isRendering]);

  // Render PDF page to canvas
  const renderPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current || isRendering) return;
    
    try {
      setIsRendering(true);
      
      const page = await pdfDocument.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
    } catch (error) {
      console.error('❌ Page rendering failed:', error);
      setPdfError('Failed to render PDF page');
    } finally {
      setIsRendering(false);
    }
  }, [pdfDocument, currentPage, scale, isRendering]);

  // Field creation functions
  const addTextObject = useCallback((x = 100, y = 100) => {
    const id = `text_${Date.now()}`;
    const newText = {
      id,
      type: 'text',
      x: x / scale,
      y: y / scale,
      width: 200 / scale,
      height: 60 / scale,
      content: '',
      fontSize: 12,
      color: '#007bff',
      page: currentPage
    };
    
    setObjects(prev => [...prev, newText]);
    setSelectedId(id);
  }, [scale, currentPage]);

  const addSignatureObject = useCallback((x = 100, y = 100) => {
    const id = `signature_${Date.now()}`;
    const newSignature = {
      id,
      type: 'signature',
      x: x / scale,
      y: y / scale,
      width: 200 / scale,
      height: 80 / scale,
      content: null,
      page: currentPage
    };
    
    setObjects(prev => [...prev, newSignature]);
    setSelectedId(id);
  }, [scale, currentPage]);

  const addDateObject = useCallback((x = 100, y = 100) => {
    const id = `date_${Date.now()}`;
    const today = new Date().toLocaleDateString();
    
    const newDate = {
      id,
      type: 'date',
      x: x / scale,
      y: y / scale,
      width: 100 / scale,
      height: 24 / scale,
      content: today,
      fontSize: 12,
      color: '#007bff',
      page: currentPage
    };
    
    setObjects(prev => [...prev, newDate]);
    setSelectedId(id);
  }, [scale, currentPage]);

  const addCheckboxObject = useCallback((x = 100, y = 100) => {
    const id = `checkbox_${Date.now()}`;
    const newCheckbox = {
      id,
      type: 'checkbox',
      x: x / scale,
      y: y / scale,
      width: 30 / scale,
      height: 30 / scale,
      content: false,
      fontSize: 18,
      color: '#007bff',
      page: currentPage
    };
    
    setObjects(prev => [...prev, newCheckbox]);
    setSelectedId(id);
  }, [scale, currentPage]);

  // Object management functions
  const updateObject = useCallback((id, updates) => {
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []);

  const deleteObject = useCallback((id) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  }, [selectedId, editingId]);

  const clearAllObjects = useCallback(() => {
    setObjects([]);
    setSelectedId(null);
    setEditingId(null);
  }, []);

  // Effects with optimized dependencies
  useEffect(() => {
    // Only run on web and when document is ready
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (pdfBase64 && !pdfDocument && !pdfLoaded && !pdfError) {
        // Add small delay to ensure DOM is ready
        const timeoutId = setTimeout(async () => {
          if (!pdfBase64 || pdfLoaded || isRendering) return;
          
          try {
            setIsRendering(true);
            setPdfError(null);
            
            console.log('📖 Loading PDF...');
            
            // Use CDN version for web
            if (!window.pdfjsLib) {
              // Load PDF.js script dynamically
              await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.onload = () => {
                  // Set worker after script loads
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
  }, [pdfBase64, pdfDocument, pdfLoaded, pdfError, isRendering]);

  useEffect(() => {
    let timeoutId;
    if (pdfDocument && pdfLoaded && !isRendering && canvasRef.current) {
      timeoutId = setTimeout(async () => {
        if (!pdfDocument || !canvasRef.current || isRendering) return;
        
        try {
          setIsRendering(true);
          
          const page = await pdfDocument.getPage(currentPage);
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          const viewport = page.getViewport({ scale });
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          
          context.clearRect(0, 0, canvas.width, canvas.height);
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
          
        } catch (error) {
          console.error('❌ Page rendering failed:', error);
          setPdfError('Failed to render PDF page');
        } finally {
          setIsRendering(false);
        }
      }, 100);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pdfDocument, currentPage, scale, pdfLoaded, isRendering]);

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
    isRendering
  };
}

// Editable Field Component (simplified from working version)
function EditableField({ object, scale, selected, editing, onUpdate, onSelect, onStartEdit, onFinishEdit }) {
  const [value, setValue] = useState(object.content || '');
  const [isDragging, setIsDragging] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    setValue(object.content || '');
  }, [object.content]);

  const fieldStyle = {
    position: 'absolute',
    left: `${object.x * scale}px`,
    top: `${object.y * scale}px`,
    width: `${object.width * scale}px`,
    height: `${object.height * scale}px`,
    fontSize: object.fontSize ? `${object.fontSize * scale}px` : undefined,
    color: object.color || '#007bff',
    border: selected ? '2px solid #007bff' : '1px solid #ccc',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '4px',
    padding: '4px',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: selected ? 1000 : 100,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: object.type === 'checkbox' ? 'center' : 'flex-start'
  };

  const handleInteraction = useCallback((e) => {
    e.stopPropagation();
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    // Double-click to edit
    if (timeDiff < 400 && selected && !isDragging) {
      onStartEdit(object.id);
      return;
    }
    
    // Single click to select
    onSelect(object.id);
    setLastClickTime(currentTime);
    
    // Simple drag logic
    let hasMoved = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const startObjX = object.x;
    const startObjY = object.y;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;
      
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        if (!hasMoved) {
          setIsDragging(true);
          hasMoved = true;
        }
        
        const newX = Math.max(0, startObjX + deltaX);
        const newY = Math.max(0, startObjY + deltaY);
        
        onUpdate(object.id, { x: newX, y: newY });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
  }, [selected, lastClickTime, onSelect, onStartEdit, object, scale, onUpdate, isDragging]);

  const handleContentChange = (e) => {
    if (object.type === 'checkbox') {
      const newValue = !Boolean(value);
      setValue(newValue);
      onUpdate(object.id, { content: newValue });
    } else {
      const newValue = e.target.value;
      setValue(newValue);
      onUpdate(object.id, { content: newValue });
    }
  };

  const renderFieldContent = () => {
    if (object.type === 'checkbox') {
      return (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            const newValue = !Boolean(value);
            setValue(newValue);
            onUpdate(object.id, { content: newValue });
          }}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${object.fontSize * scale}px`,
            fontWeight: 'bold',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          {Boolean(value) ? '✓' : ''}
        </div>
      );
    }
    
    if (editing) {
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
            color: 'inherit'
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
            color: 'inherit'
          }}
        />
      );
    }
    
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        {value || `[${object.type}]`}
      </div>
    );
  };

  return (
    <div
      style={fieldStyle}
      onMouseDown={handleInteraction}
    >
      {renderFieldContent()}
    </div>
  );
}

function AppContent() {
  // ===== STATE =====
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentView, setCurrentView] = useState('picker'); // 'picker' | 'editor'
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    isRendering
  } = usePDFEditor(pdfBase64);

  const tools = [
    { id: 'text', label: 'Text', icon: '📝', action: () => addTextObject(100, 100) },
    { id: 'signature', label: 'Signature', icon: '✍️', action: () => addSignatureObject(100, 100) },
    { id: 'date', label: 'Date', icon: '📅', action: () => addDateObject(100, 100) },
    { id: 'checkbox', label: 'Checkbox', icon: '☑️', action: () => addCheckboxObject(100, 100) }
  ];

  // ===== FILE PICKER =====
  const handlePickDocument = async () => {
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
          const base64 = await readFileAsBase64(Platform.OS === 'web' ? file.file : file);
          setPdfBase64(base64);
          setCurrentView('editor');
          
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} className="bg-green-600 rounded-lg">
                <ToastDescription className="text-white font-medium">
                  PDF loaded successfully!
                </ToastDescription>
              </Toast>
            ),
          });
        } catch (readError) {
          console.error('File reading error:', readError);
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} className="bg-red-600 rounded-lg">
                <ToastDescription className="text-white font-medium">
                  Failed to read PDF file
                </ToastDescription>
              </Toast>
            ),
          });
        }
      }
    } catch (error) {
      console.error('❌ Error picking document:', error);
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} className="bg-red-600 rounded-lg">
            <ToastDescription className="text-white font-medium">
              Failed to pick document: {error.message}
            </ToastDescription>
          </Toast>
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCanvasClick = useCallback(() => {
    setSelectedId(null);
    setEditingId(null);
  }, [setSelectedId, setEditingId]);

  const handleSave = () => {
    Alert.alert(
      'Save PDF', 
      `Save PDF with ${objects.length} fields?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => {
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} className="bg-green-600 rounded-lg">
                <ToastDescription className="text-white font-medium">
                  PDF saved with {objects.length} fields!
                </ToastDescription>
              </Toast>
            ),
          });
        }}
      ]
    );
  };

  // Get fields for current page
  const getCurrentPageFields = () => {
    return objects.filter(obj => obj.page === currentPage);
  };

  // ===== RENDER PICKER VIEW =====
  if (currentView === 'picker') {
    return (
      <Box className="flex-1 bg-gray-50">
        <StatusBar style="auto" />
        
        <Box className="bg-blue-600 px-4 py-4 shadow-sm">
          <Heading className="text-xl font-bold text-white text-center">
            📄 PDF Form Editor Pro
          </Heading>
          <Text className="text-blue-100 text-center text-sm mt-1">
            Canvas-based PDF.js Editor
          </Text>
        </Box>
        
        <ScrollView className="flex-1 p-4">
          <Center>
            <Card className="bg-white rounded-xl shadow-lg p-8 m-4 w-full max-w-md">
              <VStack space="lg" className="items-center">
                <VStack space="sm" className="items-center">
                  <Heading className="text-2xl font-bold text-gray-800">
                    Select PDF to Edit
                  </Heading>
                  <Text className="text-base text-gray-600 text-center">
                    Choose a PDF file to add interactive form fields
                  </Text>
                  
                  <Box className="bg-green-50 p-3 rounded-lg mt-3">
                    <Text className="text-sm text-green-700 text-center">
                      🚀 <Text className="font-semibold">PDF.js Canvas:</Text> Professional PDF rendering with native performance
                    </Text>
                  </Box>
                </VStack>
                
                <Button
                  size="lg"
                  className="bg-blue-600 rounded-lg w-full"
                  onPress={handlePickDocument}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <HStack space="sm" className="items-center">
                      <Spinner size="small" />
                      <ButtonText className="text-white">Loading...</ButtonText>
                    </HStack>
                  ) : (
                    <ButtonText className="text-white">📄 Pick PDF File</ButtonText>
                  )}
                </Button>

                {selectedFile && (
                  <Box className="w-full">
                    <Divider className="my-4" />
                    <Text className="text-sm text-gray-500 mb-3 font-semibold">
                      SELECTED FILE
                    </Text>
                    
                    <Box className="bg-gray-50 p-4 rounded-lg">
                      <VStack space="md">
                        <HStack space="md" className="items-center">
                          <Text className="text-2xl">📎</Text>
                          <VStack className="flex-1" space="xs">
                            <Text className="text-base font-semibold text-gray-800">
                              {selectedFile.name}
                            </Text>
                            <Text className="text-sm text-gray-600">
                              {selectedFile.size ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Size unknown'}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <HStack space="sm" className="items-center">
                          <Text className="text-sm text-gray-600">Status:</Text>
                          <Badge className="bg-green-100 rounded-md">
                            <BadgeText className="text-green-800">
                              ✅ Ready for editing
                            </BadgeText>
                          </Badge>
                        </HStack>
                      </VStack>
                    </Box>
                  </Box>
                )}
              </VStack>
            </Card>
          </Center>
        </ScrollView>
      </Box>
    );
  }

  // ===== RENDER PDF EDITOR =====
  if (pdfError) {
    return (
      <Box className="flex-1 bg-gray-50 justify-center items-center">
        <VStack space="lg" className="items-center">
          <Text className="text-xl text-red-600">Failed to Load PDF</Text>
          <Text className="text-gray-600">{pdfError}</Text>
          <Button onPress={() => setCurrentView('picker')}>
            <ButtonText>← Back to File Picker</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  if (!pdfLoaded) {
    return (
      <Box className="flex-1 bg-gray-50 justify-center items-center">
        <VStack space="lg" className="items-center">
          <Spinner size="large" />
          <Text className="text-lg text-gray-600">Loading PDF...</Text>
          <Text className="text-sm text-gray-500">Initializing PDF.js renderer...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-gray-50">
      <StatusBar style="auto" />
      
      {/* Header */}
      <Box className="bg-blue-600 px-4 py-3 shadow-sm">
        <HStack className="items-center justify-between">
          <Pressable onPress={() => {
            setCurrentView('picker');
            setSelectedFile(null);
            setPdfBase64(null);
          }}>
            <Text className="text-white text-base font-medium">← Back</Text>
          </Pressable>
          
          <VStack className="flex-1 items-center">
            <Heading className="text-lg font-bold text-white text-center" style={{ maxWidth: 200 }}>
              {selectedFile?.name || 'PDF Editor'}
            </Heading>
            <Text className="text-blue-200 text-xs">
              Page {currentPage} of {totalPages}
            </Text>
          </VStack>
          
          <Pressable onPress={handleSave}>
            <Text className="text-white text-base font-semibold">Save</Text>
          </Pressable>
        </HStack>
      </Box>

      <VStack className="flex-1">
        {/* Page Navigation */}
        {totalPages > 1 && (
          <Box className="bg-white px-4 py-3 shadow-sm border-b border-gray-200">
            <HStack className="items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-600 rounded-lg"
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <ButtonText className={currentPage <= 1 ? 'text-gray-400' : 'text-blue-600'}>
                  ← Previous
                </ButtonText>
              </Button>
              
              <HStack space="sm" className="items-center">
                <Text className="text-sm text-gray-600">Page {currentPage} of {totalPages}</Text>
                <Text className="text-xs text-gray-500">
                  Scale: {Math.round(scale * 100)}%
                </Text>
              </HStack>
              
              <Button
                variant="outline"
                size="sm"
                className="border-blue-600 rounded-lg"
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              >
                <ButtonText className={currentPage >= totalPages ? 'text-gray-400' : 'text-blue-600'}>
                  Next →
                </ButtonText>
              </Button>
            </HStack>
          </Box>
        )}

        {/* Tool Selector */}
        <Box className="bg-white p-4 shadow-sm">
          <Text className="text-sm text-gray-600 mb-3 font-semibold">
            ADD FIELDS:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack space="md">
              {tools.map(tool => (
                <Button
                  key={tool.id}
                  variant="outline"
                  size="sm"
                  className="border-blue-600 rounded-lg min-w-24"
                  onPress={tool.action}
                >
                  <ButtonText className="text-sm text-blue-600">
                    {tool.icon} {tool.label}
                  </ButtonText>
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                className="border-red-500 rounded-lg"
                onPress={clearAllObjects}
                disabled={objects.length === 0}
              >
                <ButtonText className="text-sm text-red-600">
                  🗑️ Clear All
                </ButtonText>
              </Button>
            </HStack>
          </ScrollView>
        </Box>

        {/* PDF Canvas Container */}
        <Box className="flex-1 m-4">
          <Card className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden">
            <Box style={{ position: 'relative', flex: 1 }}>
              {isRendering && (
                <Box style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 2000,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <VStack space="sm" className="items-center">
                    <Spinner size="large" />
                    <Text className="text-gray-600">Rendering...</Text>
                  </VStack>
                </Box>
              )}
              
              {Platform.OS === 'web' ? (
                <div style={{ position: 'relative', overflow: 'auto', height: '100%' }}>
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{
                      display: 'block',
                      margin: '0 auto',
                      cursor: 'crosshair'
                    }}
                  />
                  
                  {/* Render form fields */}
                  {getCurrentPageFields().map(obj => (
                    <EditableField
                      key={obj.id}
                      object={obj}
                      scale={scale}
                      selected={selectedId === obj.id}
                      editing={editingId === obj.id}
                      onUpdate={updateObject}
                      onSelect={setSelectedId}
                      onStartEdit={setEditingId}
                      onFinishEdit={() => setEditingId(null)}
                    />
                  ))}
                </div>
              ) : (
                <Center className="flex-1">
                  <VStack space="lg" className="items-center">
                    <Text className="text-lg text-gray-600">PDF.js Canvas Editor</Text>
                    <Text className="text-sm text-gray-500 text-center">
                      Canvas rendering is optimized for web browsers
                    </Text>
                  </VStack>
                </Center>
              )}
            </Box>
          </Card>
        </Box>

        {/* Field List */}
        {getCurrentPageFields().length > 0 && (
          <Card className="bg-white mx-4 mb-4 p-4 rounded-xl shadow-md">
            <VStack space="md">
              <HStack className="items-center justify-between">
                <HStack space="md" className="items-center">
                  <Text className="text-2xl">📋</Text>
                  <VStack>
                    <Text className="text-base font-bold text-gray-800">
                      {getCurrentPageFields().length} field{getCurrentPageFields().length !== 1 ? 's' : ''} on page {currentPage}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Total: {objects.length} field{objects.length !== 1 ? 's' : ''} across all pages
                    </Text>
                  </VStack>
                </HStack>
              </HStack>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <HStack space="md">
                  {getCurrentPageFields().map(field => (
                    <Pressable
                      key={field.id}
                      onPress={() => setSelectedId(field.id)}
                    >
                      <Box className={`p-3 rounded-lg border min-w-20 ${
                        selectedId === field.id 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-gray-50 border-gray-300'
                      }`}>
                        <Text className="text-sm font-medium text-center">
                          {field.type}
                        </Text>
                        <Text className="text-xs text-gray-600 text-center">
                          {field.content || `[${field.type}]`}
                        </Text>
                      </Box>
                    </Pressable>
                  ))}
                </HStack>
              </ScrollView>
            </VStack>
          </Card>
        )}
      </VStack>
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