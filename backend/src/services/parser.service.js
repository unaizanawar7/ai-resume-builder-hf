/**
 * Parser Service - Extracts text from uploaded resume files
 * 
 * Supports:
 * - PDF files (using pdf-parse)
 * - DOCX files (using mammoth)
 */

import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Parse uploaded resume file and extract text
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} Extracted text from document
 */
export async function parseResumeFile(file) {
  console.log('📄 Parsing file:', file.originalname);
  
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  
  try {
    let extractedText;
    
    if (fileExtension === 'pdf') {
      extractedText = await parsePDF(file.path);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      extractedText = await parseDOCX(file.path);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
    
    // Clean up the uploaded file after parsing
    fs.unlinkSync(file.path);
    
    console.log('✅ Text extracted successfully');
    return extractedText;
    
  } catch (error) {
    // Clean up file even if parsing fails
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    console.error('❌ Error parsing file:', error);
    throw error;
  }
}

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} Extracted text
 */
async function parsePDF(filePath) {
  console.log('📄 Parsing PDF...');
  
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  
  // pdf-parse returns an object with text property
  let text = data.text;
  
  // Clean up the text
  text = cleanExtractedText(text);
  
  return text;
}

/**
 * Extract text from DOCX file
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<string>} Extracted text
 */
async function parseDOCX(filePath) {
  console.log('📄 Parsing DOCX...');
  
  const result = await mammoth.extractRawText({ path: filePath });
  let text = result.value;
  
  // Check for any conversion warnings
  if (result.messages.length > 0) {
    console.log('⚠️ DOCX conversion warnings:', result.messages);
  }
  
  // Clean up the text
  text = cleanExtractedText(text);
  
  return text;
}

/**
 * Clean and normalize extracted text
 * @param {string} text - Raw extracted text
 * @returns {string} Cleaned text
 */
function cleanExtractedText(text) {
  // Remove excessive whitespace and newlines
  text = text.replace(/\n{3,}/g, '\n\n'); // Replace 3+ newlines with 2
  text = text.replace(/[ \t]{2,}/g, ' '); // Replace multiple spaces/tabs with single space
  text = text.trim();
  
  return text;
}

/**
 * Validate uploaded file
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result
 */
export function validateResumeFile(file) {
  const maxSize = process.env.MAX_FILE_SIZE || 10485760; // 10MB default
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
  
  const errors = [];
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }
  
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('Invalid file type. Only PDF and DOCX files are allowed');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  parseResumeFile,
  validateResumeFile
};
