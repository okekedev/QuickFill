// components/pdf/PDFViewer.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, Platform, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { EditableField } from './EditableField';
import { usePDFEditor } from '../../utils/pdfEditor';
import { components, colors, layout } from '../../styles';
import { Button } from '../ui/Button';

// Universal PDF renderer using WebView with PDF.js - works in Expo Go
const UniversalPDFRenderer = ({ pdfBase64, onLoad, style, webViewRef, onScrollChange, onZoomChange, fields = [], onFieldUpdate, selectedFieldId, editingFieldId, onFieldSelect, onFieldEdit }) => {
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [hasCalledOnLoad, setHasCalledOnLoad] = useState(false);
  
  // Reset state when PDF changes
  useEffect(() => {
    setPdfLoaded(false);
    setHasCalledOnLoad(false);
    setError(null);
  }, [pdfBase64]);
  
  // Update WebView when fields change
  useEffect(() => {
    if (webViewRef?.current && pdfLoaded) {
      // Send field updates to WebView
      const fieldUpdates = fields.map(field => ({
        id: field.id,
        selected: selectedFieldId === field.id,
        editing: editingFieldId === field.id,
        content: field.content
      }));
      
      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateFields',
        fields: fieldUpdates
      }));
    }
  }, [fields, selectedFieldId, editingFieldId, pdfLoaded]);
  
  // Create HTML content with PDF.js viewer - zoomable and scrollable like Adobe mobile
  const createPDFViewerHTML = (base64) => {
    const fieldsHTML = fields.map(field => {
      const isSelected = selectedFieldId === field.id;
      const isEditing = editingFieldId === field.id;
      
      return `
        <div 
          id="field-${field.id}" 
          class="pdf-field ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}"
          data-field-id="${field.id}"
          data-field-type="${field.type}"
          style="
            position: absolute;
            left: ${field.x}px;
            top: ${field.y}px;
            width: ${field.width}px;
            height: ${field.height}px;
            border: 2px solid ${isSelected ? '#3b82f6' : 'transparent'};
            background-color: ${isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'};
            cursor: ${isEditing ? 'text' : 'pointer'};
            z-index: 1000;
            font-size: ${field.fontSize || 11}px;
            color: ${field.color || '#000000'};
            padding: 4px;
            box-sizing: border-box;
            ${field.type === 'checkbox' ? 'display: flex; justify-content: center; align-items: center;' : ''}
          "
          onclick="handleFieldClick('${field.id}')"
          ondblclick="handleFieldEdit('${field.id}')"
        >
          ${isEditing && field.type === 'text' ? 
            `<input 
              type="text" 
              id="field-input-${field.id}"
              value="${field.content || ''}"
              style="
                width: 100%;
                height: 100%;
                border: none;
                outline: none;
                background: transparent;
                font-size: inherit;
                color: inherit;
                padding: 0;
                margin: 0;
              "
              onblur="handleFieldSave('${field.id}')"
              onkeydown="handleFieldKeyDown(event, '${field.id}')"
              autofocus
            />` :
            field.type === 'text' ? (field.content || 'Text Field') :
            field.type === 'checkbox' ? (field.content ? '✓' : '') :
            field.type === 'signature' ? (field.content ? `<img src="${field.content}" style="width:100%;height:100%;object-fit:contain;" />` : 'Signature') :
            field.type === 'date' ? (field.content || new Date().toLocaleDateString()) :
            field.type
          }
        </div>
      `;
    }).join('');
    
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>PDF Viewer</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x pan-y;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          #container {
            min-width: 100vw;
            min-height: 100vh;
            overflow: auto;
            position: relative;
            padding: 16px;
          }
          #pdfContainer {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            margin: 20px auto;
            max-width: none;
            width: fit-content;
            position: relative;
          }
          canvas {
            display: block;
            width: 100%;
            height: auto;
            max-width: none;
          }
          #loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            padding: 20px;
            color: #666;
            background: rgba(255,255,255,0.9);
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          #error {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            padding: 20px;
            color: #d32f2f;
            background: #ffebee;
            border-radius: 8px;
            margin: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          /* Custom scrollbars for better visibility */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        </style>
      </head>
      <body>
        <div id="container">
          <div id="loading">
            <div style="font-size: 24px; margin-bottom: 12px;">📄</div>
            <div>Loading PDF...</div>
          </div>
          <div id="pdfContainer" style="display: none; position: relative;">
            ${fieldsHTML}
          </div>
          <div id="error" style="display: none;"></div>
        </div>
        
        
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          let baseScale = 1;
          let currentScale = 1;
          let pdfContainer = null;
          
          // Zoom control functions that can be called from React Native
          function setZoom(scale) {
            if (pdfContainer) {
              currentScale = scale;
              pdfContainer.style.transform = \`scale(\${scale})\`;
              pdfContainer.style.transformOrigin = 'center center';
              
              // Notify React Native about zoom change
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'zoomChanged',
                  zoom: scale,
                  baseScale: baseScale
                }));
              }
            }
          }
          
          function zoomIn() {
            const newScale = Math.min(currentScale * 1.25, 3.0);
            setZoom(newScale);
          }
          
          function zoomOut() {
            const newScale = Math.max(currentScale * 0.8, 0.5);
            setZoom(newScale);
          }
          
          function resetZoom() {
            setZoom(1.0);
          }
          
          // Listen for commands from React Native
          window.addEventListener('message', function(event) {
            const data = event.data;
            if (data.type === 'zoomIn') {
              zoomIn();
            } else if (data.type === 'zoomOut') {
              zoomOut();
            } else if (data.type === 'resetZoom') {
              resetZoom();
            } else if (data.type === 'updateFields') {
              updateFields(data.fields);
            }
          });
          
          // Update field states
          window.updateFields = function(fieldUpdates) {
            fieldUpdates.forEach(function(update) {
              const fieldEl = document.getElementById('field-' + update.id);
              if (fieldEl) {
                // Update selection state
                if (update.selected) {
                  fieldEl.classList.add('selected');
                  fieldEl.style.borderColor = '#3b82f6';
                  fieldEl.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                } else {
                  fieldEl.classList.remove('selected');
                  fieldEl.style.borderColor = 'transparent';
                  fieldEl.style.backgroundColor = 'transparent';
                }
                
                // Update editing state
                if (update.editing && fieldEl.dataset.fieldType === 'text') {
                  fieldEl.classList.add('editing');
                  const input = document.getElementById('field-input-' + update.id);
                  if (!input) {
                    fieldEl.innerHTML = \`<input 
                      type="text" 
                      id="field-input-\${update.id}"
                      value="\${update.content || ''}"
                      style="
                        width: 100%;
                        height: 100%;
                        border: none;
                        outline: none;
                        background: transparent;
                        font-size: inherit;
                        color: inherit;
                        padding: 0;
                        margin: 0;
                      "
                      onblur="handleFieldSave('\${update.id}')"
                      onkeydown="handleFieldKeyDown(event, '\${update.id}')"
                    />\`;
                    setTimeout(() => {
                      const newInput = document.getElementById('field-input-' + update.id);
                      if (newInput) {
                        newInput.focus();
                        newInput.select();
                      }
                    }, 100);
                  }
                } else {
                  fieldEl.classList.remove('editing');
                  if (fieldEl.dataset.fieldType === 'text') {
                    fieldEl.innerHTML = update.content || 'Text Field';
                  }
                }
              }
            });
          };
          
          // Track scroll position and notify React Native
          let lastScrollX = 0;
          let lastScrollY = 0;
          
          function trackScroll() {
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollX !== lastScrollX || scrollY !== lastScrollY) {
              lastScrollX = scrollX;
              lastScrollY = scrollY;
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'scroll',
                  scrollX: scrollX,
                  scrollY: scrollY
                }));
              }
            }
          }
          
          // Listen for scroll events
          window.addEventListener('scroll', trackScroll, { passive: true });
          document.addEventListener('scroll', trackScroll, { passive: true });
          
          // Field interaction handlers
          window.handleFieldClick = function(fieldId) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'fieldSelect',
                fieldId: fieldId
              }));
            }
          };
          
          window.handleFieldEdit = function(fieldId) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'fieldEdit',
                fieldId: fieldId
              }));
            }
          };
          
          window.handleFieldSave = function(fieldId) {
            const input = document.getElementById('field-input-' + fieldId);
            if (input && window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'fieldUpdate',
                fieldId: fieldId,
                content: input.value
              }));
            }
          };
          
          window.handleFieldKeyDown = function(event, fieldId) {
            if (event.key === 'Enter' || event.key === 'Escape') {
              event.preventDefault();
              if (event.key === 'Enter') {
                handleFieldSave(fieldId);
              }
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'fieldEditEnd',
                  fieldId: fieldId
                }));
              }
            }
          };
          
          async function loadPDF() {
            try {
              const pdfData = atob('${base64}');
              const pdfArray = new Uint8Array(pdfData.length);
              for (let i = 0; i < pdfData.length; i++) {
                pdfArray[i] = pdfData.charCodeAt(i);
              }
              
              const pdf = await pdfjsLib.getDocument({ data: pdfArray }).promise;
              const page = await pdf.getPage(1);
              
              // Calculate scale for good initial zoom - larger and centered
              const viewport = page.getViewport({ scale: 1 });
              const containerWidth = window.innerWidth - 32; 
              const containerHeight = window.innerHeight - 64; 
              
              // Scale to fit nicely with good readability - start zoomed in more
              const scaleByWidth = containerWidth / viewport.width;
              const scaleByHeight = containerHeight / viewport.height;
              const fitScale = Math.min(scaleByWidth, scaleByHeight) * 0.8; // Fit with margin
              
              // Use a larger initial scale for better readability
              baseScale = Math.max(fitScale, 1.5); // At least 1.5x scale for readability
              currentScale = 1.0; // Start at 1x relative scale
              
              const scaledViewport = page.getViewport({ scale: baseScale });
              
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              
              // Use device pixel ratio for crisp rendering
              const devicePixelRatio = window.devicePixelRatio || 1;
              canvas.width = scaledViewport.width * devicePixelRatio;
              canvas.height = scaledViewport.height * devicePixelRatio;
              canvas.style.width = scaledViewport.width + 'px';
              canvas.style.height = scaledViewport.height + 'px';
              context.scale(devicePixelRatio, devicePixelRatio);
              
              await page.render({
                canvasContext: context,
                viewport: scaledViewport
              }).promise;
              
              pdfContainer = document.getElementById('pdfContainer');
              pdfContainer.appendChild(canvas);
              pdfContainer.style.display = 'block';
              document.getElementById('loading').style.display = 'none';
              
              // Signal successful load to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'pdfLoaded',
                  pages: pdf.numPages,
                  width: viewport.width,
                  height: viewport.height,
                  baseScale: baseScale
                }));
              }
              
            } catch (error) {
              console.error('PDF loading error:', error);
              document.getElementById('loading').style.display = 'none';
              const errorDiv = document.getElementById('error');
              errorDiv.innerHTML = '<div style="font-size: 24px; margin-bottom: 12px;">⚠️</div><div>Failed to load PDF</div>';
              errorDiv.style.display = 'block';
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'pdfError',
                  error: error.message
                }));
              }
            }
          }
          
          window.onload = loadPDF;
        </script>
      </body>
    </html>
    `;
  };
  
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'pdfLoaded' && !hasCalledOnLoad) {
        console.log('Universal PDF loaded:', data.pages, 'pages, dimensions:', data.width, 'x', data.height, 'baseScale:', data.baseScale);
        setPdfLoaded(true);
        setHasCalledOnLoad(true);
        onLoad?.(data.pages, { width: data.width, height: data.height, baseScale: data.baseScale });
      } else if (data.type === 'pdfError') {
        console.error('Universal PDF error:', data.error);
        setError('Failed to load PDF');
      } else if (data.type === 'scroll') {
        // Update scroll offset for field positioning
        onScrollChange?.({ x: data.scrollX, y: data.scrollY });
      } else if (data.type === 'zoomChanged') {
        // Update zoom scale for field positioning
        onZoomChange?.(data.zoom);
      } else if (data.type === 'fieldSelect') {
        onFieldSelect?.(data.fieldId);
      } else if (data.type === 'fieldEdit') {
        onFieldEdit?.(data.fieldId);
      } else if (data.type === 'fieldUpdate') {
        onFieldUpdate?.(data.fieldId, { content: data.content });
      } else if (data.type === 'fieldEditEnd') {
        onFieldEdit?.(null);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };
  
  if (!pdfBase64) {
    return (
      <View style={[{
        width: 350,
        height: 500,
        borderRadius: 8,
        backgroundColor: colors.gray[50],
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center'
      }, style]}>
        <MaterialIcons name="picture-as-pdf" size={48} color={colors.primary[400]} />
        <Text style={[components.bodyText, { color: colors.text.secondary, marginTop: 12 }]}>
          No PDF loaded
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[{
      flex: 1,
      width: '100%',
      height: '100%',
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border
    }, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: createPDFViewerHTML(pdfBase64) }}
        style={{ flex: 1 }}
        onMessage={handleWebViewMessage}
        onError={(error) => {
          console.error('WebView error:', error);
          setError('Failed to load PDF viewer');
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.gray[50]
          }}>
            <MaterialIcons name="picture-as-pdf" size={48} color={colors.primary[400]} />
            <Text style={[components.bodyText, { color: colors.text.secondary, marginTop: 12 }]}>
              Loading PDF Viewer...
            </Text>
          </View>
        )}
        // Enable full scrolling and zooming like Adobe mobile
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Allow scrolling but disable pinch-to-zoom
        scalesPageToFit={false}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={true}
        showsVerticalScrollIndicator={true}
        bounces={true}
        nestedScrollEnabled={true}
        // Disable zoom gestures to prevent conflicts
        allowsBackForwardNavigationGestures={false}
        pinchGestureEnabled={false}
        // Security settings
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        // Additional mobile optimization
        useWebKit={true}
        allowsLinkPreview={false}
      />
    </View>
  );
};

