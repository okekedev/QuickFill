import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Universal file reading for PDF processing
export const readFileAsBase64 = async (fileAsset) => {
  console.log('readFileAsBase64 called with:', fileAsset);
  console.log('Platform:', Platform.OS);
  
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      if (fileAsset.uri) {
        console.log('Web: Reading from URI');
        fetch(fileAsset.uri)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              console.log('Web: Base64 length:', base64.length);
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
          .catch(reject);
      } else if (fileAsset.file) {
        console.log('Web: Reading from file object');
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          console.log('Web: Base64 length:', base64.length);
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileAsset.file);
      } else {
        reject(new Error('No valid file or URI found'));
      }
    } else {
      // For iOS/Android, use FileSystem to read the file
      console.log('Mobile: Reading file from URI:', fileAsset.uri);
      if (fileAsset.uri) {
        // Add timeout and error handling for mobile file reading
        const timeoutId = setTimeout(() => {
          reject(new Error('File reading timeout - file may be too large or corrupted'));
        }, 30000); // 30 second timeout
        
        FileSystem.readAsStringAsync(fileAsset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        })
        .then(base64 => {
          clearTimeout(timeoutId);
          console.log('Mobile: Base64 length:', base64?.length || 0);
          
          // Validate the base64 result
          if (!base64 || base64.length === 0) {
            reject(new Error('Empty file or failed to read content'));
            return;
          }
          
          // Basic PDF validation - check for PDF header
          try {
            const pdfHeader = atob(base64.substring(0, 20));
            if (!pdfHeader.startsWith('%PDF')) {
              console.warn('File may not be a valid PDF');
            }
          } catch (headerError) {
            console.warn('Could not validate PDF header:', headerError);
          }
          
          console.log('Mobile: Base64 first 100 chars:', base64.substring(0, 100));
          resolve(base64);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('FileSystem read error:', error);
          reject(new Error(`Failed to read file: ${error.message || 'Unknown error'}`));
        });
      } else {
        reject(new Error('No valid URI found for mobile platform'));
      }
    }
  });
};

// File picking utilities
export const pickPDFFile = async () => {
  try {
    console.log('pickPDFFile called on platform:', Platform.OS);
    
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    
    console.log('DocumentPicker result:', result);
    
    // Check if canceled (new API structure)
    if (result.canceled) {
      console.log('File picking was canceled');
      return { success: false, canceled: true };
    }
    
    // Get the first asset from the assets array
    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      console.log('Selected file:', {
        name: file.name,
        size: file.size,
        uri: file.uri,
        mimeType: file.mimeType
      });
      
      return {
        success: true,
        uri: file.uri,
        name: file.name,
        size: file.size,
      };
    }
    
    console.log('No file selected from assets');
    return { success: false, error: 'No file selected' };
  } catch (error) {
    console.error('Error picking PDF file:', error);
    return { success: false, error: error.message };
  }
};

export const pickMultipleFiles = async (types = ['application/pdf']) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: types,
      multiple: true,
      copyToCacheDirectory: true,
    });
    
    if (result.type === 'success') {
      return {
        success: true,
        files: Array.isArray(result) ? result : [result],
      };
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    console.error('Error picking multiple files:', error);
    return { success: false, error: error.message };
  }
};

// File system utilities
export const saveToDevice = async (content, filename, mimeType = 'application/json') => {
  try {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, content);
    
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri);
      return { success: true, shared: true };
    } else {
      return { success: true, saved: fileUri };
    }
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
};

export const readFromDevice = async (fileUri) => {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    return { success: true, content };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
};

export const deleteFile = async (fileUri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri);
      return { success: true };
    } else {
      return { success: false, error: 'File does not exist' };
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

// File validation utilities
export const getFileInfo = async (fileUri) => {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    return {
      success: true,
      exists: info.exists,
      size: info.size,
      modificationTime: info.modificationTime,
      uri: info.uri,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return { success: false, error: error.message };
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
};

export const isValidFileType = (filename, allowedTypes = ['.pdf']) => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};