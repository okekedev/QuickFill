import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { EditableField } from './EditableField';
import { usePDFEditor } from '../../utils/pdfEditor';
import { readFileAsBase64 } from '../../utils/fileHelpers';
import { components, colors, layout } from '../../styles';

export const PDFViewer = ({ 
  pdfFile,
  onFieldUpdate,
  onFieldSelect,
  onFieldEdit,
  onFieldDelete,
  selectedFieldId,
  editingFieldId,
  style,
  ...props 
}) => {
  const [pdfBase64, setPdfBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // PDF Editor Hook
  const {
    canvasRef,
    pdfLoaded,
    pdfError,
    currentPage,
    setCurrentPage,
    totalPages,
    scale,
    setScale,
    objects,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    updateObject,
    deleteObject,
    getCurrentPageFields
  } = usePDFEditor(pdfBase64);

  // Load PDF from file
  useEffect(() => {
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
  }, [pdfFile]);

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

  const handleCanvasClick = (e) => {
    // Deselect fields when clicking on empty PDF area
    if (e.target === canvasRef.current) {
      onFieldSelect?.(null);
    }
  };

  const handleFieldUpdate = (fieldId, updates) => {
    updateObject(fieldId, updates);
    onFieldUpdate?.(fieldId, updates);
  };

  const handleFieldDelete = (fieldId) => {
    deleteObject(fieldId);
    onFieldDelete?.(fieldId);
  };

  const currentFields = getCurrentPageFields();

  return (
    <View style={[{ flex: 1 }, style]} {...props}>
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
        
        {!pdfFile && !loading && (
          <View style={[layout.center, { padding: 50 }]}>
            <Text style={[components.bodyText, { textAlign: 'center', color: colors.text.secondary }]}>
              No PDF selected
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
            maxWidth: '90%',
            alignSelf: 'center'
          }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{
                display: 'block',
                maxWidth: '100%',
                height: 'auto',
                border: '2px solid #f1f5f9',
                borderRadius: 8,
                cursor: 'default',
                backgroundColor: colors.white
              }}
            />
            
            {/* PDF Fields Overlay */}
            {currentFields.map((field) => (
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
              />
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Compact Navigation and Zoom Controls */}
      {pdfLoaded && (
        <View style={[
          layout.row, 
          layout.spaceBetween, 
          layout.center, 
          { 
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors.gray[50],
            borderTopWidth: 1, 
            borderTopColor: colors.gray[200]
          }
        ]}>
          {/* Page Navigation */}
          <View style={[layout.row, layout.center]}>
            <Text 
              style={[
                components.caption,
                {
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  color: currentPage === 1 ? colors.gray[400] : colors.primary[500]
                }
              ]}
              onPress={currentPage > 1 ? () => setCurrentPage(currentPage - 1) : undefined}
            >
              ←
            </Text>
            
            <Text style={[components.caption, { marginHorizontal: 12, color: colors.text.secondary }]}>
              {currentPage} / {totalPages}
            </Text>
            
            <Text 
              style={[
                components.caption,
                {
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  color: currentPage === totalPages ? colors.gray[400] : colors.primary[500]
                }
              ]}
              onPress={currentPage < totalPages ? () => setCurrentPage(currentPage + 1) : undefined}
            >
              →
            </Text>
          </View>

          {/* Zoom Controls */}
          <View style={[layout.row, layout.center]}>
            <Text 
              style={[
                components.caption,
                {
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  color: scale <= 0.5 ? colors.gray[400] : colors.primary[500]
                }
              ]}
              onPress={scale > 0.5 ? () => setScale(Math.max(0.5, scale - 0.2)) : undefined}
            >
              -
            </Text>
            
            <Text style={[components.caption, { marginHorizontal: 12, color: colors.text.secondary, minWidth: 40, textAlign: 'center' }]}>
              {Math.round(scale * 100)}%
            </Text>
            
            <Text 
              style={[
                components.caption,
                {
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  color: scale >= 3 ? colors.gray[400] : colors.primary[500]
                }
              ]}
              onPress={scale < 3 ? () => setScale(Math.min(3, scale + 0.2)) : undefined}
            >
              +
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};