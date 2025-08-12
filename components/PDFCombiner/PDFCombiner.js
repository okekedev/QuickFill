// components/PDFCombiner/PDFCombiner.js - Clean component with imported styles
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert
} from 'react-native';
import { pdfCombinerStyles } from './PDFCombinerStyles';

const PDFCombiner = ({ files, onBack, onCombineComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState(files.map(f => f.uri));
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleFileSelection = (fileUri) => {
    setSelectedFiles(prev => 
      prev.includes(fileUri) 
        ? prev.filter(uri => uri !== fileUri)
        : [...prev, fileUri]
    );
  };

  const moveFileUp = (index) => {
    const selectedUris = files.filter(f => selectedFiles.includes(f.uri)).map(f => f.uri);
    const currentIndex = selectedUris.findIndex(uri => uri === files[index].uri);
    if (currentIndex > 0) {
      const newOrder = [...selectedUris];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      setSelectedFiles(newOrder);
    }
  };

  const moveFileDown = (index) => {
    const selectedUris = files.filter(f => selectedFiles.includes(f.uri)).map(f => f.uri);
    const currentIndex = selectedUris.findIndex(uri => uri === files[index].uri);
    if (currentIndex < selectedUris.length - 1) {
      const newOrder = [...selectedUris];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      setSelectedFiles(newOrder);
    }
  };

  const combinePDFs = async () => {
    if (selectedFiles.length < 2) {
      Alert.alert('Error', 'Please select at least 2 PDFs to combine');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Here you would implement the actual PDF combination logic
      // For now, we'll simulate the process
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      const combinedPDF = {
        name: `Combined_${Date.now()}.pdf`,
        uri: `combined_${Date.now()}`, // This would be the actual combined PDF URI
        mimeType: 'application/pdf',
        size: selectedFiles.reduce((total, uri) => {
          const file = files.find(f => f.uri === uri);
          return total + (file?.size || 0);
        }, 0),
        createdAt: new Date().toISOString(),
      };

      onCombineComplete(combinedPDF);
      Alert.alert('Success', `Combined ${selectedFiles.length} PDFs successfully!`);
      
    } catch (error) {
      console.error('❌ Error combining PDFs:', error);
      Alert.alert('Error', 'Failed to combine PDFs: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderFileItem = ({ item, index }) => {
    const isSelected = selectedFiles.includes(item.uri);
    const selectedIndex = selectedFiles.indexOf(item.uri);
    
    return (
      <View style={[pdfCombinerStyles.fileItem, isSelected && pdfCombinerStyles.selectedFileItem]}>
        {/* Selection Checkbox */}
        <TouchableOpacity
          style={pdfCombinerStyles.checkbox}
          onPress={() => toggleFileSelection(item.uri)}
          activeOpacity={0.7}
        >
          <View style={[pdfCombinerStyles.checkboxInner, isSelected && pdfCombinerStyles.checkboxSelected]}>
            {isSelected && <Text style={pdfCombinerStyles.checkboxCheck}>✓</Text>}
          </View>
        </TouchableOpacity>
        
        {/* File Info */}
        <View style={pdfCombinerStyles.fileInfo}>
          <Text style={pdfCombinerStyles.fileName} numberOfLines={1}>{item.name}</Text>
          <Text style={pdfCombinerStyles.fileSize}>{Math.round(item.size / 1024)}KB</Text>
          {isSelected && (
            <Text style={pdfCombinerStyles.fileOrder}>Order: {selectedIndex + 1}</Text>
          )}
        </View>
        
        {/* Order Controls */}
        {isSelected && (
          <View style={pdfCombinerStyles.orderControls}>
            <TouchableOpacity
              style={[pdfCombinerStyles.orderButton, selectedIndex === 0 && pdfCombinerStyles.orderButtonDisabled]}
              onPress={() => moveFileUp(index)}
              disabled={selectedIndex === 0}
              activeOpacity={0.7}
            >
              <Text style={pdfCombinerStyles.orderButtonText}>↑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pdfCombinerStyles.orderButton, selectedIndex === selectedFiles.length - 1 && pdfCombinerStyles.orderButtonDisabled]}
              onPress={() => moveFileDown(index)}
              disabled={selectedIndex === selectedFiles.length - 1}
              activeOpacity={0.7}
            >
              <Text style={pdfCombinerStyles.orderButtonText}>↓</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={pdfCombinerStyles.container}>
      {/* Header */}
      <View style={pdfCombinerStyles.header}>
        <Text style={pdfCombinerStyles.title}>Combine PDFs</Text>
        <Text style={pdfCombinerStyles.subtitle}>
          Select PDFs and arrange them in the order you want
        </Text>
        <View style={pdfCombinerStyles.selectionIndicator}>
          <Text style={pdfCombinerStyles.selectionCount}>
            {selectedFiles.length} of {files.length} PDFs selected
          </Text>
        </View>
      </View>

      {/* Files List */}
      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        style={pdfCombinerStyles.filesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={pdfCombinerStyles.filesListContent}
      />

      {/* Actions */}
      <View style={pdfCombinerStyles.actions}>
        <TouchableOpacity 
          style={pdfCombinerStyles.backButton} 
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={pdfCombinerStyles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            pdfCombinerStyles.combineButton,
            (selectedFiles.length < 2 || isProcessing) && pdfCombinerStyles.combineButtonDisabled
          ]}
          onPress={combinePDFs}
          disabled={selectedFiles.length < 2 || isProcessing}
          activeOpacity={0.8}
        >
          <Text style={pdfCombinerStyles.combineButtonText}>
            {isProcessing ? '🔄 Combining...' : `📋 Combine ${selectedFiles.length} PDFs`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PDFCombiner;