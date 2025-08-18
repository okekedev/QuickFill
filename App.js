// App.js - EVERYTHING IN ONE FILE (FIXED)
import React, { useState, useCallback, useRef, createContext, useContext, Component } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, Platform, TextInput, Image, Animated, PanResponder } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ============================================================================
// STYLES - All in one place
// ============================================================================
const colors = {
  primary: '#3b82f6',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#000000',
  gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 500: '#6b7280', 600: '#4b5563' },
  text: { primary: '#1f2937', secondary: '#6b7280' },
  background: '#f8fafc',
  border: '#e5e7eb',
};

const styles = {
  container: { flex: 1, backgroundColor: colors.background },
  button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.border },
  buttonSuccess: { backgroundColor: colors.success },
  buttonError: { backgroundColor: colors.error },
  buttonText: { fontSize: 16, fontWeight: '600', color: colors.white },
  buttonTextSecondary: { color: colors.text.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.white, borderRadius: 12, padding: 20, maxWidth: '90%', minWidth: 300 },
  bodyText: { fontSize: 16, color: colors.text.primary, lineHeight: 24 },
  heading3: { fontSize: 18, fontWeight: '600', color: colors.text.primary },
};

// ============================================================================
// UTILITIES - All PDF functions
// ============================================================================
const pickPDFFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return { success: false, canceled: true };
    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      return { success: true, uri: file.uri, name: file.name, size: file.size };
    }
    return { success: false, error: 'No file selected' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const readFileAsBase64 = async (fileAsset) => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      if (fileAsset.uri) {
        fetch(fileAsset.uri)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
          .catch(reject);
      } else {
        reject(new Error('No valid file found'));
      }
    } else {
      if (fileAsset.uri) {
        FileSystem.readAsStringAsync(fileAsset.uri, { encoding: FileSystem.EncodingType.Base64 })
          .then(base64 => {
            if (!base64 || base64.length === 0) {
              reject(new Error('Empty file'));
              return;
            }
            resolve(base64);
          })
          .catch(error => reject(new Error(`Failed to read file: ${error.message}`)));
      } else {
        reject(new Error('No valid URI found'));
      }
    }
  });
};

