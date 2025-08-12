// App.js - Clean with imported styles
import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform } from 'react-native';

// Import our components
import PDFEditor from './components/PDFEditor/PDFEditor';
import FileUploader from './components/FileUploader/FileUploader';
import PDFCombiner from './components/PDFCombiner/PDFCombiner';
import NavigationHeader from './components/Navigation/NavigationHeader';

// Import styles
import { styles } from './styles/AppStyles';

export default function App() {
  const [currentView, setCurrentView] = useState('upload'); // 'upload', 'editor', 'combine'
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = async (file) => {
    console.log('📎 File uploaded:', file.name);
    setUploadedFiles(prev => [...prev, file]);
    
    // If it's a PDF, we can open it in editor
    if (file.mimeType === 'application/pdf') {
      setSelectedPDF(file);
      setCurrentView('editor');
    }
  };

  const handleOpenPDF = (pdf) => {
    setSelectedPDF(pdf);
    setCurrentView('editor');
  };

  const handleClosePDF = () => {
    setSelectedPDF(null);
    setCurrentView('upload');
  };

  const handleSavePDF = async (pdfData) => {
    try {
      console.log('💾 Saving PDF:', pdfData.fileName);
      
      // Here you would implement the actual save logic
      // For now, we'll just show a success message
      if (Platform.OS === 'web') {
        alert('PDF saved successfully!');
      } else {
        Alert.alert('Success', 'PDF saved successfully!');
      }
      
      // Update the file in our list
      setUploadedFiles(prev => prev.map(file => 
        file.uri === selectedPDF.uri ? { ...file, ...pdfData } : file
      ));
      
    } catch (error) {
      console.error('❌ Error saving PDF:', error);
      if (Platform.OS === 'web') {
        alert('Error saving PDF: ' + error.message);
      } else {
        Alert.alert('Error', 'Failed to save PDF: ' + error.message);
      }
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'editor':
        return selectedPDF ? (
          <PDFEditor
            pdf={selectedPDF}
            onClose={handleClosePDF}
            onSave={handleSavePDF}
          />
        ) : null;
        
      case 'combine':
        return (
          <PDFCombiner
            files={uploadedFiles.filter(f => f.mimeType === 'application/pdf')}
            onBack={() => setCurrentView('upload')}
            onCombineComplete={(combinedPDF) => {
              setUploadedFiles(prev => [...prev, combinedPDF]);
              setCurrentView('upload');
            }}
          />
        );
        
      default:
        return (
          <FileUploader
            onFileUpload={handleFileUpload}
            uploadedFiles={uploadedFiles}
            onOpenPDF={handleOpenPDF}
            onCombinePDFs={() => setCurrentView('combine')}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <NavigationHeader
        currentView={currentView}
        onNavigate={setCurrentView}
        hasFiles={uploadedFiles.length > 0}
        showBackButton={currentView !== 'upload'}
        onBack={() => {
          if (currentView === 'editor') {
            handleClosePDF();
          } else {
            setCurrentView('upload');
          }
        }}
      />
      
      <View style={styles.contentContainer}>
        {renderCurrentView()}
      </View>
    </View>
  );
}