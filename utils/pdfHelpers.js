// PDF processing utilities

export const validatePDF = (fileUri) => {
  if (!fileUri) return false;
  
  const validExtensions = ['.pdf'];
  const extension = fileUri.toLowerCase().substring(fileUri.lastIndexOf('.'));
  
  return validExtensions.includes(extension);
};

export const generateFieldId = () => {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createPDFField = (x, y, width = 100, height = 30, type = 'text') => {
  return {
    id: generateFieldId(),
    x,
    y,
    width,
    height,
    type,
    value: '',
    required: false,
    readonly: false,
    placeholder: '',
  };
};

export const validateField = (field) => {
  if (!field) return { valid: false, error: 'Field is required' };
  
  if (field.required && (!field.value || field.value.trim() === '')) {
    return { valid: false, error: 'This field is required' };
  }
  
  if (field.type === 'email' && field.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(field.value)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
  }
  
  if (field.type === 'number' && field.value) {
    if (isNaN(field.value)) {
      return { valid: false, error: 'Please enter a valid number' };
    }
  }
  
  return { valid: true };
};

export const validateAllFields = (fields) => {
  const errors = {};
  let hasErrors = false;
  
  fields.forEach(field => {
    const validation = validateField(field);
    if (!validation.valid) {
      errors[field.id] = validation.error;
      hasErrors = true;
    }
  });
  
  return { valid: !hasErrors, errors };
};

export const exportFieldData = (fields, format = 'json') => {
  const data = fields.reduce((acc, field) => {
    acc[field.id] = {
      value: field.value,
      type: field.type,
      position: { x: field.x, y: field.y },
      size: { width: field.width, height: field.height }
    };
    return acc;
  }, {});
  
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      const headers = 'Field ID,Value,Type,X,Y,Width,Height\n';
      const rows = fields.map(field => 
        `${field.id},${field.value},${field.type},${field.x},${field.y},${field.width},${field.height}`
      ).join('\n');
      return headers + rows;
    default:
      return data;
  }
};

export const importFieldData = (dataString, format = 'json') => {
  try {
    if (format === 'json') {
      const data = JSON.parse(dataString);
      return Object.entries(data).map(([id, fieldData]) => ({
        id,
        value: fieldData.value || '',
        type: fieldData.type || 'text',
        x: fieldData.position?.x || 0,
        y: fieldData.position?.y || 0,
        width: fieldData.size?.width || 100,
        height: fieldData.size?.height || 30,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error importing field data:', error);
    return [];
  }
};