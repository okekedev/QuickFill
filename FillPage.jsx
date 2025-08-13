// pages/FillPage.js - PDF form filling screen
import React, { useState, useRef } from 'react';
import { View, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { 
  Header, 
  Card, 
  Button, 
  Text, 
  ButtonGroup,
  Overlay,
  Badge
} from 'react-native-elements';
import { WebView } from 'react-native-webview';

// Simple EditableField component (we'll create this)
import EditableField from '../components/EditableField';
import SignatureDialog from '../components/SignatureDialog';

const FillPage = ({ pdf, onNavigate, onSave }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signatureType, setSignatureType] = useState('customer');
  const [mySignature, setMySignature] = useState(null);
  const [myName, setMyName] = useState('');

  const [selectedToolIndex, setSelectedToolIndex] = useState(0);
  const tools = ['Text', 'Signature', 'Date', 'Checkbox'];

  const containerRef = useRef(null);

  // PDF source logic
  const getPDFSource = () => {
    if (pdf?.dataUrl) return pdf.dataUrl;
    if (pdf?.url) return pdf.url;
    if (pdf?.uri) return pdf.uri;
    return null;
  };

  // Event handlers
  const handlePDFLoad = () => {
    setPdfLoaded(true);
    setPdfError(null);
    setTotalPages(1);
  };

  const handlePDFError = () => {
    setPdfError('Failed to load PDF');
  };

  // Object management
  const getFieldCenter = () => ({
    x: 300,
    y: 200
  });

  const addObject = (type, customProps = {}) => {
    const center = getFieldCenter();
    const defaultProps = {
      text: { width: 150, height: 30, content: 'Enter text' },
      signature: { width: 200, height: 60, content: null },
      date: { width: 120, height: 30, content: new Date().toLocaleDateString() },
      timestamp: { width: 180, height: 30, content: new Date().toLocaleString() },
      checkbox: { width: 25, height: 25, content: '☐' },
    };

    const props = defaultProps[type] || {};
    const newObject = {
      id: Date.now(),
      type,
      x: center.x - props.width / 2,
      y: center.y - props.height / 2,
      fontSize: 16,
      color: '#343a40',
      page: currentPage,
      ...props,
      ...customProps,
    };

    setObjects(prev => [...prev, newObject]);
    setSelectedId(newObject.id);
  };

  const quickAddTool = () => {
    const toolType = tools[selectedToolIndex].toLowerCase();
    if (toolType === 'signature') {
      handleAddCustomerSignature();
    } else {
      addObject(toolType);
    }
  };

  const updateObject = (id, updates) => {
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  };

  const deleteObject = (id) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  };

  const clearAllObjects = () => {
    if (objects.length === 0) {
      Alert.alert('Info', 'No fields to clear');
      return;
    }
    
    Alert.alert(
      'Clear All Fields',
      `Are you sure you want to remove all ${objects.length} fields?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            setObjects([]);
            setSelectedId(null);
            setEditingId(null);
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!objects.length) {
      Alert.alert('No Fields', 'Add some fields before saving');
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave({
        objects,
        fileName: `${pdf.name || 'document'}_filled.pdf`,
        attachmentId: pdf.id
      });
    } catch (error) {
      Alert.alert('Save Failed', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Signature handlers
  const handleAddMySignature = () => {
    if (mySignature) {
      addObject('signature', { content: mySignature, signatureType: 'my' });
    } else {
      setSignatureType('my');
      setShowSignatureDialog(true);
    }
  };

  const handleAddCustomerSignature = () => {
    setSignatureType('customer');
    setShowSignatureDialog(true);
  };

  const handleSignatureSave = (signatureData) => {
    if (signatureType === 'my') {
      setMySignature(signatureData);
    }
    
    addObject('signature', { 
      content: signatureData, 
      signatureType: signatureType 
    });
    setShowSignatureDialog(false);
  };

  // Scale controls
  const scaleOptions = [0.5, 0.75, 1.0, 1.25, 1.5];
  const currentScaleIndex = scaleOptions.indexOf(scale);

  const zoomIn = () => {
    const nextIndex = Math.min(scaleOptions.length - 1, currentScaleIndex + 1);
    setScale(scaleOptions[nextIndex]);
  };

  const zoomOut = () => {
    const nextIndex = Math.max(0, currentScaleIndex - 1);
    setScale(scaleOptions[nextIndex]);
  };

  // PDF source
  const pdfSource = getPDFSource();
  
  // Error state
  if (pdfError) {
    return (
      <View style={{ flex: 1 }}>
        <Header
          leftComponent={{
            icon: 'arrow-back',
            color: '#fff',
            onPress: () => onNavigate('welcome')
          }}
          centerComponent={{ text: 'Error', style: { color: '#fff', fontSize: 20 } }}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text h3 style={{ textAlign: 'center', marginBottom: 15, color: '#dc3545' }}>
            Failed to Load PDF
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 20, color: '#6c757d' }}>
            {pdfError}
          </Text>
          <Button 
            title="← Back to Home" 
            onPress={() => onNavigate('welcome')} 
            buttonStyle={{ backgroundColor: '#1e3a8a' }} 
          />
        </View>
      </View>
    );
  }

  if (!pdfSource) {
    return (
      <View style={{ flex: 1 }}>
        <Header
          leftComponent={{
            icon: 'arrow-back',
            color: '#fff',
            onPress: () => onNavigate('welcome')
          }}
          centerComponent={{ text: 'No PDF', style: { color: '#fff', fontSize: 20 } }}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text h3 style={{ textAlign: 'center', marginBottom: 15 }}>
            No PDF Selected
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 20, color: '#6c757d' }}>
            Please select a PDF to fill
          </Text>
          <Button 
            title="← Back to Home" 
            onPress={() => onNavigate('welcome')} 
            buttonStyle={{ backgroundColor: '#1e3a8a' }} 
          />
        </View>
      </View>
    );
  }

  // PDF Viewer component
  const renderPDFViewer = () => {
    if (Platform.OS === 'web') {
      return (
        <iframe
          src={pdfSource}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 4,
          }}
          onLoad={handlePDFLoad}
          onError={handlePDFError}
          title="PDF Viewer"
        />
      );
    } else {
      return (
        <WebView
          source={{ uri: pdfSource }}
          style={{ flex: 1 }}
          onLoadEnd={handlePDFLoad}
          onError={handlePDFError}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#1e3a8a" />
              <Text style={{ marginTop: 15, color: '#6c757d' }}>Loading PDF...</Text>
            </View>
          )}
        />
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <Header
        leftComponent={{
          icon: 'arrow-back',
          color: '#fff',
          onPress: () => onNavigate('welcome')
        }}
        centerComponent={{ 
          text: 'Fill PDF Form', 
          style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } 
        }}
        rightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {objects.length > 0 && (
              <Badge
                value={objects.length}
                status="success"
                containerStyle={{ marginRight: 10 }}
              />
            )}
            <Button
              title="Save"
              buttonStyle={{ backgroundColor: 'transparent', padding: 8 }}
              titleStyle={{ fontSize: 14 }}
              onPress={handleSave}
              loading={isSaving}
            />
          </View>
        }
      />

      {/* Tool Selection */}
      <Card containerStyle={{ margin: 10, marginBottom: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', flex: 1, color: '#343a40' }}>
            Quick Tools:
          </Text>
          <Button
            title={`Add ${tools[selectedToolIndex]}`}
            buttonStyle={{ backgroundColor: '#28a745', paddingHorizontal: 15 }}
            titleStyle={{ fontSize: 12 }}
            onPress={quickAddTool}
          />
        </View>
        
        <ButtonGroup
          onPress={setSelectedToolIndex}
          selectedIndex={selectedToolIndex}
          buttons={tools.map(tool => `${tool === 'Text' ? '📝' : tool === 'Signature' ? '✍️' : tool === 'Date' ? '📅' : '☐'} ${tool}`)}
          containerStyle={{ height: 40, marginBottom: 0 }}
          selectedButtonStyle={{ backgroundColor: '#1e3a8a' }}
        />
      </Card>

      {/* Advanced Tools & Controls */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        style={{ maxHeight: 60 }}
      >
        <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 5 }}>
          <Button
            title="✍️ My Sig"
            buttonStyle={{ backgroundColor: '#17a2b8', paddingHorizontal: 12 }}
            titleStyle={{ fontSize: 11 }}
            onPress={handleAddMySignature}
          />
          
          <Button
            title="🕒 Time"
            buttonStyle={{ backgroundColor: '#ffc107', paddingHorizontal: 12 }}
            titleStyle={{ fontSize: 11, color: '#000' }}
            onPress={() => addObject('timestamp')}
          />
          
          <Button
            title="🔍−"
            buttonStyle={{ backgroundColor: '#6c757d', paddingHorizontal: 12 }}
            titleStyle={{ fontSize: 11 }}
            onPress={zoomOut}
            disabled={currentScaleIndex <= 0}
          />
          
          <Text style={{ 
            alignSelf: 'center', 
            fontSize: 12, 
            fontWeight: 'bold', 
            color: '#343a40',
            minWidth: 50,
            textAlign: 'center'
          }}>
            {Math.round(scale * 100)}%
          </Text>
          
          <Button
            title="🔍+"
            buttonStyle={{ backgroundColor: '#6c757d', paddingHorizontal: 12 }}
            titleStyle={{ fontSize: 11 }}
            onPress={zoomIn}
            disabled={currentScaleIndex >= scaleOptions.length - 1}
          />
          
          <Button
            title="🗑️ Clear"
            buttonStyle={{ backgroundColor: '#dc3545', paddingHorizontal: 12 }}
            titleStyle={{ fontSize: 11 }}
            onPress={clearAllObjects}
          />
        </View>
      </ScrollView>

      {/* PDF Display */}
      <Card containerStyle={{ 
        flex: 1, 
        margin: 10,
        marginTop: 5,
        borderRadius: 8,
        padding: 0,
        overflow: 'hidden'
      }}>
        {!pdfLoaded && (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.9)',
            zIndex: 1000
          }}>
            <ActivityIndicator size="large" color="#1e3a8a" />
            <Text style={{ marginTop: 15, color: '#6c757d' }}>Loading PDF...</Text>
          </View>
        )}
        
        <View style={{ 
          flex: 1,
          transform: [{ scale }],
          backgroundColor: '#fff'
        }}>
          {renderPDFViewer()}
          
          {/* Field Overlay */}
          {pdfLoaded && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}>
              {objects
                .filter(obj => obj.page === currentPage)
                .map(object => (
                  <EditableField
                    key={object.id}
                    object={object}
                    scale={1}
                    selected={selectedId === object.id}
                    editing={editingId === object.id}
                    onUpdate={updateObject}
                    onSelect={setSelectedId}
                    onStartEdit={setEditingId}
                    onFinishEdit={() => setEditingId(null)}
                    onDelete={() => deleteObject(object.id)}
                  />
                ))
              }
            </View>
          )}
        </View>
      </Card>

      {/* Status Bar */}
      <View style={{ 
        backgroundColor: '#f8f9fa', 
        padding: 10, 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#dee2e6'
      }}>
        <Text style={{ fontSize: 12, color: '#6c757d' }}>
          File: {pdf?.name || 'Unknown'}
        </Text>
        <Text style={{ fontSize: 12, color: '#6c757d' }}>
          Fields: {objects.length} • Selected: {selectedId ? '1' : '0'}
        </Text>
      </View>

      {/* Signature Dialog */}
      <Overlay 
        isVisible={showSignatureDialog}
        onBackdropPress={() => setShowSignatureDialog(false)}
        overlayStyle={{ borderRadius: 16, padding: 20, width: '90%', maxWidth: 400 }}
      >
        <SignatureDialog
          onSave={handleSignatureSave}
          onCancel={() => setShowSignatureDialog(false)}
          signatureType={signatureType}
        />
      </Overlay>
    </View>
  );
};

export default FillPage;