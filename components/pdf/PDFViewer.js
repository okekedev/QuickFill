// components/pdf/PDFViewer.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { EditableField } from './EditableField';
import { usePDFEditor } from '../../utils/pdfEditor';
import { readFileAsBase64 } from '../../utils/fileHelpers';
import { components, colors, layout } from '../../styles';
import { Button } from '../ui/Button';

export const PDFViewer = ({ 
  pdfFile,
  pdfBase64: externalPdfBase64,
  objects: externalObjects,
  onFieldUpdate,
  onFieldSelect,
  onFieldEdit,
  onFieldDelete,
  selectedFieldId,
  editingFieldId,
  scale: externalScale,
  setScale: externalSetScale,
  currentPage: externalCurrentPage,
  setCurrentPage: externalSetCurrentPage,
  totalPages: externalTotalPages,
  style,
  ...props 
}) => {
  const [pdfBase64, setPdfBase64] = useState(externalPdfBase64);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // PDF Editor Hook - always create it for canvas rendering
  const {
    canvasRef,
    pdfLoaded,
    pdfError,
    currentPage: internalCurrentPage,
    setCurrentPage: internalSetCurrentPage,
    totalPages: internalTotalPages,
    scale: internalScale,
    setScale: internalSetScale,
    objects: internalObjects,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    updateObject,
    deleteObject,
    getCurrentPageFields
  } = usePDFEditor(pdfBase64);

  // Use external props if provided, otherwise use internal state
  const objects = externalObjects || internalObjects;
  const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;
  const setCurrentPage = externalSetCurrentPage || internalSetCurrentPage;
  const totalPages = externalTotalPages !== undefined ? externalTotalPages : internalTotalPages;
  const scale = externalScale !== undefined ? externalScale : internalScale;
  const setScale = externalSetScale || internalSetScale;

  // Load PDF from file
  useEffect(() => {
    if (externalPdfBase64) {
      setPdfBase64(externalPdfBase64);
      return;
    }

    if (!pdfFile) {
      setPdfBase64(null);
      return;
    }

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const base64 = await readFileAsBase64(pdfFile);
        setPdfBase64(base64);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfFile, externalPdfBase64]);

  // Sync external field selection with internal state
  useEffect(() => {
    if (selectedFieldId !== selectedId) {
      setSelectedId(selectedFieldId);
    }
  }, [selectedFieldId, selectedId, setSelectedId]);

  useEffect(() => {
    if (editingFieldId !== editingId) {
      setEditingId(editingFieldId);
    }
  }, [editingFieldId, editingId, setEditingId]);

  // Sync external page changes to internal state
  useEffect(() => {
    if (externalCurrentPage !== undefined && externalCurrentPage !== internalCurrentPage) {
      internalSetCurrentPage(externalCurrentPage);
    }
  }, [externalCurrentPage, internalCurrentPage, internalSetCurrentPage]);

  // Sync external scale changes to internal state  
  useEffect(() => {
    if (externalScale !== undefined && externalScale !== internalScale) {
      internalSetScale(externalScale);
    }
  }, [externalScale, internalScale, internalSetScale]);

  const handleCanvasClick = (e) => {
    // Deselect fields when clicking on empty PDF area
    if (e.target === canvasRef.current) {
      onFieldSelect?.(null);
    }
  };

  const handleContainerClick = (e) => {
    // Deselect fields when clicking outside the PDF canvas
    if (!canvasRef.current?.contains(e.target)) {
      onFieldSelect?.(null);
      // Also exit editing mode
      onFieldEdit?.(null);
    }
  };

  const handleFieldUpdate = (fieldId, updates) => {
    if (onFieldUpdate) {
      onFieldUpdate(fieldId, updates);
    } else {
      updateObject(fieldId, updates);
    }
  };

  const handleFieldDelete = (fieldId) => {
    if (onFieldDelete) {
      onFieldDelete(fieldId);
    } else {
      deleteObject(fieldId);
    }
  };

  // Get fields for current page only
  const currentFields = objects.filter(obj => obj.page === currentPage);

  return (
    <View style={[{ flex: 1 }, style]} onClick={handleContainerClick} {...props}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={true}
        scrollEventThrottle={16}
        bounces={false}
        horizontal={false}
        directionalLockEnabled={false}
      >
        {loading && (
          <View style={[layout.center, { padding: 50 }]}>
            <Text style={[components.bodyText, { textAlign: 'center', color: colors.text.secondary }]}>
              Loading PDF...
            </Text>
          </View>
        )}
        
        {error && (
          <View style={[layout.center, { padding: 50 }]}>
            <Text style={[components.bodyText, { textAlign: 'center', color: colors.error[500] }]}>
              Error: {error}
            </Text>
          </View>
        )}
        
        {!pdfBase64 && !loading && (
          <View style={[layout.center, { padding: 50 }]}>
            <Text style={[components.bodyText, { textAlign: 'center', color: colors.text.secondary }]}>
              No PDF loaded
            </Text>
          </View>
        )}

        {/* Centered PDF Canvas Container */}
        {pdfBase64 && (
          <View style={{ 
            position: 'relative',
            backgroundColor: colors.white,
            borderRadius: 12,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
            padding: 20,
            alignSelf: 'center'
          }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{
                display: 'block',
                height: 'auto',
                border: '2px solid #f1f5f9',
                borderRadius: 8,
                cursor: 'default',
                backgroundColor: colors.white
              }}
            />
            
            {/* PDF Fields Overlay */}
            <View style={{
              position: 'absolute',
              top: 20,
              left: 20,
              right: 20,
              bottom: 20,
              pointerEvents: 'box-none'
            }}>
              {currentFields.map((field) => {
                return (
                  <EditableField
                    key={field.id}
                    field={field}
                    scale={scale}
                    isSelected={selectedId === field.id}
                    isEditing={editingId === field.id}
                    onSelect={onFieldSelect}
                    onUpdate={handleFieldUpdate}
                    onEditStart={(id) => onFieldEdit?.(id)}
                    onEditEnd={() => onFieldEdit?.(null)}
                    onDelete={handleFieldDelete}
                    style={{ pointerEvents: 'auto' }}
                  />
                );
              })}
            </View>
            
          </View>
        )}
        
      </ScrollView>
    </View>
  );
};