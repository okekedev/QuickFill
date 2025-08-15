import React, { useState, useCallback, Component, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

// Import our clean components and utilities
import { PDFViewer, FieldEditor, SignaturePad } from './components/pdf';
import { Button, Card, Modal, ToastProvider, useToast } from './components/ui';
import { pickPDFFile, readFileAsBase64 } from './utils/fileHelpers';
import { usePDFEditor } from './utils/pdfEditor';
import { exportPDFWithFields, downloadPDF, validateFieldsForExport } from './utils/pdfExport';
import { colors, components, layout } from './styles';

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          backgroundColor: colors.gray[50]
        }}>
          <MaterialIcons name="error" size={64} color={colors.error[500]} />
          <Text style={[components.bodyText, { 
            marginTop: 16, 
            textAlign: 'center',
            fontSize: 18,
            fontWeight: '600',
            color: colors.text.primary
          }]}>
            Something went wrong
          </Text>
          <Text style={[components.bodyText, { 
            marginTop: 8, 
            textAlign: 'center',
            color: colors.text.secondary
          }]}>
            The app encountered an unexpected error. Please restart the app.
          </Text>
          <Button 
            title="Restart App" 
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 20 }}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

// Simple SafeArea component for iOS
const SafeContainer = ({ children, style }) => {
  if (Platform.OS === 'web') {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }
  
  return (
    <View style={[{ flex: 1, paddingTop: 44 }, style]}>
      {children}
    </View>
  );
};