// Web PDF renderer using PDF.js
const WebPDFRenderer = ({ pdfBase64, onLoad, onPageChange, style }) => {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        // Load PDF.js if not already loaded
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            loadPDFDocument();
          };
          document.head.appendChild(script);
        } else {
          loadPDFDocument();
        }

        async function loadPDFDocument() {
          const pdfData = atob(pdfBase64);
          const pdfArray = new Uint8Array(pdfData.length);
          for (let i = 0; i < pdfData.length; i++) {
            pdfArray[i] = pdfData.charCodeAt(i);
          }

          const pdf = await window.pdfjsLib.getDocument({ data: pdfArray }).promise;
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setIsLoading(false);
          
          // Get dimensions and notify parent
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1 });
          onLoad?.(pdf.numPages, { width: viewport.width, height: viewport.height });
          
          // Render first page
          renderPage(pdf, 1);
        }
      } catch (error) {
        console.error('Web PDF loading error:', error);
        setIsLoading(false);
      }
    };

    if (pdfBase64) {
      loadPDF();
    }
  }, [pdfBase64]);

  const renderPage = async (pdf, pageNum) => {
    if (!pdf || !canvasRef.current) return;
    
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale: 1.2 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      setCurrentPage(pageNum);
      onPageChange?.(pageNum, totalPages);
    } catch (error) {
      console.error('Web PDF rendering error:', error);
    }
  };

  const handlePrevPage = () => {
    if (pdfDoc && currentPage > 1) {
      renderPage(pdfDoc, currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pdfDoc && currentPage < totalPages) {
      renderPage(pdfDoc, currentPage + 1);
    }
  };

  if (isLoading) {
    return (
      <View style={[{
        width: 400,
        height: 500,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.gray[50],
        borderRadius: 8
      }, style]}>
        <MaterialIcons name="picture-as-pdf" size={48} color={colors.primary[400]} />
        <Text style={[components.bodyText, { color: colors.text.secondary, marginTop: 12 }]}>
          Loading PDF...
        </Text>
      </View>
    );
  }

  return (
    <View style={[{
      backgroundColor: colors.white,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border
    }, style]}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
      
      {/* Page controls */}
      {totalPages > 1 && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 10,
          backgroundColor: colors.gray[50],
          borderTopWidth: 1,
          borderTopColor: colors.border
        }}>
          <Button
            title="‹"
            onPress={handlePrevPage}
            disabled={currentPage <= 1}
            variant="secondary"
            style={{ marginRight: 10, minWidth: 40 }}
          />
          <Text style={[components.bodyText, { marginHorizontal: 15 }]}>
            {currentPage} / {totalPages}
          </Text>
          <Button
            title="›"
            onPress={handleNextPage}
            disabled={currentPage >= totalPages}
            variant="secondary"
            style={{ marginLeft: 10, minWidth: 40 }}
          />
        </View>
      )}
    </View>
  );
};

