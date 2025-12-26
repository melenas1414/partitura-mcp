import abcjs from 'abcjs';
import PDFDocument from 'pdfkit';
import { JSDOM } from 'jsdom';
import { z } from 'zod';

/**
 * Schema for ABC to PDF conversion input
 */
export const AbcToPdfSchema = z.object({
  abc_notation: z.string().min(1, 'ABC notation cannot be empty').describe('The ABC notation string to convert to PDF'),
  title: z.string().optional().describe('Optional title for the PDF document'),
  composer: z.string().optional().describe('Optional composer name for the PDF document')
});

/**
 * Validates ABC notation format
 * @param {string} abcNotation - The ABC notation to validate
 * @returns {boolean} True if valid, throws error otherwise
 */
export function validateAbcNotation(abcNotation) {
  if (!abcNotation || typeof abcNotation !== 'string') {
    throw new Error('ABC notation must be a non-empty string');
  }

  // Basic ABC notation validation
  const trimmed = abcNotation.trim();
  if (trimmed.length === 0) {
    throw new Error('ABC notation cannot be empty');
  }

  // Check for potentially malicious content
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(abcNotation)) {
      throw new Error('ABC notation contains potentially unsafe content');
    }
  }

  return true;
}

/**
 * Converts ABC notation to SVG using abcjs
 * @param {string} abcNotation - The ABC notation to convert
 * @returns {string} SVG string
 */
export function abcToSvg(abcNotation) {
  try {
    // Create a container for rendering
    const container = document.createElement('div');
    
    // Render ABC notation to SVG
    const visualObj = abcjs.renderAbc(container, abcNotation, {
      responsive: 'resize',
      staffwidth: 600,
      scale: 1.5
    });

    if (!visualObj || visualObj.length === 0) {
      throw new Error('Failed to render ABC notation');
    }

    // Get the SVG element
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element generated from ABC notation');
    }

    return svgElement.outerHTML;
  } catch (error) {
    throw new Error(`Failed to convert ABC to SVG: ${error.message}`);
  }
}

/**
 * Extracts path elements from SVG for PDF rendering
 * @param {string} svgString - SVG string
 * @returns {Array} Array of path elements with their attributes
 */
export function extractSvgElements(svgString) {
  const dom = new JSDOM(svgString);
  const document = dom.window.document;
  const svgElement = document.querySelector('svg');
  
  if (!svgElement) {
    throw new Error('Invalid SVG content');
  }

  const elements = [];
  
  // Extract viewBox and dimensions
  const viewBox = svgElement.getAttribute('viewBox');
  const width = svgElement.getAttribute('width');
  const height = svgElement.getAttribute('height');
  
  elements.push({
    type: 'metadata',
    viewBox,
    width: width ? parseFloat(width) : 600,
    height: height ? parseFloat(height) : 800
  });

  // Extract all paths
  const paths = document.querySelectorAll('path');
  paths.forEach(path => {
    const d = path.getAttribute('d');
    const stroke = path.getAttribute('stroke') || '#000000';
    const strokeWidth = path.getAttribute('stroke-width') || '1';
    const fill = path.getAttribute('fill') || 'none';
    
    if (d) {
      elements.push({
        type: 'path',
        d,
        stroke,
        strokeWidth: parseFloat(strokeWidth),
        fill
      });
    }
  });

  // Extract text elements
  const texts = document.querySelectorAll('text');
  texts.forEach(text => {
    const content = text.textContent;
    const x = parseFloat(text.getAttribute('x') || 0);
    const y = parseFloat(text.getAttribute('y') || 0);
    const fontSize = text.getAttribute('font-size') || '12';
    const fontFamily = text.getAttribute('font-family') || 'Arial';
    
    if (content) {
      elements.push({
        type: 'text',
        content,
        x,
        y,
        fontSize: parseFloat(fontSize),
        fontFamily
      });
    }
  });

  return elements;
}

/**
 * Converts ABC notation to PDF buffer
 * @param {string} abcNotation - The ABC notation to convert
 * @param {Object} options - Conversion options
 * @param {string} options.title - Optional title for the PDF
 * @param {string} options.composer - Optional composer name
 * @returns {Promise<Buffer>} PDF as buffer
 */
export async function abcToPdf(abcNotation, options = {}) {
  // Validate input
  validateAbcNotation(abcNotation);

  // Setup JSDOM for abcjs
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;

  try {
    // Convert ABC to SVG
    const svgString = abcToSvg(abcNotation);
    
    // Extract SVG elements
    const elements = extractSvgElements(svgString);
    const metadata = elements.find(e => e.type === 'metadata');
    
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: options.title || 'Music Sheet',
        Author: options.composer || 'Unknown',
        Subject: 'Sheet Music generated from ABC notation',
        Keywords: 'music, abc notation, sheet music'
      }
    });

    // Buffer to store PDF
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Add title if provided
    if (options.title) {
      doc.fontSize(20).text(options.title, { align: 'center' });
      doc.moveDown(0.5);
    }

    // Add composer if provided
    if (options.composer) {
      doc.fontSize(12).text(`Composer: ${options.composer}`, { align: 'center' });
      doc.moveDown(1);
    }

    // Calculate scaling to fit page
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom - 100;
    
    const svgWidth = metadata?.width || 600;
    const svgHeight = metadata?.height || 400;
    
    const scaleX = pageWidth / svgWidth;
    const scaleY = pageHeight / svgHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    // Save current state
    doc.save();
    
    // Translate to center of page
    const offsetX = doc.page.margins.left + (pageWidth - svgWidth * scale) / 2;
    const offsetY = doc.y;
    
    doc.translate(offsetX, offsetY);
    doc.scale(scale);

    // Render SVG elements to PDF
    elements.forEach(element => {
      if (element.type === 'path') {
        // Draw path
        doc.path(element.d);
        
        if (element.fill && element.fill !== 'none') {
          doc.fill(element.fill);
        }
        
        if (element.stroke && element.stroke !== 'none') {
          doc.lineWidth(element.strokeWidth);
          doc.stroke(element.stroke);
        }
      } else if (element.type === 'text') {
        // Draw text
        doc.fontSize(element.fontSize)
           .font(element.fontFamily)
           .text(element.content, element.x, element.y, { lineBreak: false });
      }
    });

    // Restore state
    doc.restore();

    // Add footer with timestamp
    doc.fontSize(8)
       .text(
         `Generated on ${new Date().toLocaleString()}`,
         doc.page.margins.left,
         doc.page.height - doc.page.margins.bottom + 20,
         { align: 'center' }
       );

    // Finalize PDF
    doc.end();

    return await pdfPromise;
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    // Cleanup global objects
    delete global.document;
    delete global.window;
  }
}

/**
 * Converts PDF buffer to base64 string
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {string} Base64 encoded PDF
 */
export function pdfToBase64(pdfBuffer) {
  return pdfBuffer.toString('base64');
}