const exportPDFWithFields = async (originalPdfBase64, fields) => {
  try {
    const pdfDoc = await PDFDocument.load(originalPdfBase64, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const fieldsByPage = {};
    fields.forEach(field => {
      if (!fieldsByPage[field.page]) fieldsByPage[field.page] = [];
      fieldsByPage[field.page].push(field);
    });
    
    for (let pageNum = 1; pageNum <= pages.length; pageNum++) {
      const page = pages[pageNum - 1];
      const pageFields = fieldsByPage[pageNum] || [];
      const { height: pageHeight } = page.getSize();
      
      for (const field of pageFields) {
        const x = field.x;
        const y = pageHeight - field.y - field.height;
        
        switch (field.type) {
          case 'text':
            if (field.content && field.content.trim()) {
              page.drawText(field.content, {
                x: x + 2,
                y: y + field.height / 2 - 6,
                size: field.fontSize || 12,
                font: helveticaFont,
                color: rgb(0, 0, 0)
              });
            }
            break;
          case 'date':
            if (field.content) {
              page.drawText(field.content, {
                x: x + 2,
                y: y + field.height / 2 - 6,
                size: field.fontSize || 12,
                font: helveticaFont,
                color: rgb(0, 0, 0)
              });
            }
            break;
          case 'checkbox':
            if (field.content === true) {
              page.drawText('X', {
                x: x + field.width / 2 - 4,
                y: y + field.height / 2 - 6,
                size: Math.min(field.width * 0.8, 16),
                font: helveticaBoldFont,
                color: rgb(0, 0, 0)
              });
            }
            break;
          case 'signature':
            if (field.content && field.content.startsWith('data:image/')) {
              try {
                const base64Data = field.content.split(',')[1];
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                const image = await pdfDoc.embedPng(imageBytes);
                const imageDims = image.scale(1);
                const scale = Math.min(field.width / imageDims.width, field.height / imageDims.height, 1);
                const scaledWidth = imageDims.width * scale;
                const scaledHeight = imageDims.height * scale;
                page.drawImage(image, {
                  x: x + (field.width - scaledWidth) / 2,
                  y: y + (field.height - scaledHeight) / 2,
                  width: scaledWidth,
                  height: scaledHeight
                });
              } catch (e) {
                console.warn('Failed to embed signature:', e);
              }
            }
            break;
        }
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    return { success: true, pdfBytes, blob: new Blob([pdfBytes], { type: 'application/pdf' }) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const downloadPDF = (pdfBytes, filename = 'filled_form.pdf') => {
  try {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================================
// TOAST CONTEXT
// ============================================================================
const ToastContext = createContext(null);

const ToastProvider = ({ children }) => {
  const showToast = (message, type = 'success') => {
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert(type === 'error' ? 'Error' : 'Success', message, [{ text: 'OK' }]);
    }
  };
  return React.createElement(ToastContext.Provider, { value: { showToast } }, children);
};

const useToast = () => useContext(ToastContext);

// ============================================================================
// ERROR BOUNDARY
// ============================================================================
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return React.createElement(View, { 
        style: [styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }] 
      }, [
        React.createElement(Text, { 
          key: 'error-text',
          style: [styles.heading3, { marginBottom: 16, textAlign: 'center' }] 
        }, 'Something went wrong'),
        React.createElement(TouchableOpacity, {
          key: 'restart-button',
          style: [styles.button, styles.buttonPrimary],
          onPress: () => this.setState({ hasError: false })
        }, React.createElement(Text, { style: styles.buttonText }, 'Restart'))
      ]);
    }
    return this.props.children;
  }
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================
const Button = ({ title, onPress, variant = 'primary', disabled, loading, icon, style, children }) => {
  const getButtonStyle = () => {
    const base = styles.button;
    switch (variant) {
      case 'secondary': return [base, styles.buttonSecondary];
      case 'success': return [base, styles.buttonSuccess];
      case 'error': return [base, styles.buttonError];
      default: return [base, styles.buttonPrimary];
    }
  };

  const getTextStyle = () => {
    return variant === 'secondary' ? [styles.buttonText, styles.buttonTextSecondary] : [styles.buttonText];
  };

  return React.createElement(TouchableOpacity, {
    style: [getButtonStyle(), disabled && { opacity: 0.5 }, style],
    onPress: onPress,
    disabled: disabled || loading,
    activeOpacity: 0.7
  }, loading ? 
    React.createElement(ActivityIndicator, { 
      color: variant === 'secondary' ? colors.primary : colors.white, 
      size: "small" 
    }) : 
    React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } }, [
      icon && React.createElement(View, { 
        key: 'icon',
        style: { marginRight: title ? 8 : 0 } 
      }, icon),
      children || (title && React.createElement(Text, { 
        key: 'text',
        style: getTextStyle() 
      }, title))
    ])
  );
};

// ============================================================================
// MODAL COMPONENT
// ============================================================================
const SimpleModal = ({ visible, onClose, title, children, showCloseButton = true }) => 
  React.createElement(Modal, { 
    visible: visible, 
    transparent: true, 
    animationType: "fade", 
    onRequestClose: onClose 
  }, 
    React.createElement(View, { style: styles.modalOverlay },
      React.createElement(View, { style: styles.modalContent }, [
        (title || showCloseButton) && React.createElement(View, { 
          key: 'header',
          style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } 
        }, [
          title && React.createElement(Text, { 
            key: 'title',
            style: styles.heading3 
          }, title),
          showCloseButton && React.createElement(TouchableOpacity, { 
            key: 'close',
            onPress: onClose 
          }, React.createElement(MaterialIcons, { 
            name: "close", 
            size: 24, 
            color: colors.text.secondary 
          }))
        ]),
        React.createElement(View, { key: 'content' }, children)
      ])
    )
  );

