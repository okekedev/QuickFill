// App.js (ROOT DIRECTORY - Using NativeBase 3.4.28 with Latest Dependencies)
import React, { useState } from 'react';
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { Alert } from 'react-native';
import {
  NativeBaseProvider,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ScrollView,
  Modal,
  Input,
  FormControl,
  Pressable,
  Badge,
  Divider,
  Center,
  Spinner,
  useToast
} from 'native-base';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

function AppContent() {
  // ===== STATE =====
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentView, setCurrentView] = useState('picker'); // 'picker' | 'editor'
  const [pdfBase64, setPdfBase64] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [selectedTool, setSelectedTool] = useState('text');
  const [fieldText, setFieldText] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();
  const tools = [
    { id: 'text', label: 'Text', icon: '📝' },
    { id: 'signature', label: 'Signature', icon: '✍️' },
    { id: 'date', label: 'Date', icon: '📅' },
    { id: 'checkbox', label: 'Checkbox', icon: '☑️' }
  ];

  // ===== FILE PICKER =====
  const handlePickDocument = async () => {
    try {
      setIsLoading(true);
      console.log('📎 Starting document picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      console.log('📎 Document picker result:', result);

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        console.log('📎 Selected file:', file);
        setSelectedFile(file);
        
        console.log('📖 Reading file as base64...');
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('📖 Base64 length:', base64.length);
        setPdfBase64(base64);
        
        console.log('🔄 Switching to editor view...');
        setCurrentView('editor');
        
        toast.show({
          description: "PDF loaded successfully!",
          status: "success"
        });
      } else {
        console.log('📎 Document picker was canceled or no file selected');
      }
    } catch (error) {
      console.error('❌ Error picking document:', error);
      toast.show({
        description: `Failed to pick document: ${error.message}`,
        status: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FIELD MANAGEMENT =====
  const addField = (x, y) => {
    const newField = {
      id: `field_${Date.now()}`,
      type: selectedTool,
      x, y,
      width: selectedTool === 'checkbox' ? 20 : 120,
      height: selectedTool === 'checkbox' ? 20 : 30,
      text: selectedTool === 'date' ? new Date().toLocaleDateString() : '',
      label: `${selectedTool} Field`,
    };
    
    setFields(prev => [...prev, newField]);
    setSelectedField(newField);
    setFieldText(newField.text);
    setFieldLabel(newField.label);
    setShowFieldEditor(true);
    
    toast.show({
      description: `${selectedTool} field added`,
      status: "info"
    });
  };

  const updateField = (fieldId, updates) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const deleteField = () => {
    if (selectedField) {
      setFields(prev => prev.filter(field => field.id !== selectedField.id));
      setSelectedField(null);
      setShowFieldEditor(false);
      
      toast.show({
        description: "Field deleted",
        status: "warning"
      });
    }
  };

  const saveFieldChanges = () => {
    if (selectedField) {
      updateField(selectedField.id, { text: fieldText, label: fieldLabel });
      toast.show({
        description: "Field updated",
        status: "success"
      });
    }
    setShowFieldEditor(false);
  };

  // ===== PDF VIEWER HTML =====
  const getPdfViewerHtml = () => {
    const fieldsHtml = fields.map(field => {
      const isSelected = selectedField?.id === field.id;
      const borderStyle = isSelected ? 'border: 2px solid #3182ce;' : 'border: 1px solid #ccc;';
      
      let fieldContent = '';
      switch (field.type) {
        case 'text':
          fieldContent = `<input type="text" value="${field.text}" placeholder="${field.label}" style="width:100%;height:100%;border:none;background:transparent;font-size:14px;">`;
          break;
        case 'signature':
          fieldContent = `<div style="display:flex;align-items:center;justify-content:center;font-size:12px;color:#666;">✍️ Sign</div>`;
          break;
        case 'date':
          fieldContent = `<input type="date" value="${field.text}" style="width:100%;height:100%;border:none;background:transparent;font-size:14px;">`;
          break;
        case 'checkbox':
          fieldContent = `<input type="checkbox" ${field.text === 'true' ? 'checked' : ''} style="width:100%;height:100%;">`;
          break;
      }

      return `
        <div style="position:absolute;left:${field.x}px;top:${field.y}px;width:${field.width}px;height:${field.height}px;${borderStyle}background:rgba(255,255,255,0.9);border-radius:4px;cursor:pointer;z-index:1000;" onclick="selectField('${field.id}')" ondblclick="editField('${field.id}')">
          ${fieldContent}
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 20px; background: #f7fafc; font-family: system-ui; }
            #pdf-container { position: relative; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
            #pdf-embed { width: 100%; height: 800px; border: none; }
          </style>
        </head>
        <body>
          <div id="pdf-container">
            <embed id="pdf-embed" src="data:application/pdf;base64,${pdfBase64}" type="application/pdf" />
            ${fieldsHtml}
          </div>
          <script>
            function selectField(fieldId) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selectField', fieldId }));
            }
            function editField(fieldId) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'editField', fieldId }));
            }
            document.getElementById('pdf-container').addEventListener('click', function(e) {
              if (e.target.id === 'pdf-container' || e.target.id === 'pdf-embed') {
                const rect = this.getBoundingClientRect();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'addField',
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top
                }));
              }
            });
          </script>
        </body>
      </html>
    `;
  };

  // ===== WEBVIEW MESSAGE HANDLER =====
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'addField':
          addField(data.x, data.y);
          break;
        case 'selectField':
          const field = fields.find(f => f.id === data.fieldId);
          setSelectedField(field);
          break;
        case 'editField':
          const editField = fields.find(f => f.id === data.fieldId);
          if (editField) {
            setSelectedField(editField);
            setFieldText(editField.text);
            setFieldLabel(editField.label);
            setShowFieldEditor(true);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  // ===== RENDER PICKER VIEW =====
  if (currentView === 'picker') {
    return (
      <GluestackUIProvider mode="light"><Box flex={1} bg="gray.50" safeAreaTop>
          <StatusBar style="auto" />
          {/* Header */}
          <Box bg="blue.600" px={4} py={4} shadow={2}>
            <Text fontSize="xl" fontWeight="bold" color="white" textAlign="center">
              📄 PDF Form Editor
            </Text>
          </Box>
          <ScrollView flex={1} p={4}>
            <Center>
              <Box 
                bg="white" 
                rounded="xl" 
                shadow={3} 
                p={8} 
                m={4} 
                w="full" 
                maxW="400px"
              >
                <VStack space={6} alignItems="center">
                  <VStack space={2} alignItems="center">
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                      Select PDF to Edit
                    </Text>
                    <Text fontSize="md" color="gray.600" textAlign="center">
                      Choose a PDF file to add interactive form fields
                    </Text>
                  </VStack>
                  
                  <Button
                    size="lg"
                    colorScheme="blue"
                    rounded="lg"
                    onPress={handlePickDocument}
                    isLoading={isLoading}
                    loadingText="Loading..."
                    _loading={{
                      bg: "blue.400",
                      _text: { color: "white" }
                    }}
                    w="full"
                  >
                    📄 Pick PDF File
                  </Button>

                  {selectedFile && (
                    <Box w="full">
                      <Divider my={4} />
                      <Text fontSize="sm" color="gray.500" mb={3} fontWeight="semibold">
                        SELECTED FILE
                      </Text>
                      
                      <Box bg="gray.50" p={4} rounded="lg">
                        <VStack space={3}>
                          <HStack alignItems="center" space={3}>
                            <Text fontSize="2xl">📎</Text>
                            <VStack flex={1} space={1}>
                              <Text fontSize="md" fontWeight="semibold" color="gray.800">
                                {selectedFile.name}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </Text>
                            </VStack>
                          </HStack>
                          
                          <HStack alignItems="center" space={2}>
                            <Text fontSize="sm" color="gray.600">Status:</Text>
                            <Badge 
                              colorScheme={pdfBase64 ? "green" : "red"} 
                              variant="solid"
                              rounded="md"
                            >
                              {pdfBase64 ? "✅ Ready" : "❌ Loading"}
                            </Badge>
                          </HStack>

                          {/* Debug button */}
                          <Button
                            variant="outline"
                            colorScheme="orange"
                            size="sm"
                            onPress={() => setCurrentView('editor')}
                            rounded="md"
                          >
                            🔧 Switch to Editor (Debug)
                          </Button>
                        </VStack>
                      </Box>
                    </Box>
                  )}
                </VStack>
              </Box>
            </Center>
          </ScrollView>
        </Box></GluestackUIProvider>
    );
  }

  // ===== RENDER PDF EDITOR =====
  return (
    <GluestackUIProvider mode="light"><Box flex={1} bg="gray.50" safeAreaTop>
        <StatusBar style="auto" />
        {/* Header */}
        <Box bg="blue.600" px={4} py={3} shadow={2}>
          <HStack alignItems="center" justifyContent="space-between">
            <Pressable onPress={() => {
              setCurrentView('picker');
              setSelectedFile(null);
              setPdfBase64(null);
              setFields([]);
              setSelectedField(null);
            }}>
              <Text color="white" fontSize="md" fontWeight="medium">← Back</Text>
            </Pressable>
            
            <Text 
              fontSize="lg" 
              fontWeight="bold" 
              color="white" 
              flex={1} 
              textAlign="center" 
              numberOfLines={1}
              px={4}
            >
              {selectedFile?.name || 'PDF Editor'}
            </Text>
            
            <Pressable onPress={() => {
              Alert.alert(
                'Save PDF', 
                `Save PDF with ${fields.length} fields?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Save', onPress: () => {
                    toast.show({
                      description: `PDF saved with ${fields.length} fields!`,
                      status: "success"
                    });
                  }}
                ]
              );
            }}>
              <Text color="white" fontSize="md" fontWeight="semibold">Save</Text>
            </Pressable>
          </HStack>
        </Box>
        <VStack flex={1} space={0}>
          {/* Tool Selector */}
          <Box bg="white" p={4} shadow={1}>
            <Text fontSize="sm" color="gray.600" mb={3} fontWeight="semibold">
              SELECT TOOL:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HStack space={3}>
                {tools.map(tool => (
                  <Button
                    key={tool.id}
                    variant={selectedTool === tool.id ? "solid" : "outline"}
                    colorScheme="blue"
                    size="sm"
                    onPress={() => setSelectedTool(tool.id)}
                    minW={24}
                    rounded="lg"
                  >
                    <Text fontSize="sm">{tool.icon} {tool.label}</Text>
                  </Button>
                ))}
              </HStack>
            </ScrollView>
          </Box>

          {/* PDF Viewer */}
          <Box flex={1} m={4}>
            <Box flex={1} bg="white" rounded="xl" shadow={3} overflow="hidden">
              {pdfBase64 ? (
                <WebView
                  source={{ html: getPdfViewerHtml() }}
                  style={{ flex: 1 }}
                  onMessage={handleWebViewMessage}
                  javaScriptEnabled={true}
                />
              ) : (
                <Center flex={1}>
                  <VStack alignItems="center" space={4}>
                    <Spinner size="lg" color="blue.500" />
                    <Text fontSize="lg" color="gray.600">Loading PDF...</Text>
                  </VStack>
                </Center>
              )}
            </Box>
          </Box>

          {/* Field Info */}
          {fields.length > 0 && (
            <Box bg="white" mx={4} mb={4} p={4} rounded="xl" shadow={2}>
              <HStack alignItems="center" justifyContent="space-between">
                <HStack alignItems="center" space={3}>
                  <Text fontSize="2xl">📋</Text>
                  <VStack>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      {fields.length} field{fields.length !== 1 ? 's' : ''} added
                    </Text>
                    {selectedField && (
                      <Text fontSize="sm" color="blue.600" fontWeight="medium">
                        Selected: {selectedField.label}
                      </Text>
                    )}
                  </VStack>
                </HStack>
                
                {selectedField && (
                  <Button
                    variant="outline"
                    colorScheme="red"
                    size="sm"
                    onPress={deleteField}
                    rounded="lg"
                  >
                    🗑️ Delete
                  </Button>
                )}
              </HStack>
            </Box>
          )}
        </VStack>
        {/* Field Editor Modal */}
        <Modal isOpen={showFieldEditor} onClose={() => setShowFieldEditor(false)}>
          <Modal.Content maxWidth="400px">
            <Modal.CloseButton />
            <Modal.Header>
              <Text fontSize="lg" fontWeight="bold">Edit Field</Text>
            </Modal.Header>
            <Modal.Body>
              <VStack space={4}>
                <FormControl>
                  <FormControl.Label>
                    <Text fontWeight="medium">Field Label</Text>
                  </FormControl.Label>
                  <Input
                    value={fieldLabel}
                    onChangeText={setFieldLabel}
                    placeholder="Enter field label"
                    bg="gray.50"
                    rounded="lg"
                  />
                </FormControl>

                <FormControl>
                  <FormControl.Label>
                    <Text fontWeight="medium">Field Value</Text>
                  </FormControl.Label>
                  <Input
                    value={fieldText}
                    onChangeText={setFieldText}
                    placeholder="Enter field value"
                    multiline={selectedField?.type === 'text'}
                    bg="gray.50"
                    rounded="lg"
                  />
                </FormControl>

                {selectedField && (
                  <Box bg="gray.50" p={4} rounded="lg">
                    <Text fontSize="sm" color="gray.600" mb={2} fontWeight="semibold">
                      FIELD INFO
                    </Text>
                    <VStack space={1}>
                      <Text fontSize="sm" color="gray.700">
                        <Text fontWeight="medium">Type:</Text> {selectedField.type}
                      </Text>
                      <Text fontSize="sm" color="gray.700">
                        <Text fontWeight="medium">Position:</Text> ({selectedField.x}, {selectedField.y})
                      </Text>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Modal.Body>
            <Modal.Footer>
              <Button.Group space={2}>
                <Button
                  variant="ghost"
                  colorScheme="blueGray"
                  onPress={() => setShowFieldEditor(false)}
                  rounded="lg"
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onPress={saveFieldChanges}
                  rounded="lg"
                >
                  Save Changes
                </Button>
              </Button.Group>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      </Box></GluestackUIProvider>
  );
}

export default function App() {
  return (
    <GluestackUIProvider mode="light"><NativeBaseProvider>
        <AppContent />
      </NativeBaseProvider></GluestackUIProvider>
  );
}