export const PDFViewer = React.forwardRef(({ 
  pdfBase64: externalPdfBase64,
  objects: externalObjects,
  onFieldUpdate,
  onFieldSelect,
  onFieldEdit,
  onFieldDelete,
  selectedFieldId,
  editingFieldId,
  scale: externalScale,
  setScale: externalSetScale,
  currentPage: externalCurrentPage,
  setCurrentPage: externalSetCurrentPage,
  totalPages: externalTotalPages,
  onFileSelect,
  style,
  ...props 
}, ref) => {
  const [pdfDimensions, setPdfDimensions] = useState({ width: 595, height: 842 });
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfZoomScale, setPdfZoomScale] = useState(1);
  const [pdfBaseScale, setPdfBaseScale] = useState(1);
  const [webViewScrollOffset, setWebViewScrollOffset] = useState({ x: 0, y: 0 });
  const webViewRef = useRef(null);
  
  // PDF Editor Hook for field management
  const {
    objects: internalObjects,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    updateObject,
    deleteObject,
  } = usePDFEditor(externalPdfBase64);

  // Use external props if provided, otherwise use internal state
  const objects = externalObjects || internalObjects;
  const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : pdfCurrentPage;
  const setCurrentPage = externalSetCurrentPage || setPdfCurrentPage;
  const totalPages = externalTotalPages !== undefined ? externalTotalPages : pdfTotalPages;

  // Sync external field selection with internal state
  useEffect(() => {
    if (selectedFieldId !== selectedId) {
      setSelectedId(selectedFieldId);
    }
  }, [selectedFieldId, selectedId, setSelectedId]);

  useEffect(() => {
    if (editingFieldId !== editingId) {
      setEditingId(editingFieldId);
    }
  }, [editingFieldId, editingId, setEditingId]);

  const handlePdfLoad = (numberOfPages, dimensions) => {
    console.log('PDF loaded:', numberOfPages, 'pages, dimensions:', dimensions);
    
    // Only update state if values have actually changed
    setPdfDimensions(prev => {
      if (prev.width !== dimensions.width || prev.height !== dimensions.height) {
        return dimensions;
      }
      return prev;
    });
    
    setPdfTotalPages(prev => {
      if (prev !== numberOfPages) {
        return numberOfPages;
      }
      return prev;
    });
    
    // Set the base scale from the PDF renderer
    if (dimensions.baseScale) {
      setPdfBaseScale(dimensions.baseScale);
      setPdfZoomScale(1); // Reset to 1x since zoom is disabled
    }
  };

  const handlePdfPageChange = (page, numberOfPages) => {
    console.log('PDF page changed:', page, 'of', numberOfPages);
    setPdfCurrentPage(page);
    if (externalSetCurrentPage) {
      externalSetCurrentPage(page);
    }
  };

  // Zoom control methods
  const zoomIn = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'zoomIn' }));
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'zoomOut' }));
    }
  }, []);

  const resetZoom = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'resetZoom' }));
    }
  }, []);

  // Expose zoom methods via ref
  React.useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut,
    resetZoom
  }), [zoomIn, zoomOut, resetZoom]);

  // Handle clicks outside fields to deselect - must be defined before any returns
  const handleContainerPress = useCallback(() => {
    if (onFieldSelect) {
      onFieldSelect(null);
    } else {
      setSelectedId(null);
    }
  }, [onFieldSelect, setSelectedId]);

  const handleFieldUpdate = (fieldId, updates) => {
    if (onFieldUpdate) {
      onFieldUpdate(fieldId, updates);
    } else {
      updateObject(fieldId, updates);
    }
  };

  const handleFieldDelete = (fieldId) => {
    if (onFieldDelete) {
      onFieldDelete(fieldId);
    } else {
      deleteObject(fieldId);
    }
  };

  // Get fields for current page only
  const currentFields = objects.filter(obj => obj.page === currentPage);

  const renderPDFContent = () => {
    if (Platform.OS === 'web') {
      return (
        <WebPDFRenderer
          pdfBase64={externalPdfBase64}
          onLoad={handlePdfLoad}
          onPageChange={handlePdfPageChange}
        />
      );
    } else {
      // iOS/Android - use universal WebView PDF renderer (Expo Go compatible)
      return (
        <UniversalPDFRenderer
          pdfBase64={externalPdfBase64}
          onLoad={handlePdfLoad}
          webViewRef={webViewRef}
          onScrollChange={setWebViewScrollOffset}
          onZoomChange={setPdfZoomScale}
          fields={currentFields}
          onFieldUpdate={handleFieldUpdate}
          selectedFieldId={selectedFieldId}
          editingFieldId={editingFieldId}
          onFieldSelect={onFieldSelect}
          onFieldEdit={onFieldEdit}
        />
      );
    }
  };

  console.log('PDFViewer render:', {
    pdfBase64: !!externalPdfBase64,
    platform: Platform.OS,
    currentPage,
    totalPages,
    fieldsCount: currentFields.length
  });

  // Show upload screen if no PDF
  if (!externalPdfBase64) {
    return (
      <View style={[{ flex: 1 }, style]} {...props}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}
        >
          <View style={[layout.center, { padding: 50 }]}>
            {onFileSelect ? (
              <View style={[components.card, layout.center, { backgroundColor: colors.white, borderRadius: 12, padding: 32, maxWidth: 320 }]}>
                <View style={{ marginBottom: 20, alignItems: 'center' }}>
                  <MaterialIcons name="picture-as-pdf" size={64} color={colors.primary[500]} />
                </View>
                <Text style={[components.bodyText, { textAlign: 'center', marginBottom: 24, fontSize: 14 }]}>
                  Upload a PDF to start adding fields and signatures
                </Text>
                <Button 
                  title="Choose PDF File" 
                  onPress={onFileSelect}
                  icon={<MaterialIcons name="upload-file" size={18} color={colors.white} />}
                  style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                />
              </View>
            ) : (
              <Text style={[components.bodyText, { textAlign: 'center', color: colors.text.secondary }]}>
                No PDF loaded
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, style]} {...props}>
      <View 
        style={{ 
          flex: 1,
          position: 'relative',
          backgroundColor: colors.white,
          borderRadius: 12,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          margin: 10
        }}
        onTouchStart={Platform.OS !== 'web' ? handleContainerPress : undefined}
        onPress={Platform.OS === 'web' ? handleContainerPress : undefined}
      >
          {/* WebView PDF Content with integrated fields */}
          {renderPDFContent()}
          
          {/* Web Fields Overlay */}
          {Platform.OS === 'web' && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'box-none'
            }}>
              {currentFields.map((field) => {
                const effectiveScale = 1.2;
                const containerOffset = { x: 0, y: 0 };
                
                return (
                  <EditableField
                    key={field.id}
                    field={field}
                    scale={effectiveScale}
                    pdfDimensions={pdfDimensions}
                    containerOffset={containerOffset}
                    isSelected={selectedId === field.id}
                    isEditing={editingId === field.id}
                    onSelect={onFieldSelect}
                    onUpdate={handleFieldUpdate}
                    onEditStart={(id) => onFieldEdit?.(id)}
                    onEditEnd={() => onFieldEdit?.(null)}
                    onDelete={handleFieldDelete}
                    style={{ pointerEvents: 'auto' }}
                  />
                );
              })}
            </View>
          )}
        </View>
    </View>
  );
});