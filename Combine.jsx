// pages/CombinePage.js - PDF combination screen
import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { 
  Header, 
  Card, 
  Button, 
  Text, 
  ListItem, 
  Avatar,
  CheckBox,
  Divider,
  Overlay,
  Input
} from 'react-native-elements';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const CombinePage = ({ onNavigate, uploadedFiles, onFileUpload }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [combinedFileName, setCombinedFileName] = useState('');

  // Handle file upload
  const handleUpload = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const files = result.assets.map(asset => ({
          id: Date.now() + Math.random(),
          name: asset.name,
          uri: asset.uri,
          size: asset.size,
          mimeType: asset.mimeType,
          uploadDate: new Date().toLocaleDateString(),
        }));
        
        onFileUpload(files);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Select all files
  const selectAllFiles = () => {
    if (selectedFiles.length === uploadedFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(uploadedFiles.map(f => f.id));
    }
  };

  // Start combine process
  const startCombine = () => {
    if (selectedFiles.length < 2) {
      Alert.alert('Error', 'Please select at least 2 PDFs to combine');
      return;
    }
    
    const defaultName = `Combined_${selectedFiles.length}_PDFs_${new Date().getTime()}`;
    setCombinedFileName(defaultName);
    setShowNameDialog(true);
  };

  // Combine PDFs (mock implementation)
  const combinePDFs = async () => {
    if (!combinedFileName.trim()) {
      Alert.alert('Error', 'Please enter a file name');
      return;
    }

    setIsCombining(true);
    setShowNameDialog(false);

    try {
      // Mock PDF combination process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock combined PDF
      const combinedPDF = {
        id: Date.now(),
        name: combinedFileName.endsWith('.pdf') ? combinedFileName : `${combinedFileName}.pdf`,
        uri: 'mock://combined-pdf-uri',
        size: selectedFiles.reduce((total, id) => {
          const file = uploadedFiles.find(f => f.id === id);
          return total + (file?.size || 0);
        }, 0),
        mimeType: 'application/pdf',
        uploadDate: new Date().toLocaleDateString(),
        combined: true,
        sourceFiles: selectedFiles.length,
      };

      onFileUpload([combinedPDF]);
      setSelectedFiles([]);
      
      Alert.alert(
        'Success!', 
        `Successfully combined ${selectedFiles.length} PDFs into "${combinedPDF.name}"`,
        [
          { text: 'OK', onPress: () => onNavigate('welcome') }
        ]
      );
    } catch (error) {
      console.error('Combine error:', error);
      Alert.alert('Error', 'Failed to combine PDFs');
    } finally {
      setIsCombining(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          text: 'Combine PDFs', 
          style: { color: '#fff', fontSize: 20, fontWeight: 'bold' } 
        }}
        rightComponent={{
          icon: 'help',
          color: '#fff',
          onPress: () => Alert.alert(
            'How to Combine PDFs',
            '1. Upload or select PDFs from your list\n2. Check the files you want to combine\n3. Tap "Combine Selected"\n4. Enter a name for your combined PDF'
          )
        }}
      />

      <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        {/* Instructions */}
        <Card containerStyle={{ margin: 15 }}>
          <Text h4 style={{ marginBottom: 10, color: '#1e3a8a' }}>
            Combine Multiple PDFs
          </Text>
          <Text style={{ color: '#6c757d', marginBottom: 15 }}>
            Select the PDFs you want to combine into a single document. The files will be merged in the order shown below.
          </Text>
          
          <Button
            title="📁 Upload More PDFs"
            buttonStyle={{ backgroundColor: '#17a2b8' }}
            onPress={handleUpload}
            loading={isUploading}
          />
        </Card>

        {/* Selection Controls */}
        {uploadedFiles.length > 0 && (
          <Card containerStyle={{ margin: 15 }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 15 
            }}>
              <Text h4 style={{ color: '#343a40' }}>
                PDF Files ({uploadedFiles.length})
              </Text>
              
              <Button
                title={selectedFiles.length === uploadedFiles.length ? "Deselect All" : "Select All"}
                buttonStyle={{ 
                  backgroundColor: selectedFiles.length === uploadedFiles.length ? '#6c757d' : '#28a745',
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                }}
                titleStyle={{ fontSize: 12 }}
                onPress={selectAllFiles}
              />
            </View>

            {/* Selected count */}
            {selectedFiles.length > 0 && (
              <Text style={{ 
                color: '#1e3a8a', 
                fontWeight: 'bold',
                marginBottom: 10 
              }}>
                {selectedFiles.length} file(s) selected
              </Text>
            )}
          </Card>
        )}

        {/* File List */}
        {uploadedFiles.length > 0 ? (
          <Card containerStyle={{ margin: 15 }}>
            {uploadedFiles.map((file, index) => (
              <View key={file.id}>
                <ListItem containerStyle={{ paddingHorizontal: 0 }}>
                  <CheckBox
                    checked={selectedFiles.includes(file.id)}
                    onPress={() => toggleFileSelection(file.id)}
                    checkedColor="#1e3a8a"
                  />
                  
                  <Avatar
                    source={{ uri: 'https://via.placeholder.com/40/dc3545/ffffff?text=PDF' }}
                    size="small"
                  />
                  
                  <ListItem.Content>
                    <ListItem.Title style={{ fontSize: 16, fontWeight: '500' }}>
                      {file.name}
                    </ListItem.Title>
                    <ListItem.Subtitle style={{ color: '#6c757d' }}>
                      {formatFileSize(file.size)} • {file.uploadDate}
                      {file.combined && ` • Combined from ${file.sourceFiles} files`}
                    </ListItem.Subtitle>
                  </ListItem.Content>
                  
                  <Text style={{ 
                    color: '#6c757d', 
                    fontSize: 12,
                    fontWeight: 'bold' 
                  }}>
                    #{index + 1}
                  </Text>
                </ListItem>
                {index < uploadedFiles.length - 1 && <Divider />}
              </View>
            ))}
          </Card>
        ) : (
          /* Empty State */
          <Card containerStyle={{ margin: 15, padding: 30, alignItems: 'center' }}>
            <Text h4 style={{ color: '#6c757d', marginBottom: 10 }}>
              No PDFs Available
            </Text>
            <Text style={{ 
              textAlign: 'center', 
              color: '#6c757d', 
              marginBottom: 20 
            }}>
              Upload some PDF files to combine them
            </Text>
            
            <Button
              title="📁 Upload PDFs"
              buttonStyle={{ backgroundColor: '#1e3a8a' }}
              onPress={handleUpload}
              loading={isUploading}
            />
          </Card>
        )}

        {/* Combine Button */}
        {selectedFiles.length > 0 && (
          <Card containerStyle={{ margin: 15 }}>
            <Button
              title={
                selectedFiles.length < 2 
                  ? `Select at least 2 PDFs (${selectedFiles.length} selected)`
                  : `🔗 Combine ${selectedFiles.length} PDFs`
              }
              buttonStyle={{ 
                backgroundColor: selectedFiles.length < 2 ? '#6c757d' : '#28a745',
                paddingVertical: 15 
              }}
              titleStyle={{ fontSize: 16, fontWeight: 'bold' }}
              onPress={startCombine}
              disabled={selectedFiles.length < 2}
              loading={isCombining}
            />
            
            {selectedFiles.length >= 2 && (
              <Text style={{ 
                textAlign: 'center', 
                color: '#6c757d', 
                fontSize: 12,
                marginTop: 8 
              }}>
                Files will be combined in the order shown above
              </Text>
            )}
          </Card>
        )}
      </ScrollView>

      {/* File Name Dialog */}
      <Overlay 
        isVisible={showNameDialog}
        onBackdropPress={() => setShowNameDialog(false)}
        overlayStyle={{ 
          borderRadius: 16, 
          padding: 20, 
          width: '90%', 
          maxWidth: 400 
        }}
      >
        <View>
          <Text h4 style={{ textAlign: 'center', marginBottom: 20, color: '#1e3a8a' }}>
            Name Your Combined PDF
          </Text>
          
          <Input
            placeholder="Enter file name"
            value={combinedFileName}
            onChangeText={setCombinedFileName}
            containerStyle={{ marginBottom: 20 }}
            inputStyle={{ fontSize: 16 }}
            rightIcon={{
              type: 'material',
              name: 'picture-as-pdf',
              color: '#dc3545'
            }}
          />
          
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              title="Cancel"
              buttonStyle={{ 
                backgroundColor: '#6c757d',
                flex: 1 
              }}
              onPress={() => setShowNameDialog(false)}
            />
            
            <Button
              title="Combine"
              buttonStyle={{ 
                backgroundColor: '#28a745',
                flex: 1 
              }}
              onPress={combinePDFs}
              loading={isCombining}
            />
          </View>
        </View>
      </Overlay>
    </View>
  );
};

export default CombinePage;