// ============================================================================
// MAIN PDF EDITOR COMPONENT
// ============================================================================
function PDFEditor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showNewConfirmModal, setShowNewConfirmModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [currentPage] = useState(1);
  const webViewRef = useRef(null);
  const { showToast } = useToast();

  // File handling
  const handleFileSelect = useCallback(async () => {
    try {
      const result = await pickPDFFile();
      if (result.success) {
        setSelectedFile(result);
        const base64 = await readFileAsBase64(result);
        setPdfBase64(base64);
      } else if (!result.canceled) {
        showToast('Failed to select PDF file', 'error');
      }
    } catch (error) {
      showToast('Error loading PDF file', 'error');
    }
  }, [showToast]);

  // Field operations
  const handleFieldAdd = useCallback((type) => {
    if (type === 'signature') {
      setShowSignatureModal(true);
      return;
    }
    
    const configs = {
      text: { width: 150, height: 24, content: '', fontSize: 11 },
      date: { width: 100, height: 24, content: new Date().toLocaleDateString(), fontSize: 11 },
      checkbox: { width: 20, height: 20, content: false, fontSize: 16 }
    };
    
    const config = configs[type];
    const newField = {
      id: `${type}_${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: config.width,
      height: config.height,
      content: config.content,
      fontSize: config.fontSize,
      color: '#000000',
      page: currentPage
    };
    
    setObjects(prev => [...prev, newField]);
    setSelectedId(newField.id);
  }, [currentPage]);

  const handleSignatureSave = useCallback((signatureDataUrl) => {
    const signatureField = {
      id: `signature_${Date.now()}`,
      type: 'signature',
      x: 50,
      y: 50,
      width: 150,
      height: 50,
      content: signatureDataUrl,
      page: currentPage
    };
    setObjects(prev => [...prev, signatureField]);
    setSelectedId(signatureField.id);
    setShowSignatureModal(false);
  }, [currentPage]);

  const updateObject = useCallback((id, updates) => {
    setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
  }, []);

  const deleteObject = useCallback((id) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    setSelectedId(prev => prev === id ? null : prev);
    setEditingFieldId(prev => prev === id ? null : prev);
  }, []);

  // Export functionality
  const handleExportPDF = useCallback(async () => {
    if (!pdfBase64 || !objects.length) {
      showToast('No PDF or fields to export', 'warning');
      return;
    }

    try {
      setIsExporting(true);
      const result = await exportPDFWithFields(pdfBase64, objects);
      if (result.success) {
        downloadPDF(result.pdfBytes, `filled_${selectedFile?.name || 'form.pdf'}`);
        showToast('PDF exported successfully!', 'success');
      } else {
        showToast('Failed to export PDF', 'error');
      }
    } catch (error) {
      showToast('Error exporting PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [pdfBase64, objects, selectedFile, showToast]);

  const handleNewFile = useCallback(() => {
    setSelectedFile(null);
    setPdfBase64(null);
    setSelectedId(null);
    setEditingFieldId(null);
    setObjects([]);
    setShowNewConfirmModal(false);
  }, []);

  // Create PDF HTML
  const createPDFHTML = useCallback(() => {
    if (!pdfBase64) return '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #f5f5f5; font-family: system-ui; overflow: auto; }
            #container { padding: 20px; display: flex; justify-content: center; min-height: 100vh; }
            #pdfContainer { background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            canvas { display: block; max-width: 100%; height: auto; }
            #loading { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 20px; background: white; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div id="container">
            <div id="loading"><div style="font-size: 24px; margin-bottom: 12px;">📄</div><div>Loading PDF...</div></div>
            <div id="pdfContainer" style="display: none;"></div>
          </div>
          <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            async function loadPDF() {
              try {
                const pdfData = atob('${pdfBase64}');
                const pdfArray = new Uint8Array(pdfData.length);
                for (let i = 0; i < pdfData.length; i++) pdfArray[i] = pdfData.charCodeAt(i);
                const pdf = await pdfjsLib.getDocument({ data: pdfArray }).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1.2 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const pdfContainer = document.getElementById('pdfContainer');
                pdfContainer.appendChild(canvas);
                pdfContainer.style.display = 'block';
                document.getElementById('loading').style.display = 'none';
              } catch (error) {
                document.getElementById('loading').innerHTML = '<div>⚠️</div><div>Failed to load PDF</div>';
              }
            }
            window.onload = loadPDF;
          </script>
        </body>
      </html>
    `;
  }, [pdfBase64]);

  const SafeContainer = ({ children }) => React.createElement(View, { 
    style: [styles.container, Platform.OS !== 'web' && { paddingTop: 44 }] 
  }, children);

  return React.createElement(SafeContainer, {}, [
    // PDF Viewer
    React.createElement(View, { 
      key: 'pdf-viewer',
      style: { flex: 1, backgroundColor: colors.gray[50] } 
    }, [
      !pdfBase64 ? 
        // Upload screen
        React.createElement(View, { 
          key: 'upload',
          style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 } 
        }, 
          React.createElement(View, { 
            style: { backgroundColor: colors.white, borderRadius: 12, padding: 32, alignItems: 'center', maxWidth: 320 } 
          }, [
            React.createElement(MaterialIcons, { 
              key: 'icon',
              name: "picture-as-pdf", 
              size: 64, 
              color: colors.primary, 
              style: { marginBottom: 20 } 
            }),
            React.createElement(Text, { 
              key: 'text',
              style: [styles.bodyText, { textAlign: 'center', marginBottom: 24 }] 
            }, 'Upload a PDF to start adding fields'),
            React.createElement(Button, { 
              key: 'button',
              title: "Choose PDF File", 
              onPress: handleFileSelect, 
              icon: React.createElement(MaterialIcons, { 
                name: "upload-file", 
                size: 18, 
                color: colors.white 
              })
            })
          ])
        ) :
        // PDF with fields
        React.createElement(View, { 
          key: 'pdf-display',
          style: { flex: 1, backgroundColor: colors.white, borderRadius: 12, margin: 10, overflow: 'hidden' } 
        }, [
          React.createElement(WebView, { 
            key: 'webview',
            ref: webViewRef, 
            source: { html: createPDFHTML() }, 
            style: { flex: 1 }, 
            javaScriptEnabled: true 
          }),
          React.createElement(View, { 
            key: 'overlay',
            style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' } 
          }, 
            objects.map((field) => React.createElement(Text, { 
              key: field.id,
              style: { 
                position: 'absolute',
                left: field.x * 1.2 + 20,
                top: field.y * 1.2 + 20,
                width: field.width * 1.2,
                height: field.height * 1.2,
                borderWidth: selectedId === field.id ? 2 : 0,
                borderColor: colors.primary,
                backgroundColor: selectedId === field.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                fontSize: 12,
                padding: 4
              },
              onPress: () => setSelectedId(field.id)
            }, field.content || field.type))
          )
        ])
    ]),

    // Bottom Toolbar
    React.createElement(View, { 
      key: 'toolbar',
      style: { 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        paddingBottom: Platform.OS === 'ios' ? 34 : 12, 
        backgroundColor: colors.white, 
        borderTopWidth: 1, 
        borderTopColor: colors.border, 
        flexDirection: 'row', 
        justifyContent: 'center' 
      } 
    }, 
      React.createElement(View, { style: { flexDirection: 'row', gap: 8 } }, [
        React.createElement(Button, { 
          key: 'text',
          onPress: () => handleFieldAdd('text'),
          icon: React.createElement(Feather, { name: "edit-3", size: 14, color: colors.white }),
          title: "Text",
          style: { paddingHorizontal: 12, paddingVertical: 8, minWidth: 60 }
        }),
        React.createElement(Button, { 
          key: 'date',
          onPress: () => handleFieldAdd('date'),
          variant: "secondary",
          icon: React.createElement(MaterialIcons, { name: "date-range", size: 14, color: colors.primary }),
          title: "Date",
          style: { paddingHorizontal: 12, paddingVertical: 8, minWidth: 60 }
        }),
        React.createElement(Button, { 
          key: 'checkbox',
          onPress: () => handleFieldAdd('checkbox'),
          variant: "secondary", 
          icon: React.createElement(MaterialIcons, { name: "check-box-outline-blank", size: 14, color: colors.primary }),
          title: "Check",
          style: { paddingHorizontal: 12, paddingVertical: 8, minWidth: 60 }
        }),
        React.createElement(Button, { 
          key: 'signature',
          onPress: () => handleFieldAdd('signature'),
          variant: "secondary",
          icon: React.createElement(FontAwesome5, { name: "signature", size: 12, color: colors.primary }),
          title: "Sign",
          style: { paddingHorizontal: 12, paddingVertical: 8, minWidth: 60 }
        })
      ])
    ),

    // Floating Export Button
    objects.length > 0 && React.createElement(View, { 
      key: 'export-button',
      style: { 
        position: 'absolute', 
        top: Platform.OS === 'web' ? 16 : 60, 
        right: 16, 
        zIndex: 1000 
      } 
    }, 
      React.createElement(Button, { 
        onPress: handleExportPDF,
        disabled: isExporting,
        icon: React.createElement(MaterialIcons, { name: "file-download", size: 16, color: colors.white }),
        title: isExporting ? "Saving..." : "Save",
        style: { backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 12 }
      })
    )
  ]);
}

// ============================================================================
// ROOT APP COMPONENT WITH PROVIDERS
// ============================================================================
export default function App() {
  return React.createElement(ErrorBoundary, {}, 
    React.createElement(ToastProvider, {},
      React.createElement(StatusBar, { style: "auto" }),
      React.createElement(PDFEditor, {})
    )
  );
}