/**
 * Export Service - LaTeX-Only PDF Resume Generation
 * 
 * All resumes are generated using LaTeX compilation from Overleaf templates.
 * No PDFKit - LaTeX only.
 */

import latexService from './latex.service.js';
import templateService from './template.service.js';
import { generateDOCX as generateDOCXFile } from './docx.service.js';
import fs from 'fs';

/**
 * Generate PDF resume using LaTeX only
 */
export async function generatePDF(resumeData, layoutStyle = 'Customised Curve CV') {
  console.log('📄 Generating PDF resume with layout:', layoutStyle);
  
  // Check LaTeX availability
  const latexAvailable = await latexService.isLaTeXAvailable();
  if (!latexAvailable) {
    throw new Error('LaTeX compiler (MiKTeX) is not available. Please install MiKTeX and ensure pdflatex is in PATH.');
  }
  
  // Find template by name in metadata
  const allTemplates = templateService.getAllTemplates();
  
  // Normalize layout style for matching (remove spaces, convert to lowercase)
  const normalizedLayoutStyle = layoutStyle.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  
  const template = allTemplates.find(t => {
    // Match by exact name (case insensitive)
    if (t.name.toLowerCase() === layoutStyle.toLowerCase()) {
      return true;
    }
    // Match by normalized name (remove spaces)
    const normalizedName = t.name.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
    if (normalizedName === normalizedLayoutStyle) {
      return true;
    }
    // Match by ID (normalized)
    const normalizedId = t.id.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
    if (normalizedId === normalizedLayoutStyle) {
      return true;
    }
    return false;
  });
  
  if (!template) {
    console.error('Available templates:', allTemplates.map(t => ({ id: t.id, name: t.name })));
    throw new Error(`Template "${layoutStyle}" not found in template database. Available templates: ${allTemplates.map(t => t.name).join(', ')}`);
  }
  
  if (template.type !== 'latex' || !template.file) {
    throw new Error(`Template "${layoutStyle}" is not a LaTeX template or has no file specified.`);
  }
  
  // Compile LaTeX template
  try {
    const latexPdfPath = await latexService.compileTemplate(template.id, resumeData);
    console.log('✅ LaTeX PDF generated:', latexPdfPath);
    return latexPdfPath;
  } catch (latexError) {
    console.error('❌ LaTeX compilation failed:', latexError.message);
    throw new Error(`LaTeX compilation failed: ${latexError.message}`);
  }
}

/**
 * Generate DOCX resume with proper formatting
 */
export async function generateDOCX(resumeData, layoutStyle = 'Customised Curve CV') {
  console.log('📄 Generating DOCX resume with layout:', layoutStyle);
  
  // Generate formatted DOCX file
  const docxPath = await generateDOCXFile(resumeData);
  console.log('✅ DOCX generated:', docxPath);
  
  return docxPath;
}

/**
 * Generate plain text resume
 */
export function generateTextResume(resumeData) {
  let text = '';
  
  // Header
  text += `${resumeData.personalInfo?.fullName || 'YOUR NAME'}\n`;
  text += `${resumeData.personalInfo?.email || ''} | ${resumeData.personalInfo?.phone || ''}\n`;
  text += `${resumeData.personalInfo?.location || ''}\n\n`;
  
  // Summary
  if (resumeData.summary) {
    text += `SUMMARY\n${resumeData.summary}\n\n`;
  }
  
  // Experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    text += `EXPERIENCE\n`;
    resumeData.experience.forEach(exp => {
      text += `\n${exp.position} | ${exp.company}\n`;
      text += `${exp.startDate} - ${exp.endDate}\n`;
      if (exp.responsibilities) {
        exp.responsibilities.forEach(r => text += `• ${r}\n`);
      }
    });
    text += '\n';
  }
  
  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    text += `EDUCATION\n`;
    resumeData.education.forEach(edu => {
      text += `${edu.degree} - ${edu.institution} (${edu.graduationDate})\n`;
    });
    text += '\n';
  }
  
  // Skills
  if (resumeData.skills?.technical) {
    text += `SKILLS\n${resumeData.skills.technical.join(', ')}\n\n`;
  }
  
  return text;
}

/**
 * Cleanup temporary file
 */
export function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️  Cleaned up temp file:', filePath);
    }
  } catch (error) {
    console.error('❌ Error cleaning up file:', error);
  }
}

export default {
  generatePDF,
  generateDOCX,
  generateTextResume,
  cleanupTempFile
};
