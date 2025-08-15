import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Mobile-compatible PDF Editor Hook
export function usePDFEditor(pdfBase64) {
  const canvasRef = useRef(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 595, height: 842 }); // A4 default

  // PDF Loading
  useEffect(() => {
    if (!pdfBase64) {
      console.log('No PDF base64 provided');
      setPdfLoaded(false);
      setPdfError(null);
      setPdfDocument(null);
      return;
    }

    console.log('PDF base64 received, length:', pdfBase64.length);
    console.log('Platform:', Platform.OS);
    
    // On mobile platforms, we skip PDF.js and just mark as loaded
    if (Platform.OS !== 'web') {
      console.log('Mobile platform detected, setting PDF as loaded');
      // Only set loaded if not already loaded to prevent loops
      if (!pdfLoaded) {
        setTimeout(() => {
          setPdfLoaded(true);
          setTotalPages(1);
          setPdfError(null);
          setPdfDimensions({ width: 595, height: 842 });
        }, 100);
      }
      return;
    }

    // Web platform - use PDF.js
    const loadPDF = async () => {
      try {
        console.log('Loading PDF with PDF.js');
        setPdfError(null);
        setPdfLoaded(false);
        
        if (!window.pdfjsLib) {
          console.log('Loading PDF.js library');
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            console.log('PDF.js loaded');
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            loadPDFDocument();
          };
          script.onerror = (error) => {
            console.error('Failed to load PDF.js:', error);
            setPdfError('Failed to load PDF library');
          };
          document.head.appendChild(script);
        } else {
          loadPDFDocument();
        }

        async function loadPDFDocument() {
          try {
            console.log('Parsing PDF document');
            const pdfData = atob(pdfBase64);
            const pdfArray = new Uint8Array(pdfData.length);
            for (let i = 0; i < pdfData.length; i++) {
              pdfArray[i] = pdfData.charCodeAt(i);
            }

            const pdf = await window.pdfjsLib.getDocument({ data: pdfArray }).promise;
            console.log('PDF loaded successfully, pages:', pdf.numPages);
            setPdfDocument(pdf);
            setTotalPages(pdf.numPages);
            setPdfLoaded(true);
            
            // Get first page dimensions
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1 });
            setPdfDimensions({ width: viewport.width, height: viewport.height });
            console.log('PDF dimensions:', viewport.width, 'x', viewport.height);
          } catch (error) {
            console.error('Error loading PDF document:', error);
            setPdfError(`Failed to parse PDF: ${error.message}`);
          }
        }
      } catch (error) {
        console.error('PDF loading error:', error);
        setPdfError('Failed to load PDF');
      }
    };

    loadPDF();
  }, [pdfBase64]);

  // Page Rendering - only on web platform
  useEffect(() => {
    if (Platform.OS !== 'web') {
      console.log('Skipping page rendering on mobile');
      return;
    }
    if (!pdfDocument || !pdfLoaded) {
      console.log('PDF not ready for rendering');
      return;
    }

    console.log('Rendering page', currentPage);
    let timeoutId;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        setIsRendering(true);
        
        const page = await pdfDocument.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas || isCancelled) return;
        
        const context = canvas.getContext('2d');
        
        // Standard quality rendering
        const devicePixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * devicePixelRatio });
        
        // Set actual canvas size for high DPI
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Scale canvas back down using CSS for crisp display
        canvas.style.width = `${viewport.width / devicePixelRatio}px`;
        canvas.style.height = `${viewport.height / devicePixelRatio}px`;
        
        // Scale the drawing context to match device pixel ratio
        context.scale(devicePixelRatio, devicePixelRatio);
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        const renderContext = {
          canvasContext: context,
          viewport: page.getViewport({ scale }) // Use original scale for rendering context
        };
        
        await page.render(renderContext).promise;
        console.log('Page rendered successfully');
        
      } catch (error) {
        if (!isCancelled) {
          console.error('Page rendering failed:', error);
          setPdfError('Failed to render PDF page');
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    timeoutId = setTimeout(renderPage, 100);
    
    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pdfDocument, currentPage, scale, pdfLoaded]);

  const getDefaultFieldPosition = useCallback(() => {
    // Position fields relative to PDF dimensions and platform
    const baseX = Platform.OS === 'web' ? 50 : 50;
    const baseY = Platform.OS === 'web' ? 50 : 50;
    
    return {
      x: baseX,
      y: baseY
    };
  }, []);

  // Consolidate field creation functions
  const createField = useCallback((type, x, y) => {
    console.log('Creating field:', type, 'at', x, y);
    
    // Special handling for signatures - don't create empty fields
    if (type === 'signature') {
      return 'open_signature_modal';
    }
    
    const position = x && y ? { x, y } : getDefaultFieldPosition();
    const id = `${type}_${Date.now()}`;
    
    const fieldConfigs = {
      text: { width: 150, height: 24, content: '', fontSize: 11 },
      date: { width: 100, height: 24, content: new Date().toLocaleDateString(), fontSize: 11 },
      checkbox: { width: 20, height: 20, content: false, fontSize: 16 }
    };
    
    const config = fieldConfigs[type];
    
    // Store coordinates in PDF coordinate space (unscaled)
    const newField = {
      id,
      type,
      x: Platform.OS === 'web' ? position.x / scale : position.x,
      y: Platform.OS === 'web' ? position.y / scale : position.y,
      width: Platform.OS === 'web' ? config.width / scale : config.width,
      height: Platform.OS === 'web' ? config.height / scale : config.height,
      content: config.content,
      fontSize: config.fontSize,
      color: '#000000',
      page: currentPage
    };
    
    console.log('Created field:', newField);
    setObjects(prev => [...prev, newField]);
    setSelectedId(id);
    
    return null;
  }, [scale, currentPage, getDefaultFieldPosition]);

  const addTextObject = useCallback((x, y) => createField('text', x, y), [createField]);
  const addDateObject = useCallback((x, y) => createField('date', x, y), [createField]);
  const addCheckboxObject = useCallback((x, y) => createField('checkbox', x, y), [createField]);
  const addSignatureObject = useCallback(() => {
    // Don't create the field yet, just return the signal to open modal
    return 'open_signature_modal';
  }, []);

  const updateObject = useCallback((id, updates) => {
    console.log('Updating object:', id, updates);
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []);

  const deleteObject = useCallback((id) => {
    console.log('Deleting object:', id);
    setObjects(prev => prev.filter(obj => obj.id !== id));
    setSelectedId(prev => prev === id ? null : prev);
    setEditingId(prev => prev === id ? null : prev);
  }, []);

  const clearAllObjects = useCallback(() => {
    console.log('Clearing all objects');
    setObjects([]);
    setSelectedId(null);
    setEditingId(null);
  }, []);

  const getCurrentPageFields = useCallback(() => {
    return objects.filter(obj => obj.page === currentPage);
  }, [objects, currentPage]);

  console.log('usePDFEditor state:', {
    pdfBase64: !!pdfBase64,
    pdfLoaded,
    pdfError,
    totalPages,
    currentPage,
    objectCount: objects.length
  });

  return {
    canvasRef,
    pdfDocument,
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
    addTextObject,
    addSignatureObject,
    addDateObject,
    addCheckboxObject,
    updateObject,
    deleteObject,
    clearAllObjects,
    isRendering,
    getDefaultFieldPosition,
    setObjects,
    getCurrentPageFields,
    pdfDimensions
  };
}