// Main App Component with Toast Integration
function QuickFillApp() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [zoomToolbarVisible, setZoomToolbarVisible] = useState(false);
  const [showNewConfirmModal, setShowNewConfirmModal] = useState(false);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  
  // Ref for PDFViewer to access zoom methods
  const pdfViewerRef = useRef(null);

  // Use toast notifications
  const { showToast } = useToast();

  // Use PDF Editor hook
  const {
    addTextObject,
    addSignatureObject,
    addDateObject,
    addCheckboxObject,
    objects,
    setObjects,
    updateObject,
    deleteObject,
    clearAllObjects,
    scale,
    setScale,
    currentPage,
    setCurrentPage,
    totalPages,
    selectedId,
    setSelectedId
  } = usePDFEditor(pdfBase64);

  const handleFileSelect = useCallback(async () => {
    if (isLoadingPDF) {
      console.log('Already loading a PDF, ignoring duplicate call');
      return;
    }

    try {
      setIsLoadingPDF(true);
      console.log('Starting file selection...');
      
      const result = await pickPDFFile();
      
      if (result.success) {
        console.log('File selected successfully:', result.name);
        setSelectedFile(result);
        
        // Convert file to base64 for PDF processing
        console.log('Converting file to base64...');
        try {
          const base64 = await readFileAsBase64(result);
          console.log('Base64 conversion complete, length:', base64?.length);
          
          // Use setTimeout to prevent race conditions on mobile
          setTimeout(() => {
            setPdfBase64(base64);
            console.log('PDF Base64 state updated');
          }, 100);
          
        } catch (conversionError) {
          console.error('Base64 conversion failed:', conversionError);
          showToast('Failed to process PDF file', 'error');
          return;
        }
        
      } else if (!result.canceled) {
        console.error('Failed to select file:', result.error || 'Unknown error');
        showToast('Failed to select PDF file', 'error');
      }
    } catch (error) {
      console.error('Error in handleFileSelect:', error);
      showToast('Error loading PDF file', 'error');
    } finally {
      // Delay setting loading to false to prevent UI glitches
      setTimeout(() => {
        setIsLoadingPDF(false);
      }, 200);
    }
  }, [isLoadingPDF, showToast]);

  const handleFieldAdd = useCallback((type) => {
    const result = type === 'signature' ? addSignatureObject() : 
                   type === 'text' ? addTextObject() :
                   type === 'date' ? addDateObject() :
                   type === 'checkbox' ? addCheckboxObject() : null;
    
    if (result === 'open_signature_modal') {
      setShowSignatureModal(true);
    }
  }, [addSignatureObject, addTextObject, addDateObject, addCheckboxObject]);

  const handleSignatureSave = useCallback((signatureDataUrl) => {
    const x = 50;
    const y = 50;
    const id = `signature_${Date.now()}`;
    
    const signatureField = {
      id,
      type: 'signature',
      x,
      y,
      width: 150,
      height: 50,
      content: signatureDataUrl,
      page: currentPage
    };
    
    setObjects(prev => [...prev, signatureField]);
    setSelectedId(id);
    setShowSignatureModal(false);
  }, [currentPage, setObjects, setSelectedId]);

  const handleFieldUpdate = useCallback((fieldId, updates) => {
    updateObject(fieldId, updates);
  }, [updateObject]);

  const handleFieldEdit = useCallback((fieldId) => {
    setEditingFieldId(fieldId);
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!pdfBase64 || !objects.length) {
      showToast('No PDF or fields to export', 'warning');
      return;
    }

    try {
      setIsExporting(true);
      
      // Validate fields
      const validation = validateFieldsForExport(objects);
      if (!validation.valid) {
        console.error('Validation errors:', validation.errors.join(', '));
        showToast('Please fill all required fields', 'error');
        return;
      }

      // Export PDF with fields
      const result = await exportPDFWithFields(pdfBase64, objects);
      
      if (result.success) {
        downloadPDF(result.pdfBytes, `filled_${selectedFile.name}`);
        showToast('PDF exported successfully!', 'success');
      } else {
        console.error('Export failed:', result.error);
        showToast('Failed to export PDF', 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('Error exporting PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [pdfBase64, objects, selectedFile, showToast]);

  const handleNewFileWithConfirmation = useCallback(() => {
    if (objects.length > 0) {
      setShowNewConfirmModal(true);
    } else {
      handleNewFile();
    }
  }, [objects.length]);

  const handleNewFile = useCallback(() => {
    console.log('Starting new file');
    setSelectedFile(null);
    setPdfBase64(null);
    setSelectedId(null);
    setEditingFieldId(null);
    clearAllObjects();
    setShowNewConfirmModal(false);
    setIsLoadingPDF(false);
  }, [clearAllObjects, setSelectedId]);

  const toggleHeader = useCallback(() => {
    setHeaderVisible(!headerVisible);
  }, [headerVisible]);

  const toggleZoomToolbar = useCallback(() => {
    setZoomToolbarVisible(!zoomToolbarVisible);
  }, [zoomToolbarVisible]);

  const handleZoomIn = useCallback(() => {
    if (pdfViewerRef.current) {
      pdfViewerRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (pdfViewerRef.current) {
      pdfViewerRef.current.zoomOut();
    }
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, setCurrentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  return (
    <SafeContainer style={layout.container}>
      <StatusBar style="auto" />
      
      {/* Always show PDF editor screen */}
      <View style={layout.container}>
          {/* Top Toolbar - Only show if headerVisible is true */}
          {headerVisible && (
            <View style={[
              layout.row, 
              layout.center,
              { 
                paddingHorizontal: 16, 
                paddingVertical: 12,
                backgroundColor: colors.white,
                borderBottomWidth: 1, 
                borderBottomColor: colors.gray[200],
                shadowColor: colors.black,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
                justifyContent: 'center'
              }
            ]}>
              {/* Centered buttons - New, Export, Hide */}
              <View style={[layout.row, { gap: 12 }]}>
                <Button 
                  title="New"
                  variant="secondary"
                  onPress={handleNewFileWithConfirmation}
                  icon={<MaterialIcons name="add" size={16} color={colors.primary[500]} />}
                  style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                />
                <Button 
                  title={isExporting ? "Saving..." : "Save"}
                  onPress={handleExportPDF}
                  variant="success"
                  disabled={isExporting || !objects.length}
                  icon={<MaterialIcons name="file-download" size={16} color={colors.white} />}
                  style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                />
                <Button 
                  title="Hide"
                  variant="secondary"
                  onPress={toggleHeader}
                  icon={<MaterialIcons name="visibility-off" size={16} color={colors.primary[500]} />}
                  style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                />
              </View>
            </View>
          )}

          {/* Hide/Show Header Button - Top Right when header is hidden */}
          {!headerVisible && (
            <View style={{
              position: 'absolute',
              top: Platform.OS === 'web' ? 16 : 60,
              right: 16,
              zIndex: 1000,
            }}>
              <Button 
                onPress={toggleHeader}
                icon={<MaterialIcons name="save" size={16} color={colors.white} />}
                style={{ 
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary[500],
                  shadowColor: colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 0,
                  paddingVertical: 0
                }}
                title=""
              />
            </View>
          )}

          {/* Centered PDF Viewer */}
          <View style={{ flex: 1, backgroundColor: colors.gray[50], position: 'relative' }}>
            <PDFViewer 
              ref={pdfViewerRef}
              pdfBase64={pdfBase64}
              selectedFieldId={selectedId}
              editingFieldId={editingFieldId}
              objects={objects}
              onFieldUpdate={handleFieldUpdate}
              onFieldSelect={setSelectedId}
              onFieldEdit={handleFieldEdit}
              onFieldDelete={deleteObject}
              onFileSelect={handleFileSelect}
              scale={scale}
              setScale={setScale}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
            
            {/* Zoom Toolbar Toggle Button - Top Left (only show when toolbar is hidden) */}
            {!zoomToolbarVisible && (
              <View style={{
                position: 'absolute',
                top: Platform.OS === 'web' ? 16 : 60,
                left: 16,
                zIndex: 1000,
              }}>
                <Button 
                  onPress={toggleZoomToolbar}
                  icon={<MaterialIcons name="article" size={16} color={colors.white} />}
                  style={{ 
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.success[500],
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 0,
                    paddingVertical: 0
                  }}
                  title=""
                />
              </View>
            )}

            {/* Zoom/Navigation Toolbar - Centered Top */}
            {zoomToolbarVisible && (
              <View style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: colors.white,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.gray[200],
                  shadowColor: colors.black,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                  justifyContent: 'center'
                },
                layout.row,
                layout.center
              ]}>
                {/* Centered zoom/navigation buttons */}
                <View style={[layout.row, { gap: 12 }]}>
                  {/* Zoom Out */}
                  <Button 
                    onPress={handleZoomOut}
                    icon={<MaterialIcons name="zoom-out" size={16} color={colors.primary[500]} />}
                    variant="secondary"
                    title=""
                    style={{ paddingHorizontal: 8, paddingVertical: 8, minWidth: 40 }}
                  />
                  
                  {/* Zoom In */}
                  <Button 
                    onPress={handleZoomIn}
                    icon={<MaterialIcons name="zoom-in" size={16} color={colors.primary[500]} />}
                    variant="secondary"
                    title=""
                    style={{ paddingHorizontal: 8, paddingVertical: 8, minWidth: 40 }}
                  />
                  
                  {/* Previous Page */}
                  <Button 
                    onPress={handlePreviousPage}
                    icon={<MaterialIcons name="navigate-before" size={16} color={colors.primary[500]} />}
                    variant="secondary"
                    title="Prev"
                    style={{ paddingHorizontal: 8, paddingVertical: 8 }}
                    disabled={currentPage <= 1}
                  />
                  
                  {/* Next Page */}
                  <Button 
                    onPress={handleNextPage}
                    icon={<MaterialIcons name="navigate-next" size={16} color={colors.primary[500]} />}
                    variant="secondary"
                    title="Next"
                    style={{ paddingHorizontal: 8, paddingVertical: 8 }}
                    disabled={currentPage >= totalPages}
                  />
                  
                  {/* Hide Zoom Toolbar */}
                  <Button 
                    title="Hide"
                    variant="secondary"
                    onPress={toggleZoomToolbar}
                    icon={<MaterialIcons name="visibility-off" size={16} color={colors.primary[500]} />}
                    style={{ paddingHorizontal: 8, paddingVertical: 8 }}
                  />
                </View>
              </View>
            )}
          </View>
          
          {/* Bottom Toolbar with simple safe area */}
          <View style={[
            layout.row, 
            layout.center, 
            {
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingBottom: Platform.OS === 'ios' ? 34 : 12, // iPhone home indicator
              backgroundColor: colors.white,
              borderTopWidth: 1, 
              borderTopColor: colors.gray[200],
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2
            }
          ]}>
            {/* Text Field Button */}
            <Button 
              onPress={() => handleFieldAdd('text')} 
              icon={<Feather name="edit-3" size={14} color={colors.white} />}
              style={[{ paddingHorizontal: 8, paddingVertical: 8, minWidth: 50 }, layout.mx1]}
              title="Text"
            />
            
            {/* Date Field Button */}
            <Button 
              onPress={() => handleFieldAdd('date')} 
              variant="secondary"
              icon={<MaterialIcons name="date-range" size={14} color={colors.primary[500]} />}
              style={[{ paddingHorizontal: 8, paddingVertical: 8, minWidth: 50 }, layout.mx1]}
              title="Date"
            />
            
            {/* Checkbox Button */}
            <Button 
              onPress={() => handleFieldAdd('checkbox')} 
              variant="secondary"
              icon={<MaterialIcons name="check-box-outline-blank" size={14} color={colors.primary[500]} />}
              style={[{ paddingHorizontal: 8, paddingVertical: 8, minWidth: 50 }, layout.mx1]}
              title="Check"
            />
            
            {/* Signature Button */}
            <Button 
              onPress={() => handleFieldAdd('signature')} 
              variant="secondary"
              icon={<FontAwesome5 name="signature" size={12} color={colors.primary[500]} />}
              style={[{ paddingHorizontal: 8, paddingVertical: 8, minWidth: 50 }, layout.mx1]}
              title="Sign"
            />
          </View>
          
          {/* Signature Modal */}
          <Modal visible={showSignatureModal} onClose={() => setShowSignatureModal(false)}>
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setShowSignatureModal(false)}
            />
          </Modal>

          {/* New File Confirmation Modal */}
          <Modal visible={showNewConfirmModal} onClose={() => setShowNewConfirmModal(false)}>
            <View style={{ padding: 24, minWidth: 300 }}>
              <Text style={[components.heading3, { marginBottom: 16, textAlign: 'center' }]}>
                Start New Document?
              </Text>
              <Text style={[components.bodyText, { marginBottom: 24, textAlign: 'center', color: colors.gray[600] }]}>
                Changes will not be saved. Are you sure you want to continue?
              </Text>
              <View style={[layout.row, { gap: 12, justifyContent: 'center' }]}>
                <Button 
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setShowNewConfirmModal(false)}
                  style={{ paddingHorizontal: 20, paddingVertical: 10 }}
                />
                <Button 
                  title="Continue"
                  variant="error"
                  onPress={handleNewFile}
                  style={{ paddingHorizontal: 20, paddingVertical: 10 }}
                />
              </View>
            </View>
          </Modal>
        </View>
    </SafeContainer>
  );
}

// Export wrapped app with Error Boundary and ToastProvider
export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <QuickFillApp />
      </ToastProvider>
    </ErrorBoundary>
  );
}