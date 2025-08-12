// components/PDFEditor/SignatureDialog.js - Clean component with imported styles
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Dimensions 
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { signatureDialogStyles } from './PDFEditorStyles';

const SignatureDialog = ({ visible, onClose, onSave, signatureType }) => {
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [drawing, setDrawing] = useState(false);

  const { width: screenWidth } = Dimensions.get('window');
  const canvasWidth = Math.min(350, screenWidth - 60);
  const canvasHeight = 150;

  const handleTouchStart = (event) => {
    setDrawing(true);
    const { locationX, locationY } = event.nativeEvent;
    const newPath = `M${locationX},${locationY}`;
    setCurrentPath(newPath);
  };

  const handleTouchMove = (event) => {
    if (!drawing) return;
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(prev => prev + ` L${locationX},${locationY}`);
  };

  const handleTouchEnd = () => {
    if (currentPath) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath('');
    }
    setDrawing(false);
  };

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const saveSignature = async () => {
    if (paths.length === 0 && !currentPath) {
      alert('Please draw a signature first');
      return;
    }

    try {
      // Create SVG string
      const allPaths = [...paths, currentPath].filter(p => p);
      const svgString = `
        <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
          ${allPaths.map(path => `<path d="${path}" stroke="black" stroke-width="2" fill="none" />`).join('')}
        </svg>
      `;

      // Convert to data URL
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
      
      onSave(svgDataUrl);
      
      // Clear the signature after saving
      clearSignature();
    } catch (error) {
      console.error('❌ Error saving signature:', error);
      alert('Error saving signature');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={signatureDialogStyles.modalOverlay}>
        <View style={signatureDialogStyles.modalDialog}>
          {/* Header */}
          <View style={signatureDialogStyles.modalHeader}>
            <Text style={signatureDialogStyles.modalTitle}>
              {signatureType === 'my' ? 'Create My Signature' : 'Customer Signature'}
            </Text>
            {signatureType === 'my' && (
              <Text style={signatureDialogStyles.modalSubtitle}>
                This signature will be saved for future use
              </Text>
            )}
          </View>

          {/* Drawing Canvas */}
          <View style={signatureDialogStyles.canvasContainer}>
            <View 
              style={[signatureDialogStyles.signatureCanvas, { width: canvasWidth, height: canvasHeight }]}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Svg width={canvasWidth} height={canvasHeight}>
                {paths.map((path, index) => (
                  <Path
                    key={index}
                    d={path}
                    stroke="#000000"
                    strokeWidth="2"
                    fill="none"
                  />
                ))}
                {currentPath && (
                  <Path
                    d={currentPath}
                    stroke="#000000"
                    strokeWidth="2"
                    fill="none"
                  />
                )}
              </Svg>
            </View>
            <Text style={signatureDialogStyles.canvasHint}>Sign above with your finger</Text>
          </View>

          {/* Action Buttons */}
          <View style={signatureDialogStyles.modalActions}>
            <TouchableOpacity 
              style={[signatureDialogStyles.modalButton, signatureDialogStyles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={signatureDialogStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[signatureDialogStyles.modalButton, signatureDialogStyles.clearButton]} 
              onPress={clearSignature}
            >
              <Text style={signatureDialogStyles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[signatureDialogStyles.modalButton, signatureDialogStyles.saveButton]} 
              onPress={saveSignature}
            >
              <Text style={signatureDialogStyles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SignatureDialog;