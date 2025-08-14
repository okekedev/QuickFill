import { useState, useCallback, useEffect, useRef } from 'react';

// PDF Editor Hook with all functionality
export function usePDFEditor(pdfBase64) {
  const canvasRef = useRef(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // PDF Loading
  useEffect(() => {
    if (!pdfBase64) return;

    const loadPDF = async () => {
      try {
        setPdfError(null);
        setPdfLoaded(false);
        
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            loadPDFDocument();
          };
          document.head.appendChild(script);
        } else {
          loadPDFDocument();
        }

        async function loadPDFDocument() {
          const pdfData = atob(pdfBase64);
          const pdfArray = new Uint8Array(pdfData.length);
          for (let i = 0; i < pdfData.length; i++) {
            pdfArray[i] = pdfData.charCodeAt(i);
          }

          const pdf = await window.pdfjsLib.getDocument({ data: pdfArray }).promise;
          setPdfDocument(pdf);
          setTotalPages(pdf.numPages);
          setPdfLoaded(true);
        }
      } catch (error) {
        console.error('PDF loading error:', error);
        setPdfError('Failed to load PDF');
      }
    };

    loadPDF();
  }, [pdfBase64]);

  // Page Rendering
  useEffect(() => {
    if (!pdfDocument || !pdfLoaded) return;

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
    if (!canvasRef.current) return { x: 50, y: 50 };
    
    // Position new fields in the top-left area with some padding
    return {
      x: 50,
      y: 50
    };
  }, []);

  // Consolidate field creation functions
  const createField = useCallback((type, x, y) => {
    // Special handling for signatures - don't create empty fields
    if (type === 'signature') {
      return 'open_signature_modal';
    }
    
    const position = x && y ? { x, y } : getDefaultFieldPosition();
    const id = `${type}_${Date.now()}`;
    
    const fieldConfigs = {
      text: { width: 200, height: 60, content: '', fontSize: 11 },
      date: { width: 100, height: 24, content: new Date().toLocaleDateString(), fontSize: 11 },
      checkbox: { width: 20, height: 20, content: true, fontSize: 16 }
    };
    
    const config = fieldConfigs[type];
    const newField = {
      id,
      type,
      x: position.x / scale,
      y: position.y / scale,
      width: config.width / scale,
      height: config.height / scale,
      content: config.content,
      fontSize: config.fontSize,
      color: '#000000',
      page: currentPage
    };
    
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
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []);

  const deleteObject = useCallback((id) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    setSelectedId(prev => prev === id ? null : prev);
    setEditingId(prev => prev === id ? null : prev);
  }, []);

  const clearAllObjects = useCallback(() => {
    setObjects([]);
    setSelectedId(null);
    setEditingId(null);
  }, []);

  const getCurrentPageFields = useCallback(() => {
    return objects.filter(obj => obj.page === currentPage);
  }, [objects, currentPage]);

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
    getCurrentPageFields
  };
}