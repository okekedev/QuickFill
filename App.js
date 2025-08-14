import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import our clean components and utilities
import { PDFViewer, FieldEditor, SignaturePad } from './components/pdf';
import { Button, Card, Modal, ToastProvider, useToast } from './components/ui';
import { DocumentIcon, UploadIcon, EditIcon, DownloadIcon, PlusIcon } from './icons';
import { pickPDFFile, readFileAsBase64 } from './utils/fileHelpers';
import { usePDFEditor } from './utils/pdfEditor';
import { exportPDFWithFields, downloadPDF, validateFieldsForExport } from './utils/pdfExport';
import { colors, components, layout } from './styles';

// Main App Component with Toast Integration
function QuickFillApp() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    clearAllObjects
  } = usePDFEditor(pdfBase64);

  const handleFileSelect = async () => {
    console.log('Starting file selection...');
    try {
      const result = await pickPDFFile();
      console.log('File picker result:', result);
      
      if (result.success) {
        console.log('File selected successfully:', result.name);
        setSelectedFile(result);
        
        // Convert file to base64 for PDF processing
        const base64 = await readFileAsBase64(result);
        setPdfBase64(base64);
        
        showToast(`PDF loaded: ${result.name}`, 'success');
      } else if (result.canceled) {
        console.log('File selection canceled');
      } else {
        console.log('File selection failed:', result.error);
        showToast('Failed to select file: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error in handleFileSelect:', error);
      showToast('Error selecting file: ' + error.message, 'error');
    }
  };

  const handleFieldAdd = (type) => {
    const result = type === 'signature' ? addSignatureObject() : 
                   type === 'text' ? addTextObject() :
                   type === 'date' ? addDateObject() :
                   type === 'checkbox' ? addCheckboxObject() : null;
    
    if (result === 'open_signature_modal') {
      setShowSignatureModal(true);
    }
  };

  const handleSignatureSave = (signatureDataUrl) => {
    const x = 50;
    const y = 50;
    const id = `signature_${Date.now()}`;
    
    const signatureField = {
      id,
      type: 'signature',
      x,
      y,
      width: 150,
      height: 75,
      content: signatureDataUrl,
      page: 1
    };
    
    setObjects(prev => [...prev, signatureField]);
    setSelectedFieldId(id);
    setShowSignatureModal(false);
    showToast('Signature added successfully', 'success');
  };

  const handleFieldUpdate = (fieldId, updates) => {
    updateObject(fieldId, updates);
  };

  const handleFieldEdit = (fieldId) => {
    setEditingFieldId(fieldId);
    if (fieldId && objects.find(f => f.id === fieldId)?.type !== 'signature') {
      setShowFieldEditor(true);
    }
  };

  const handleExportPDF = async () => {
    if (!pdfBase64 || !objects.length) {
      showToast('No PDF loaded or no fields to export', 'warning');
      return;
    }

    try {
      setIsExporting(true);
      showToast('Exporting PDF...', 'info');
      
      // Validate fields
      const validation = validateFieldsForExport(objects);
      if (!validation.valid) {
        showToast('Validation errors: ' + validation.errors.join(', '), 'error');
        return;
      }

      // Export PDF with fields
      const result = await exportPDFWithFields(pdfBase64, objects);
      
      if (result.success) {
        downloadPDF(result.pdfBytes, `filled_${selectedFile.name}`);
        showToast('PDF exported successfully!', 'success');
      } else {
        showToast('Export failed: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('Export failed: ' + error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleNewFile = () => {
    setSelectedFile(null);
    setPdfBase64(null);
    setSelectedFieldId(null);
    setEditingFieldId(null);
    clearAllObjects();
  };

  return (
    <View style={layout.container}>
      <StatusBar style="auto" />
      
      {!selectedFile ? (
        // File picker screen
        <View style={layout.centeredContainer}>
          <Card title="QuickFill PDF" style={[components.card, layout.center]}>
            <View style={{ marginBottom: 20, alignItems: 'center' }}>
              <DocumentIcon size={60} color={colors.primary[500]} />
            </View>
            <Text style={[components.heading2, { textAlign: 'center', marginBottom: 16 }]}>
              QuickFill PDF
            </Text>
            <Text style={[components.bodyText, { textAlign: 'center', marginBottom: 24 }]}>
              Upload a PDF document to start adding fillable fields and signatures
            </Text>
            <Button 
              title="Choose PDF File" 
              onPress={handleFileSelect}
              icon={<UploadIcon size={20} color={colors.white} />}
            />
          </Card>
        </View>
      ) : (
        // PDF editor screen
        <View style={layout.container}>
          {/* Top Toolbar */}
          <View style={[
            layout.row, 
            layout.spaceBetween, 
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
              elevation: 2
            }
          ]}>
            {/* Left side - File info */}
            <View style={[layout.row, layout.center, { flex: 1 }]}>
              <DocumentIcon size={20} color={colors.gray[600]} />
              <Text style={[components.bodyText, { marginLeft: 8, flex: 1 }]} numberOfLines={1}>
                {selectedFile.name}
              </Text>
            </View>
            
            {/* Right side - New file button */}
            <Button 
              title="New"
              variant="secondary"
              onPress={handleNewFile}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            />
          </View>

          {/* Centered PDF Viewer */}
          <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
            <PDFViewer 
              pdfFile={selectedFile}
              selectedFieldId={selectedFieldId}
              editingFieldId={editingFieldId}
              onFieldUpdate={handleFieldUpdate}
              onFieldSelect={setSelectedFieldId}
              onFieldEdit={handleFieldEdit}
              onFieldDelete={deleteObject}
            />
          </View>
          
          {/* Bottom Toolbar */}
          <View style={[
            layout.row, 
            layout.center, 
            {
              paddingHorizontal: 16,
              paddingVertical: 12,
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
            <Button 
              onPress={() => handleFieldAdd('text')} 
              icon={<EditIcon size={16} color={colors.white} />}
              style={[{ paddingHorizontal: 8, paddingVertical: 8, minWidth: 40 }, layout.mx1]}
              title="T"
            />
            <Button 
              onPress={() => handleFieldAdd('date')} 
              variant="secondary"
              icon={<EditIcon size={16} color={colors.primary[500]} />}
              style={[{ paddingHorizontal: 8, paddingVertical: 8, minWidth: 40 }, layout.mx1]}
              title="D"
            />
            <Button 
              onPress={() => handleFieldAdd('checkbox')} 
              variant="secondary"
              icon={<PlusIcon size={16} color={colors.primary[500]} />}
              style={[{ paddingHorizontal: 8, paddingVertical: 8, minWidth: 40 }, layout.mx1]}
              title="☑"
            />
            <Button 
              onPress={() => handleFieldAdd('signature')} 
              variant="secondary"
              icon={<EditIcon size={16} color={colors.primary[500]} />}
              style={[{ paddingHorizontal: 8, paddingVertical: 8, minWidth: 40 }, layout.mx1]}
              title="✎"
            />
            <Button 
              title={isExporting ? "..." : "Export"}
              onPress={handleExportPDF}
              variant="success"
              disabled={isExporting || !objects.length}
              icon={<DownloadIcon size={16} color={colors.white} />}
              style={[{ paddingHorizontal: 12 }, layout.mx1]}
            />
          </View>
          
          {/* Signature Modal */}
          <Modal visible={showSignatureModal} onClose={() => setShowSignatureModal(false)}>
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setShowSignatureModal(false)}
            />
          </Modal>

          {/* Field Editor Modal */}
          <Modal visible={showFieldEditor} onClose={() => setShowFieldEditor(false)}>
            <FieldEditor
              field={objects.find(f => f.id === editingFieldId)}
              onSave={(updatedField) => {
                handleFieldUpdate(updatedField.id, updatedField);
                setShowFieldEditor(false);
                setEditingFieldId(null);
              }}
              onClose={() => {
                setShowFieldEditor(false);
                setEditingFieldId(null);
              }}
            />
          </Modal>
        </View>
      )}
    </View>
  );
}

// Export wrapped app with ToastProvider
export default function App() {
  return (
    <ToastProvider>
      <QuickFillApp />
    </ToastProvider>
  );
}