import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const exportPDFWithFields = async (originalPdfBase64, fields) => {
  try {
    // Load the original PDF
    const pdfDoc = await PDFDocument.load(originalPdfBase64, { 
      ignoreEncryption: true 
    });
    
    // Get all pages
    const pages = pdfDoc.getPages();
    
    // Load font for text fields
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Group fields by page
    const fieldsByPage = {};
    fields.forEach(field => {
      if (!fieldsByPage[field.page]) {
        fieldsByPage[field.page] = [];
      }
      fieldsByPage[field.page].push(field);
    });
    
    // Add fields to each page
    for (let pageNum = 1; pageNum <= pages.length; pageNum++) {
      const page = pages[pageNum - 1];
      const pageFields = fieldsByPage[pageNum] || [];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      for (const field of pageFields) {
        // Convert coordinates (PDF coordinates are from bottom-left)
        const x = field.x;
        const y = pageHeight - field.y - field.height;
        
        switch (field.type) {
          case 'text':
            if (field.content && field.content.trim()) {
              // Calculate font size to fit within field boundaries
              let fontSize = field.fontSize || 12;
              const maxFontSize = Math.min(field.height * 0.8, fontSize);
              
              // Word wrap for multiline text
              const words = field.content.split(' ');
              const lines = [];
              let currentLine = '';
              const maxWidth = field.width - 4; // padding
              
              for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const textWidth = helveticaFont.widthOfTextAtSize(testLine, fontSize);
                
                if (textWidth <= maxWidth || !currentLine) {
                  currentLine = testLine;
                } else {
                  lines.push(currentLine);
                  currentLine = word;
                }
              }
              if (currentLine) lines.push(currentLine);
              
              // Draw each line
              const lineHeight = fontSize * 1.2;
              for (let i = 0; i < lines.length && i < Math.floor(field.height / lineHeight); i++) {
                page.drawText(lines[i], {
                  x: x + 2,
                  y: y + field.height - (i + 1) * lineHeight + 2,
                  size: Math.min(maxFontSize, fontSize),
                  font: helveticaFont,
                  color: rgb(0, 0, 0)
                });
              }
            }
            break;
            
          case 'date':
            if (field.content) {
              const dateText = typeof field.content === 'string' 
                ? field.content 
                : new Date(field.content).toLocaleDateString();
              
              page.drawText(dateText, {
                x: x + 2,
                y: y + field.height / 2 - (field.fontSize || 12) / 2,
                size: field.fontSize || 12,
                font: helveticaFont,
                color: rgb(0, 0, 0)
              });
            }
            break;
            
          case 'checkbox':
            // Draw checkbox border
            page.drawRectangle({
              x: x,
              y: y,
              width: field.width,
              height: field.height,
              borderColor: rgb(0, 0, 0),
              borderWidth: 1
            });
            
            // Draw checkmark if checked
            if (field.content === true) {
              page.drawRectangle({
                x: x + 2,
                y: y + 2,
                width: field.width - 4,
                height: field.height - 4,
                color: rgb(0, 0, 0)
              });
              
              // Draw checkmark
              page.drawText('✓', {
                x: x + field.width / 2 - 4,
                y: y + field.height / 2 - 6,
                size: Math.min(field.width * 0.8, 16),
                font: helveticaBoldFont,
                color: rgb(1, 1, 1)
              });
            }
            break;
            
          case 'signature':
            if (field.content && field.content.startsWith('data:image/')) {
              try {
                // Extract base64 data from data URL
                const base64Data = field.content.split(',')[1];
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                
                // Embed PNG image
                const image = await pdfDoc.embedPng(imageBytes);
                const imageDims = image.scale(1);
                
                // Calculate scaling to fit within field bounds
                const scaleX = field.width / imageDims.width;
                const scaleY = field.height / imageDims.height;
                const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
                
                const scaledWidth = imageDims.width * scale;
                const scaledHeight = imageDims.height * scale;
                
                // Center image within field
                const offsetX = (field.width - scaledWidth) / 2;
                const offsetY = (field.height - scaledHeight) / 2;
                
                page.drawImage(image, {
                  x: x + offsetX,
                  y: y + offsetY,
                  width: scaledWidth,
                  height: scaledHeight
                });
              } catch (imageError) {
                console.warn('Failed to embed signature image:', imageError);
                // Fallback: draw text
                page.drawText('Signature', {
                  x: x + 2,
                  y: y + field.height / 2 - 6,
                  size: 10,
                  font: helveticaFont,
                  color: rgb(0.5, 0.5, 0.5)
                });
              }
            }
            break;
            
          default:
            // Unknown field type - draw placeholder
            page.drawText(field.type, {
              x: x + 2,
              y: y + field.height / 2 - 6,
              size: 10,
              font: helveticaFont,
              color: rgb(0.5, 0.5, 0.5)
            });
            break;
        }
      }
    }
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    return {
      success: true,
      pdfBytes,
      blob: new Blob([pdfBytes], { type: 'application/pdf' })
    };
    
  } catch (error) {
    console.error('PDF export error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const downloadPDF = (pdfBytes, filename = 'filled_form.pdf') => {
  try {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('PDF download error:', error);
    return { success: false, error: error.message };
  }
};

export const previewPDF = (pdfBytes) => {
  try {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    window.open(url, '_blank');
    
    // Clean up after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    return { success: true };
  } catch (error) {
    console.error('PDF preview error:', error);
    return { success: false, error: error.message };
  }
};

// Utility function to validate fields before export
export const validateFieldsForExport = (fields) => {
  const errors = [];
  
  fields.forEach((field, index) => {
    // Check required fields
    if (field.required && (!field.content || field.content.toString().trim() === '')) {
      errors.push(`Field ${index + 1} (${field.type}) is required but empty`);
    }
    
    // Validate field positions
    if (field.x < 0 || field.y < 0) {
      errors.push(`Field ${index + 1} has invalid position`);
    }
    
    // Validate field dimensions
    if (field.width <= 0 || field.height <= 0) {
      errors.push(`Field ${index + 1} has invalid dimensions`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};