// components/PDFEditor/PDFToolbar.js - Clean component with imported styles
import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';
import { pdfToolbarStyles } from './PDFEditorStyles';

const PDFToolbar = ({
  onClose,
  onSave,
  onAddText,
  onAddDate,
  onAddTimestamp,
  onAddCheckbox,
  onAddMySignature,
  onAddCustomerSignature,
  onAddMyName,
  onClearAll,
  onDeleteSelected,
  currentPage,
  totalPages,
  onPageChange,
  scale,
  onScaleChange,
  hasFields,
  hasSelection,
  myName,
  hasMySignature
}) => {
  const ToolButton = ({ onPress, title, color, disabled = false, style = {} }) => (
    <TouchableOpacity
      style={[
        pdfToolbarStyles.toolButton,
        { backgroundColor: color || pdfToolbarStyles.toolButton.backgroundColor },
        disabled && pdfToolbarStyles.toolButtonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[
        pdfToolbarStyles.toolButtonText,
        disabled && pdfToolbarStyles.toolButtonTextDisabled
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={pdfToolbarStyles.toolbar}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={pdfToolbarStyles.toolbarContent}
      >
        {/* Main Actions */}
        <View style={pdfToolbarStyles.toolSection}>
          <ToolButton 
            onPress={onClose} 
            title="✕ Close" 
            color="#FF3B30"
          />
          <ToolButton 
            onPress={onSave} 
            title="💾 Save" 
            color="#34C759"
          />
        </View>

        {/* Page Controls */}
        <View style={pdfToolbarStyles.toolSection}>
          <ToolButton 
            onPress={() => onPageChange(Math.max(1, currentPage - 1))}
            title="◀"
            disabled={currentPage <= 1}
          />
          <View style={pdfToolbarStyles.pageIndicator}>
            <Text style={pdfToolbarStyles.pageText}>
              {currentPage} / {totalPages}
            </Text>
          </View>
          <ToolButton 
            onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            title="▶"
            disabled={currentPage >= totalPages}
          />
        </View>

        {/* Zoom Controls */}
        <View style={pdfToolbarStyles.toolSection}>
          <ToolButton 
            onPress={() => onScaleChange(Math.max(0.5, scale - 0.1))}
            title="🔍-"
          />
          <View style={pdfToolbarStyles.scaleIndicator}>
            <Text style={pdfToolbarStyles.scaleText}>{Math.round(scale * 100)}%</Text>
          </View>
          <ToolButton 
            onPress={() => onScaleChange(Math.min(3, scale + 0.1))}
            title="🔍+"
          />
        </View>

        {/* Field Tools */}
        <View style={pdfToolbarStyles.toolSection}>
          <ToolButton onPress={onAddText} title="📝 Text" />
          <ToolButton onPress={onAddDate} title="📅 Date" />
          <ToolButton onPress={onAddTimestamp} title="🕐 Time" />
          <ToolButton onPress={onAddCheckbox} title="☑️ Check" />
        </View>

        {/* Signature Tools */}
        <View style={pdfToolbarStyles.toolSection}>
          <ToolButton 
            onPress={onAddMySignature} 
            title={hasMySignature ? "✍️ My Sig" : "✍️ Create"}
            color={hasMySignature ? "#007AFF" : "#FF9500"}
          />
          <ToolButton 
            onPress={onAddCustomerSignature} 
            title="👤 Customer" 
          />
          <ToolButton 
            onPress={onAddMyName} 
            title={myName ? `📝 ${myName.split(' ')[0]}` : "📝 Name"}
            color={myName ? "#007AFF" : "#8E8E93"}
          />
        </View>

        {/* Edit Tools */}
        <View style={pdfToolbarStyles.toolSection}>
          <ToolButton 
            onPress={onDeleteSelected} 
            title="🗑️ Delete"
            color="#FF3B30"
            disabled={!hasSelection}
          />
          <ToolButton 
            onPress={onClearAll} 
            title="🧹 Clear"
            color="#FF9500"
            disabled={!hasFields}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default PDFToolbar;