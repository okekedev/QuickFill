// components/PDFEditor/PDFEditor.js - Fixed field positioning and functionality
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Platform, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

// Import child components
import PDFToolbar from './PDFToolbar';
import EditableField from './EditableField';
import SignatureDialog from './SignatureDialog';
import SignatureOptionsDialog from './SignatureOptionsDialog';

// Import styles
import { pdfEditorStyles } from './PDFEditorStyles';

const PDFEditor = ({ pdf, onClose, onSave }) => {
  // PDF state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  // Form fields state
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Signature dialogs state
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showSignatureOptions, setShowSignatureOptions] = useState(false);
  const [signatureType, setSignatureType] = useState('customer');

  // Saved signature and name
  const [mySignature, setMySignature] = useState(null);
  const [myName, setMyName] = useState('');

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Load saved data from storage
  useEffect(() => {
    if (Platform.OS === 'web') {
      const savedSignature = localStorage.getItem('mySignature');
      const savedName = localStorage.getItem('myName');
      if (savedSignature) setMySignature(savedSignature);
      if (savedName) setMyName(savedName);
    }
  }, []);

  // Calculate center position for new fields
  const getCenterPosition = () => {
    const centerX = (screenWidth / 2) / scale - 100; // Adjust for field width
    const centerY = (screenHeight / 2) / scale - 50;  // Adjust for field height
    return { x: Math.max(0, centerX), y: Math.max(0, centerY) };
  };

  // Field creation functions with center positioning
  const addTextObject = useCallback(() => {
    const id = `text_${Date.now()}`;
    const center = getCenterPosition();
    const newField = {
      id,
      type: 'text',
      x: center.x,
      y: center.y,
      width: 200,
      height: 30,
      content: '',
      fontSize: 12,
      color: '#000000', // Black by default
      page: currentPage
    };
    setObjects(prev => [...prev, newField]);
    setSelectedId(id);
    setEditingId(id);
  }, [currentPage, scale, screenWidth, screenHeight]);

  const addDateObject = useCallback(() => {
    const id = `date_${Date.now()}`;
    const center = getCenterPosition();
    const today = new Date().toISOString().split('T')[0];
    const newField = {
      id,
      type: 'date',
      x: center.x,
      y: center.y,
      width: 120,
      height: 25,
      content: today,
      fontSize: 12,
      color: '#000000',
      page: currentPage
    };
    setObjects(prev => [...prev, newField]);
    setSelectedId(id);
  }, [currentPage, scale, screenWidth, screenHeight]);

  const addTimestampObject = useCallback(() => {
    const id = `timestamp_${Date.now()}`;
    const center = getCenterPosition();
    const now = new Date();
    const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    const newField = {
      id,
      type: 'timestamp',
      x: center.x,
      y: center.y,
      width: 180,
      height: 25,
      content: timestamp,
      fontSize: 11,
      color: '#000000',
      page: currentPage
    };
    setObjects(prev => [...prev, newField]);
    setSelectedId(id);
  }, [currentPage, scale, screenWidth, screenHeight]);

  const addCheckboxObject = useCallback(() => {
    const id = `checkbox_${Date.now()}`;
    const center = getCenterPosition();
    const newField = {
      id,
      type: 'checkbox',
      x: center.x,
      y: center.y,
      width: 20,
      height: 20,
      content: false,
      fontSize: 16,
      color: '#000000',
      page: currentPage
    };
    setObjects(prev => [...prev, newField]);
    setSelectedId(id);
  }, [currentPage, scale, screenWidth, screenHeight]);

  const addSignatureObject = useCallback(() => {
    const id = `signature_${Date.now()}`;
    const center = getCenterPosition();
    const newField = {
      id,
      type: 'signature',
      x: center.x,
      y: center.y,
      width: 200,
      height: 60,
      content: '',
      fontSize: 12,
      color: '#000000',
      page: currentPage
    };
    setObjects(prev => [...prev, newField]);
    setSelectedId(id);
    return id;
  }, [currentPage, scale, screenWidth, screenHeight]);

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

  // Handle canvas click to deselect fields
  const handleCanvasClick = () => {
    setSelectedId(null);
    setEditingId(null);
  };

  // Signature handling
  const handleAddMySignature = () => {
    if (mySignature) {
      setShowSignatureOptions(true);
    } else {
      setSignatureType('my');
      addSignatureObject();
      setShowSignatureDialog(true);
    }
  };

  const handleAddCustomerSignature = () => {
    setSignatureType('customer');
    addSignatureObject();
    setShowSignatureDialog(true);
  };

  const handleSignatureSaved = (signatureDataUrl) => {
    if (signatureType === 'my') {
      setMySignature(signatureDataUrl);
      if (Platform.OS === 'web') {
        localStorage.setItem('mySignature', signatureDataUrl);
      }
    }
    
    // Update the most recently created signature field
    setObjects(prev => prev.map(obj => {
      if (obj.type === 'signature' && obj.page === currentPage && !obj.content) {
        return { ...obj, content: signatureDataUrl };
      }
      return obj;
    }));
    
    setShowSignatureDialog(false);
  };

  const handleUseExistingSignature = () => {
    addSignatureObject();
    setObjects(prev => prev.map(obj => {
      if (obj.type === 'signature' && obj.page === currentPage && !obj.content) {
        return { ...obj, content: mySignature };
      }
      return obj;
    }));
    setShowSignatureOptions(false);
  };

  const handleReplaceSignature = () => {
    setSignatureType('my');
    addSignatureObject();
    setShowSignatureDialog(true);
    setShowSignatureOptions(false);
  };

  const handleCreateNewSignatureField = () => {
    addSignatureObject();
    setSignatureType('customer');
    setShowSignatureDialog(true);
    setShowSignatureOptions(false);
  };

  const handleAddMyName = () => {
    if (myName) {
      const id = `text_${Date.now()}`;
      const center = getCenterPosition();
      const nameField = {
        id,
        type: 'text',
        x: center.x,
        y: center.y,
        width: 200,
        height: 30,
        content: myName,
        fontSize: 12,
        color: '#000000',
        page: currentPage
      };
      setObjects(prev => [...prev, nameField]);
      setSelectedId(id);
    } else {
      // Prompt for name
      const name = prompt('Enter your name to save for future use:');
      if (name) {
        setMyName(name);
        if (Platform.OS === 'web') {
          localStorage.setItem('myName', name);
        }
        
        const id = `text_${Date.now()}`;
        const center = getCenterPosition();
        const nameField = {
          id,
          type: 'text',
          x: center.x,
          y: center.y,
          width: 200,
          height: 30,
          content: name,
          fontSize: 12,
          color: '#000000',
          page: currentPage
        };
        setObjects(prev => [...prev, nameField]);
        setSelectedId(id);
      }
    }
  };

  const handleSave = async () => {
    try {
      const pdfData = {
        fileName: pdf.name,
        originalFileName: pdf.name,
        fields: objects,
        metadata: {
          totalPages,
          currentPage,
          scale
        }
      };
      
      await onSave(pdfData);
    } catch (error) {
      console.error('❌ Error saving PDF:', error);
    }
  };

  // Filter objects for current page
  const currentObjects = objects.filter(obj => obj.page === currentPage);

  return (
    <View style={pdfEditorStyles.container}>
      <PDFToolbar
        onClose={onClose}
        onSave={handleSave}
        onAddText={addTextObject}
        onAddDate={addDateObject}
        onAddTimestamp={addTimestampObject}
        onAddCheckbox={addCheckboxObject}
        onAddMySignature={handleAddMySignature}
        onAddCustomerSignature={handleAddCustomerSignature}
        onAddMyName={handleAddMyName}
        onClearAll={clearAllObjects}
        onDeleteSelected={() => selectedId && deleteObject(selectedId)}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        scale={scale}
        onScaleChange={setScale}
        hasFields={objects.length > 0}
        hasSelection={Boolean(selectedId)}
        myName={myName}
        hasMySignature={Boolean(mySignature)}
      />

      <View style={pdfEditorStyles.editorContainer}>
        {/* PDF Display */}
        <View 
          style={pdfEditorStyles.pdfContainer}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleCanvasClick}
        >
          {Platform.OS === 'web' ? (
            <iframe
              src={pdf.uri}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
              onLoad={() => setPdfLoaded(true)}
            />
          ) : (
            <WebView
              source={{ uri: pdf.uri }}
              style={{ flex: 1 }}
              onLoad={() => setPdfLoaded(true)}
            />
          )}
        </View>

        {/* Overlay for editable fields */}
        <View style={pdfEditorStyles.fieldOverlay}>
          {currentObjects.map(obj => (
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
        </View>
      </View>

      {/* Signature Dialogs */}
      <SignatureOptionsDialog
        visible={showSignatureOptions}
        onClose={() => setShowSignatureOptions(false)}
        onUseExisting={handleUseExistingSignature}
        onReplace={handleReplaceSignature}
        onCreateNew={handleCreateNewSignatureField}
        hasExistingSignature={Boolean(mySignature)}
      />

      <SignatureDialog
        visible={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        onSave={handleSignatureSaved}
        signatureType={signatureType}
      />
    </View>
  );
};

export default PDFEditor;