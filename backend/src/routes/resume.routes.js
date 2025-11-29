/**
 * Resume Routes - API endpoints for resume operations
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { parseResumeFile, validateResumeFile } from '../services/parser.service.js';
import aiService from '../services/ai.service.js';
import exportService from '../services/export.service.js';
import templateService from '../services/template.service.js';
import templateConfigService from '../services/template-config.service.js';
import GenericLatexCustomizer from '../services/generic-latex-customizer.service.js';
import latexService from '../services/latex.service.js';
import { protect } from '../middleware/auth.middleware.js';
import { sanitizeBody } from '../middleware/validation.middleware.js';
import { validateResumeData } from '../validators/resume.validator.js';
import Resume from '../models/Resume.js';
import fsPromises from 'fs/promises';

/**
 * Helper function to extract placeholders from LaTeX content
 */
function extractPlaceholdersFromContent(content) {
  const placeholders = new Set();
  
  // Find all uppercase placeholders (FULL_NAME, EMAIL, etc.)
  // But exclude common LaTeX commands and keywords
  const uppercasePattern = /\b[A-Z_]{2,}\b/g;
  const excludePatterns = [
    /^BEGIN$/, /^END$/, /^DOCUMENT$/, /^PACKAGE$/, /^USEPACKAGE$/,
    /^INPUT$/, /^INCLUDE$/, /^DEFINE$/, /^NEWCOMMAND$/, /^RENEWCOMMAND$/,
    /^TEXT$/, /^MATH$/, /^ITEM$/, /^SECTION$/, /^SUBSECTION$/,
    /^TEXTBF$/, /^TEXTIT$/, /^TEXTTT$/, /^EMPH$/,
    /^CENTER$/, /^LEFT$/, /^RIGHT$/, /^CLEARPAGE$/, /^NEWPAGE$/
  ];
  
  let match;
  while ((match = uppercasePattern.exec(content)) !== null) {
    const placeholder = match[0];
    // Only add if it's not a common LaTeX command
    const isExcluded = excludePatterns.some(pattern => pattern.test(placeholder));
    if (!isExcluded && placeholder.length >= 2) {
      placeholders.add(placeholder);
    }
  }
  
  // Find LaTeX command placeholders (\PLACEHOLDERNAME, etc.)
  const latexCommandPattern = /\\PLACEHOLDER[A-Z_]+/g;
  while ((match = latexCommandPattern.exec(content)) !== null) {
    placeholders.add(match[0]);
  }
  
  // Find template-style placeholders ({{name}}, etc.)
  const templatePattern = /\{\{([a-zA-Z_]+)\}\}/g;
  while ((match = templatePattern.exec(content)) !== null) {
    placeholders.add(`{{${match[1]}}}`);
  }
  
  return Array.from(placeholders);
}

/**
 * Helper function to populate template with resume data
 * Returns populated LaTeX content without compiling
 */
async function populateTemplateWithData(templateId, resumeData, templatePath, compileDir = null) {
  const templateName = templateId.toLowerCase();
  const normalizedId = templateId.toLowerCase();
  
  console.log(`\n🔍 Populating template: ${templateId}`);
  console.log('📋 Available resume data:', {
    personalInfo: !!resumeData.personalInfo,
    experience: Array.isArray(resumeData.experience) ? resumeData.experience.length : 0,
    education: Array.isArray(resumeData.education) ? resumeData.education.length : 0,
    skills: !!resumeData.skills,
    projects: Array.isArray(resumeData.projects) ? resumeData.projects.length : 0,
    summary: !!resumeData.summary
  });
  
  // Read template to check for placeholders
  let rawContent = await fsPromises.readFile(templatePath, 'utf-8');
  const foundPlaceholders = extractPlaceholdersFromContent(rawContent);
  console.log(`📝 Found ${foundPlaceholders.length} placeholders in template:`, foundPlaceholders.slice(0, 10));
  
  let content;
  
  // Use appropriate injection method based on template
  // Check for specific template IDs first (more specific matches first)
  if (normalizedId === 'sixty-seconds-cv' || templateName.includes('sixty') || normalizedId.includes('sixty')) {
    console.log('📝 Using SixtySecondsCV injection method');
    content = await latexService.injectSixtySecondsCVData(templatePath, resumeData);
  } else if (normalizedId === 'resume-template' || templateName.includes('resume-template') || (templateName.includes('resume') && templateName.includes('template'))) {
    console.log('📝 Using Resume Template injection method');
    content = await latexService.injectResumeTemplateData(templatePath, resumeData);
  } else if (normalizedId === 'cv-template' || templateName.includes('cv-template') || (templateName.includes('cv') && templateName.includes('template') && !templateName.includes('resume'))) {
    console.log('📝 Using CV Template injection method');
    content = await latexService.injectCVTemplateData(templatePath, resumeData);
  } else if (normalizedId === 'maltacv' || templateName.includes('maltacv')) {
    console.log('📝 Using MAltaCV injection method');
    content = await latexService.injectMAltaCVData(templatePath, resumeData);
  } else if (templateName.includes('curve') || normalizedId.includes('curve')) {
    // For Curve CV, we need the compileDir for section files
    console.log('📝 Using Curve CV injection method');
    if (compileDir) {
      content = await latexService.injectCurveCVData(templatePath, resumeData, compileDir);
    } else {
      // Fallback: use generic replacement if no compileDir provided
      console.log('⚠️ No compileDir provided for Curve CV, using generic replacement');
      content = latexService.replacePlaceholders(rawContent, resumeData);
    }
  } else if ((templateName.includes('alta') && !templateName.includes('maltacv')) || 
             (normalizedId.includes('alta') && !normalizedId.includes('maltacv'))) {
    console.log('📝 Using AltaCV injection method');
    content = await latexService.injectAltaCVData(templatePath, resumeData);
  } else if (templateName.includes('hipster') || templateName.includes('simple') || normalizedId.includes('hipster')) {
    console.log('📝 Using Hipster CV injection method');
    content = await latexService.injectHipsterCVData(templatePath, resumeData);
  } else {
    // Generic placeholder replacement
    console.log('⚠️ Using generic placeholder replacement (no specific handler found)');
    content = latexService.replacePlaceholders(rawContent, resumeData);
  }
  
  // Check for remaining placeholders after injection
  const remainingPlaceholders = extractPlaceholdersFromContent(content);
  if (remainingPlaceholders.length > 0) {
    console.warn(`⚠️ ${remainingPlaceholders.length} placeholders still remain after injection:`, remainingPlaceholders.slice(0, 10));
  } else {
    console.log('✅ All placeholders replaced');
  }
  
  return content;
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  }
});

/**
 * POST /api/resume/parse
 * Upload and parse a resume file
 */
router.post('/parse', upload.single('resume'), async (req, res) => {
  try {
    console.log('\n📤 Upload request received');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    // Validate file
    const validation = validateResumeFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        error: validation.errors.join(', ') 
      });
    }
    
    console.log('✅ File validated:', req.file.originalname);
    
    // Extract text from file
    const extractedText = await parseResumeFile(req.file);
    console.log('📄 Text extracted, length:', extractedText.length);
    
    // Use AI to parse the text into structured data
    const parsedResume = await aiService.parseResume(extractedText);
    
    res.json({
      success: true,
      data: parsedResume,
      message: 'Resume parsed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in /parse:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to parse resume'
    });
  }
});

/**
 * POST /api/resume/recommend-layout
 * Get AI recommendation for resume layout
 */
router.post('/recommend-layout', async (req, res) => {
  try {
    console.log('\n🎨 Layout recommendation request');
    
    const { resumeData, targetRole } = req.body;
    
    if (!resumeData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resume data is required' 
      });
    }
    
    const recommendation = await aiService.recommendLayout(resumeData, targetRole);
    
    res.json({
      success: true,
      data: recommendation,
      message: 'Layout recommended successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in /recommend-layout:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to recommend layout'
    });
  }
});

/**
 * POST /api/resume/generate
 * Generate enhanced resume content using AI
 */
router.post('/generate', async (req, res) => {
  try {
    console.log('\n✨ Resume generation request');
    
    const { resumeData, targetRole, targetIndustry } = req.body;
    
    if (!resumeData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resume data is required' 
      });
    }
    
    const enhancedResume = await aiService.generateResumeContent(
      resumeData, 
      targetRole, 
      targetIndustry
    );
    
    res.json({
      success: true,
      data: enhancedResume,
      message: 'Resume content generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in /generate:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate resume'
    });
  }
});

/**
 * POST /api/resume/export/pdf
 * Export resume as PDF
 */
router.post('/export/pdf', async (req, res) => {
  try {
    console.log('\n📄 PDF export request');
    
    const { resumeData, layoutStyle } = req.body;
    
    if (!resumeData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resume data is required' 
      });
    }
    
    const pdfPath = await exportService.generatePDF(resumeData, layoutStyle);
    
    // Send file
    res.download(pdfPath, 'resume.pdf', (err) => {
      // Clean up file after sending
      exportService.cleanupTempFile(pdfPath);
      
      if (err) {
        console.error('❌ Error sending PDF:', err);
      }
    });
    
  } catch (error) {
    console.error('❌ Error in /export/pdf:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to export PDF'
    });
  }
});

/**
 * POST /api/resume/export/docx
 * Export resume as DOCX
 */
router.post('/export/docx', async (req, res) => {
  try {
    console.log('\n📄 DOCX export request');
    
    const { resumeData } = req.body;
    
    if (!resumeData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resume data is required' 
      });
    }
    
    const docxPath = await exportService.generateDOCX(resumeData);
    
    // Send file
    res.download(docxPath, 'resume.docx', (err) => {
      // Clean up file after sending
      exportService.cleanupTempFile(docxPath);
      
      if (err) {
        console.error('❌ Error sending DOCX:', err);
      }
    });
    
  } catch (error) {
    console.error('❌ Error in /export/docx:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to export DOCX'
    });
  }
});

/**
 * POST /api/resume/improve
 * Get AI suggestions for improving a specific section
 */
router.post('/improve', async (req, res) => {
  try {
    console.log('\n💡 Improvement suggestion request');
    
    const { section, sectionType } = req.body;
    
    if (!section || !sectionType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Section data and type are required' 
      });
    }
    
    const suggestions = await aiService.suggestSectionImprovements(section, sectionType);
    
    res.json({
      success: true,
      data: { suggestions },
      message: 'Suggestions generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in /improve:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate suggestions'
    });
  }
});

/**
 * POST /api/resume/save
 * Save a resume to database (protected route)
 */
router.post('/save', protect, sanitizeBody, async (req, res) => {
  try {
    console.log('\n💾 Save resume request');
    
    // Validate resume data
    const validation = validateResumeData(req.body);
    if (validation.error) {
      return res.status(400).json({
        success: false,
        error: validation.error.message,
        details: validation.error.details
      });
    }
    
    const resumeData = validation.value;
    
    // Normalize data to match schema
    const normalizedData = { ...resumeData };
    
    // Normalize certifications: convert strings to objects if needed
    if (normalizedData.certifications && Array.isArray(normalizedData.certifications)) {
      normalizedData.certifications = normalizedData.certifications.map(cert => {
        if (typeof cert === 'string') {
          return { name: cert };
        }
        return cert;
      });
    }
    
    // Normalize projects: convert strings to objects if needed
    if (normalizedData.projects && Array.isArray(normalizedData.projects)) {
      normalizedData.projects = normalizedData.projects.map(project => {
        if (typeof project === 'string') {
          return { name: project };
        }
        return project;
      });
    }
    
    // Create new resume with user association
    const resume = await Resume.create({
      userId: req.user._id,
      title: resumeData.title || `${resumeData.personalInfo?.fullName || 'Untitled'}'s Resume`,
      ...normalizedData
    });
    
    console.log('✅ Resume saved:', resume._id);
    
    res.status(201).json({
      success: true,
      data: { resume }
    });
  } catch (error) {
    console.error('❌ Error saving resume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save resume'
    });
  }
});

/**
 * GET /api/resume/list
 * Get all resumes for current user (protected route)
 */
router.get('/list', protect, async (req, res) => {
  try {
    console.log('\n📋 List resumes request for user:', req.user.email);
    
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('-__v');
    
    console.log(`✅ Found ${resumes.length} resumes`);
    
    res.json({
      success: true,
      data: { resumes }
    });
  } catch (error) {
    console.error('❌ Error listing resumes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resumes'
    });
  }
});

/**
 * GET /api/resume/:id
 * Get a specific resume by ID (protected route)
 */
router.get('/:id', protect, async (req, res) => {
  try {
    console.log('\n📄 Get resume request:', req.params.id);
    
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    console.log('✅ Resume found');
    
    res.json({
      success: true,
      data: { resume }
    });
  } catch (error) {
    console.error('❌ Error getting resume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resume'
    });
  }
});

/**
 * PUT /api/resume/:id
 * Update a resume (protected route)
 */
router.put('/:id', protect, sanitizeBody, async (req, res) => {
  try {
    console.log('\n✏️  Update resume request:', req.params.id);
    
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    // Validate resume data
    const validation = validateResumeData(req.body);
    if (validation.error) {
      return res.status(400).json({
        success: false,
        error: validation.error.message,
        details: validation.error.details
      });
    }
    
    // Update resume fields with validated data
    Object.keys(validation.value).forEach(key => {
      if (key !== 'userId' && key !== '_id') {
        resume[key] = validation.value[key];
      }
    });
    
    await resume.save();
    
    console.log('✅ Resume updated');
    
    res.json({
      success: true,
      data: { resume }
    });
  } catch (error) {
    console.error('❌ Error updating resume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resume'
    });
  }
});

/**
 * DELETE /api/resume/:id
 * Delete a resume (protected route)
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    console.log('\n🗑️  Delete resume request:', req.params.id);
    
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    console.log('✅ Resume deleted');
    
    res.json({
      success: true,
      data: { message: 'Resume deleted successfully' }
    });
  } catch (error) {
    console.error('❌ Error deleting resume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete resume'
    });
  }
});

/**
 * POST /api/resume/generate-questions
 * Generate personalized interview questions based on resume and job description
 */
router.post('/generate-questions', protect, async (req, res) => {
  try {
    console.log('\n🎯 Interview questions generation request');
    
    const { resumeData, jobDescription = '' } = req.body;
    
    if (!resumeData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resume data is required' 
      });
    }
    
    const questions = await aiService.generateInterviewQuestions(resumeData, jobDescription);
    
    res.json({
      success: true,
      data: questions,
      message: 'Interview questions generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in /generate-questions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate questions'
    });
  }
});

/**
 * POST /api/resume/tailor
 * Generate tailored resume based on original resume, job description, and interview responses
 */
router.post('/tailor', protect, async (req, res) => {
  try {
    console.log('\n✂️ Resume tailoring request');
    
    const { resumeData, jobDescription = '', interviewResponses = [] } = req.body;
    
    if (!resumeData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resume data is required' 
      });
    }
    
    const tailoredResume = await aiService.generateTailoredResume(
      resumeData, 
      jobDescription, 
      interviewResponses
    );
    
    res.json({
      success: true,
      data: tailoredResume,
      message: 'Tailored resume generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in /tailor:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate tailored resume'
    });
  }
});

/**
 * POST /api/resume/parse-job-circular
 * Parse job circular PDF to extract text
 */
router.post('/parse-job-circular', protect, upload.single('jobCircular'), async (req, res) => {
  try {
    console.log('\n📄 Job circular parsing request');
    
    const { text } = req.body;
    
    // If text is provided directly, return it
    if (text) {
      return res.json({
        success: true,
        data: { jobDescription: text },
        message: 'Job description received'
      });
    }
    
    // If file is uploaded, parse it
    if (req.file) {
      const result = await parseResumeFile(req.file);
      
      res.json({
        success: true,
        data: { jobDescription: result },
        message: 'Job circular parsed successfully'
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Either text or file must be provided' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error in /parse-job-circular:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to parse job circular'
    });
  }
});

/**
 * POST /api/resume/check-missing-fields
 * Check for missing required fields for a template
 */
router.post('/check-missing-fields', async (req, res) => {
  try {
    console.log('\n🔍 Checking missing fields');
    console.log('📥 Received templateId:', req.body.templateId);
    console.log('📥 Received resumeData keys:', Object.keys(req.body.resumeData || {}));
    
    const { resumeData, templateId } = req.body;
    
    if (!resumeData || !templateId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resume data and template ID are required' 
      });
    }
    
    // Normalize templateId (could be name or ID)
    const template = templateService.getTemplateById(templateId);
    console.log('📋 Found template:', template ? `${template.name} (${template.id})` : 'NOT FOUND');
    const actualTemplateId = template ? template.id : templateId;
    console.log('🆔 Using template ID:', actualTemplateId);
    
    const missingFields = await templateService.checkMissingFields(actualTemplateId, resumeData);
    console.log('⚠️ Missing fields detected:', JSON.stringify(missingFields, null, 2));
    
    res.json({
      success: true,
      data: { missingFields },
      message: 'Missing fields checked successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in /check-missing-fields:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to check missing fields'
    });
  }
});

/**
 * POST /api/resume/populate-missing-fields
 * Use AI to populate missing fields in resume data
 */
router.post('/populate-missing-fields', async (req, res) => {
  try {
    console.log('\n🤖 Populating missing fields with AI');
    
    const { resumeData, templateId, missingFields } = req.body;
    
    if (!resumeData || !templateId || !missingFields) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resume data, template ID, and missing fields are required' 
      });
    }
    
    // Normalize templateId
    const template = templateService.getTemplateById(templateId);
    const actualTemplateId = template ? template.id : templateId;
    
    // Generate enhanced content for missing fields
    const enhancedResume = await aiService.generateResumeContent(resumeData);
    
    // Merge enhanced content with original resume data, focusing on missing fields
    const updatedResume = { ...resumeData };
    
    // Fill in missing personalInfo
    if (missingFields.personalInfo && enhancedResume.personalInfo) {
      missingFields.personalInfo.forEach(field => {
        if (enhancedResume.personalInfo[field]) {
          updatedResume.personalInfo = updatedResume.personalInfo || {};
          updatedResume.personalInfo[field] = enhancedResume.personalInfo[field];
        }
      });
    }
    
    // Fill in missing summary
    if (missingFields.summary && enhancedResume.summary) {
      updatedResume.summary = enhancedResume.summary;
    }
    
    // Fill in missing experience
    if (missingFields.experience && enhancedResume.experience && enhancedResume.experience.length > 0) {
      if (updatedResume.experience && updatedResume.experience.length > 0) {
        // Merge with existing experience
        updatedResume.experience = [...updatedResume.experience, ...enhancedResume.experience];
      } else {
        updatedResume.experience = enhancedResume.experience;
      }
    }
    
    // Fill in missing education
    if (missingFields.education && enhancedResume.education && enhancedResume.education.length > 0) {
      if (updatedResume.education && updatedResume.education.length > 0) {
        updatedResume.education = [...updatedResume.education, ...enhancedResume.education];
      } else {
        updatedResume.education = enhancedResume.education;
      }
    }
    
    // Fill in missing skills
    if (missingFields.skills && enhancedResume.skills) {
      updatedResume.skills = {
        ...updatedResume.skills,
        ...enhancedResume.skills
      };
      // Ensure technical skills array exists
      if (missingFields.skills.includes('technical') && !updatedResume.skills.technical) {
        updatedResume.skills.technical = enhancedResume.skills.technical || [];
      }
    }
    
    res.json({
      success: true,
      data: { resume: updatedResume },
      message: 'Missing fields populated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in /populate-missing-fields:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to populate missing fields'
    });
  }
});

/**
 * POST /api/resume/upload-image
 * Upload an image file (profile photo, logo, certificate, etc.)
 */
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const imagesDir = path.join(process.cwd(), 'uploads', 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP) are allowed!'));
    }
  }
});

router.post('/upload-image', protect, imageUpload.single('image'), async (req, res) => {
  try {
    console.log('\n📤 Image upload request');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded'
      });
    }
    
    // Return the image URL/path
    const imageUrl = `/uploads/images/${req.file.filename}`;
    const imagePath = req.file.path;
    
    console.log('✅ Image uploaded:', req.file.filename);
    
    res.json({
      success: true,
      data: {
        url: imageUrl,
        path: imagePath,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'Image uploaded successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in /upload-image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image'
    });
  }
});

/**
 * POST /api/resume/customize
 * Customize resume using template-agnostic system
 */
router.post('/customize', protect, sanitizeBody, async (req, res) => {
  try {
    console.log('\n🎨 Customization request received');
    
    const { templateId, resumeData, customizations } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId is required'
      });
    }
    
    if (!resumeData) {
      return res.status(400).json({
        success: false,
        error: 'resumeData is required'
      });
    }
    
    // Validate resumeData structure
    if (typeof resumeData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'resumeData must be an object'
      });
    }
    
    console.log('📋 Received resumeData structure:', {
      hasPersonalInfo: !!resumeData.personalInfo,
      hasExperience: Array.isArray(resumeData.experience),
      experienceCount: Array.isArray(resumeData.experience) ? resumeData.experience.length : 0,
      hasEducation: Array.isArray(resumeData.education),
      educationCount: Array.isArray(resumeData.education) ? resumeData.education.length : 0,
      hasSkills: !!resumeData.skills,
      keys: Object.keys(resumeData)
    });
    
    if (!customizations) {
      return res.status(400).json({
        success: false,
        error: 'customizations object is required'
      });
    }
    
    // Normalize templateId for lookup (convert "Resume Template" to "resume-template")
    // Also handle cases like "SixtySecondsCV" -> "sixty-seconds-cv"
    const normalizedTemplateId = templateId.toLowerCase().replace(/\s+/g, '-');
    // Also try camelCase to kebab-case conversion
    const kebabCaseId = templateId.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    console.log(`🔍 Normalizing templateId: "${templateId}" -> "${normalizedTemplateId}" or "${kebabCaseId}"`);
    
    // Get template metadata first (to find the actual ID)
    // Try multiple lookup strategies
    let template = templateService.getTemplateById(templateId);
    if (!template) {
      template = templateService.getTemplateById(normalizedTemplateId);
    }
    if (!template) {
      template = templateService.getTemplateById(kebabCaseId);
    }
    // Also try searching by name (case-insensitive)
    if (!template) {
      const allTemplates = templateService.getAllTemplates();
      template = allTemplates.find(t => 
        t.name && t.name.toLowerCase() === templateId.toLowerCase()
      );
    }
    
    if (!template || !template.file) {
      console.error(`❌ Template not found: ${templateId}`);
      const availableTemplates = templateService.getAllTemplates().map(t => ({ id: t.id, name: t.name }));
      console.error(`Available templates:`, availableTemplates);
      return res.status(404).json({
        success: false,
        error: `Template "${templateId}" not found. Available: ${availableTemplates.map(t => `${t.id} (${t.name})`).join(', ')}`
      });
    }
    
    // Use the template's actual ID for config lookup
    // Try template.id first, then kebab-case, then normalized
    let configTemplateId = template.id;
    if (!configTemplateId) {
      configTemplateId = kebabCaseId || normalizedTemplateId;
    }
    console.log(`📋 Using template ID "${configTemplateId}" for config lookup`);
    
    // Load template config
    let config;
    try {
      config = await templateConfigService.loadConfig(configTemplateId);
      console.log(`✅ Template config loaded for: ${configTemplateId}`);
    } catch (configError) {
      console.error(`❌ Failed to load config for ${configTemplateId}:`, configError.message);
      // Try with kebab-case ID as fallback
      if (configTemplateId !== kebabCaseId && kebabCaseId) {
        try {
          config = await templateConfigService.loadConfig(kebabCaseId);
          console.log(`✅ Template config loaded with kebab-case ID: ${kebabCaseId}`);
          configTemplateId = kebabCaseId;
        } catch (kebabError) {
          // Try with normalized ID as last resort
          try {
            config = await templateConfigService.loadConfig(normalizedTemplateId);
            console.log(`✅ Template config loaded with normalized ID: ${normalizedTemplateId}`);
            configTemplateId = normalizedTemplateId;
          } catch (fallbackError) {
            const availableConfigs = templateConfigService.getAvailableTemplates().map(t => t.templateId);
            console.error(`Available configs:`, availableConfigs);
            return res.status(404).json({
              success: false,
              error: `Template config not found for "${templateId}". Tried: ${configTemplateId}, ${kebabCaseId}, ${normalizedTemplateId}. Available configs: ${availableConfigs.join(', ')}`
            });
          }
        }
      } else {
        // Try with normalized ID as fallback
        try {
          config = await templateConfigService.loadConfig(normalizedTemplateId);
          console.log(`✅ Template config loaded with normalized ID: ${normalizedTemplateId}`);
          configTemplateId = normalizedTemplateId;
        } catch (fallbackError) {
          const availableConfigs = templateConfigService.getAvailableTemplates().map(t => t.templateId);
          console.error(`Available configs:`, availableConfigs);
          return res.status(404).json({
            success: false,
            error: `Template config not found for "${templateId}". Available configs: ${availableConfigs.join(', ')}`
          });
        }
      }
    }
    
    console.log(`✅ Template found: ${template.name} (file: ${template.file}, id: ${template.id})`);
    
    // Read original template file
    const templatesDir = path.join(process.cwd(), 'templates', 'store');
    let templatePath = path.join(templatesDir, template.file);
    
    // Check if the file exists, if not try variations
    try {
      await fsPromises.access(templatePath);
      console.log(`✅ Template file found: ${template.file}`);
    } catch {
      // Try to find the actual file (might have _main suffix or different name)
      console.log(`⚠️ Template file not found: ${template.file}, searching for variations...`);
      const files = await fsPromises.readdir(templatesDir);
      const baseName = path.basename(template.file, '.tex');
      const matchingFile = files.find(f => 
        f.startsWith(baseName) && f.endsWith('.tex')
      );
      if (matchingFile) {
        templatePath = path.join(templatesDir, matchingFile);
        console.log(`✅ Found template file: ${matchingFile}`);
      } else {
        throw new Error(`Template file not found: ${template.file}. Available files: ${files.filter(f => f.endsWith('.tex')).join(', ')}`);
      }
    }
    
    const templateDir = path.dirname(templatePath);
    const actualTemplateFileName = path.basename(templatePath);
    console.log(`📄 Using template file: ${actualTemplateFileName}`);
    
    // Create temp directory for compilation FIRST (needed for Curve CV)
    const tempDir = path.join(process.cwd(), 'temp');
    const compileDir = path.join(tempDir, `customize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    await fsPromises.mkdir(compileDir, { recursive: true });
    
    try {
      // Copy all template files to compile directory first (needed for Curve CV section files)
      const files = await fsPromises.readdir(templateDir);
      for (const file of files) {
        if (file.startsWith('.')) continue;
        const srcPath = path.join(templateDir, file);
        const destPath = path.join(compileDir, file);
        const stat = await fsPromises.stat(srcPath);
        if (stat.isFile()) {
          await fsPromises.copyFile(srcPath, destPath);
        }
      }
      
      console.log('📝 Populating template with resume data...');
      console.log('📋 Resume data keys:', Object.keys(resumeData || {}));
      
      // Populate template with resume data (now with compileDir available)
      // Use the template's actual ID for population, or try normalized/kebab-case versions
      let populateTemplateId = template.id || normalizedTemplateId;
      // If template.id doesn't match, try kebab-case
      if (!populateTemplateId || populateTemplateId === normalizedTemplateId) {
        populateTemplateId = kebabCaseId || normalizedTemplateId;
      }
      console.log(`📝 Using template ID "${populateTemplateId}" for data population`);
      let texContent = await populateTemplateWithData(populateTemplateId, resumeData, templatePath, compileDir);
      console.log('✅ Template populated with resume data');
      console.log('📄 Template content length:', texContent.length);
      
      // Safety: handle unresolved image placeholders (e.g., PROFILE_IMAGE) to prevent LaTeX file-not-found
      try {
        // Create a 1x1 transparent PNG placeholder if needed
        const placeholderPngPath = path.join(compileDir, 'placeholder.png');
        const placeholderPngBase64 =
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAucB9W5y1i0AAAAASUVORK5CYII=';
        if (!fs.existsSync(placeholderPngPath)) {
          fs.writeFileSync(placeholderPngPath, Buffer.from(placeholderPngBase64, 'base64'));
        }
        // Replace common unresolved image tokens with the placeholder
        const imageTokens = ['PROFILE_IMAGE', 'PHOTO_PATH', 'PROFILE_PHOTO', 'AVATAR_PATH', 'IMAGE_PATH'];
        imageTokens.forEach((tok) => {
          const includePattern = new RegExp(`(\\\\includegraphics(?:\\[[^\\]]*\\])?\\{)${tok}(\\})`, 'g');
          texContent = texContent.replace(includePattern, `$1${placeholderPngPath.replace(/\\/g, '/')}$2`);
        });
        // Comment out any includegraphics that still reference all-caps tokens
        texContent = texContent.replace(/^(.*\\includegraphics[^\{]*\{[A-Z_]+\}.*)$/gm, '% $1');
      } catch (imgSanitizeErr) {
        console.warn('⚠️ Image placeholder sanitization failed:', imgSanitizeErr?.message);
      }
      
      // Create customizer instance with populated content
      const customizer = new GenericLatexCustomizer(templateId, texContent, config);
      
      // Apply customizations
      console.log('🎨 Applying customizations...');
      
      // Apply color scheme if provided
      if (customizations.colorScheme && config.features?.supportsColorSchemes) {
        console.log(`  - Color scheme: ${customizations.colorScheme}`);
        customizer.applyColorScheme(customizations.colorScheme);
      }
      
      // Apply font if provided
      if (customizations.font && config.features?.supportsFonts) {
        console.log(`  - Font: ${customizations.font}`);
        customizer.applyFont(customizations.font);
      }
      
      // Toggle sections
      if (customizations.enabledSections && config.features?.supportsSectionToggle) {
        const sectionCount = Object.entries(customizations.enabledSections).length;
        console.log(`  - Section toggles: ${sectionCount} sections`);
        for (const [sectionId, enabled] of Object.entries(customizations.enabledSections)) {
          customizer.toggleSection(sectionId, enabled);
        }
      }
      
      // Replace placeholders with edited content
      if (customizations.editedContent && Object.keys(customizations.editedContent).length > 0) {
        const placeholderCount = Object.keys(customizations.editedContent).length;
        console.log(`  - Placeholder replacements: ${placeholderCount} placeholders`);
        customizer.replaceAllPlaceholders(customizations.editedContent);
      }
      
      // Apply custom colors if provided
      if (customizations.customColors && config.features?.supportsCustomColors) {
        const colorCount = Object.keys(customizations.customColors).length;
        console.log(`  - Custom colors: ${colorCount} colors`);
        for (const [colorName, hexValue] of Object.entries(customizations.customColors)) {
          customizer.applyCustomColor(colorName, hexValue);
        }
      }
      
      console.log('✅ Customizations applied');
      
      // Get modified LaTeX content
      let modifiedTex = customizer.getModifiedTex();
      
      // Final safety sanitization: remove any unresolved ALL_CAPS placeholders that can break LaTeX
      try {
        // Replace tokens like {LANGUAGES_LIST} -> {}
        modifiedTex = modifiedTex.replace(/\{[A-Z_]{2,}\}/g, '{}');
        // Replace bare ALL_CAPS tokens with empty string (do not comment to avoid breaking environments)
        modifiedTex = modifiedTex.replace(/\b[A-Z_]{2,}\b/g, '');
        // Collapse any accidental "$$" from template artifacts
        modifiedTex = modifiedTex.replace(/\$\$/g, '$');
      } catch (sanitizeErr) {
        console.warn('⚠️ Placeholder sanitization failed:', sanitizeErr?.message);
      }
      
      // Use the actual template file name (which we found above)
      // Normalize filename to avoid spaces and special characters for compilation
      const originalFileName = actualTemplateFileName;
      const normalizedFileName = originalFileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
      const mainTemplatePath = path.join(compileDir, normalizedFileName);
      
      console.log(`📝 Writing template file: ${normalizedFileName} (original: ${originalFileName})`);
      await fsPromises.writeFile(mainTemplatePath, modifiedTex, 'utf-8');
      
      // Verify file was written
      try {
        const stats = await fsPromises.stat(mainTemplatePath);
        console.log(`✅ Template file written: ${stats.size} bytes`);
      } catch (statError) {
        throw new Error(`Failed to write template file: ${statError.message}`);
      }
      
      // Compile LaTeX to PDF
      const templateBaseName = path.basename(normalizedFileName, '.tex');
      const engine = config.engine || 'pdflatex';
      
      console.log(`🔨 Compiling LaTeX with ${engine}...`);
      console.log(`📄 Template file: ${mainTemplatePath}`);
      console.log(`📄 Template base name: ${templateBaseName}`);
      const execAsync = promisify(exec);
      
      // Compile with appropriate engine
      const pdfPath = path.join(compileDir, `${templateBaseName}.pdf`);
      
      try {
        // On Windows, paths with spaces need to be properly quoted
        // The paths are already quoted in the command, but we need to ensure they're correct
        const compileCommand = `${engine} -interaction=nonstopmode -output-directory="${compileDir}" "${mainTemplatePath}"`;
        console.log(`📝 Running: ${compileCommand}`);
        console.log(`📁 Working directory: ${compileDir}`);
        console.log(`📄 Template file: ${mainTemplatePath}`);
        
        // Verify file exists before compiling
        try {
          await fsPromises.access(mainTemplatePath);
          console.log(`✅ Template file exists`);
        } catch (accessError) {
          throw new Error(`Template file does not exist: ${mainTemplatePath}`);
        }
        
        const { stdout, stderr } = await execAsync(compileCommand, {
          cwd: compileDir,
          maxBuffer: 10 * 1024 * 1024,
          shell: true // Use shell to handle Windows paths properly
        });
        
        if (stderr && !stderr.includes('Warning')) {
          console.warn('⚠️ LaTeX warnings:', stderr);
        }
        
        // Check if PDF was generated
        try {
          await fsPromises.access(pdfPath);
          const stats = await fsPromises.stat(pdfPath);
          console.log(`✅ PDF generated successfully: ${stats.size} bytes`);
        } catch {
          // Try to read log file for errors
          const logPath = path.join(compileDir, `${templateBaseName}.log`);
          let logContent = '';
          let errorMessage = 'PDF generation failed - no output file created';
          try {
            logContent = await fsPromises.readFile(logPath, 'utf-8');
            // Extract error messages from log
            const errorLines = logContent.split('\n').filter(line => 
              line.includes('!') || line.includes('Error') || line.includes('Fatal')
            );
            if (errorLines.length > 0) {
              errorMessage = `LaTeX compilation failed:\n${errorLines.slice(-10).join('\n')}`;
            }
            console.error('❌ LaTeX log (last 3000 chars):', logContent.slice(-3000));
          } catch {}
          throw new Error(errorMessage);
        }
      } catch (compileError) {
        console.error('❌ LaTeX compilation error:', compileError);
        // Even if the compiler returned a non-zero code, continue if a PDF was produced
        const pdfPathExists = async (p) => {
          try { await fsPromises.access(p); return true; } catch { return false; }
        };
        const exists = await pdfPathExists(pdfPath);
        if (exists) {
          console.warn('⚠️ LaTeX returned errors, but PDF exists. Proceeding to send PDF.');
        } else {
          // Try to read log file for detailed errors, then fail
          const logPath = path.join(compileDir, `${templateBaseName}.log`);
          let detailedError = compileError.message;
          try {
            const logContent = await fsPromises.readFile(logPath, 'utf-8');
            const errorLines = logContent.split('\n').filter(line => 
              line.includes('!') || line.includes('Error') || line.includes('Fatal') || line.includes('Undefined')
            );
            if (errorLines.length > 0) {
              detailedError = `LaTeX compilation failed:\n${errorLines.slice(-15).join('\n')}`;
            }
            console.error('❌ LaTeX log (last 3000 chars):', logContent.slice(-3000));
          } catch {}
          throw new Error(detailedError);
        }
      }
      
      console.log('✅ Customized PDF generated:', pdfPath);
      
      // Read PDF as buffer and send with proper headers
      try {
        const pdfBuffer = await fsPromises.readFile(pdfPath);
        console.log(`📤 Sending PDF (${pdfBuffer.length} bytes)`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
        res.send(pdfBuffer);
        console.log('✅ PDF sent successfully');
      } catch (sendError) {
        console.error('❌ Error reading/sending PDF:', sendError);
        throw new Error(`Failed to read or send PDF: ${sendError.message}`);
      }
      
      // Cleanup: remove temp directory after a delay (non-blocking)
      setTimeout(async () => {
        try {
          await fsPromises.rm(compileDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup temp directory:', cleanupError.message);
        }
      }, 5000);
      
    } catch (compileError) {
      console.error('❌ LaTeX compilation error:', compileError);
      console.error('❌ Compilation error stack:', compileError.stack);
      const errorMessage = compileError.message || 'LaTeX compilation failed';
      res.status(500).json({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? compileError.stack : undefined
      });
      return;
    }
    
  } catch (error) {
    console.error('❌ Error in /customize:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request details:', {
      templateId: req.body?.templateId,
      hasResumeData: !!req.body?.resumeData,
      hasCustomizations: !!req.body?.customizations,
      resumeDataKeys: req.body?.resumeData ? Object.keys(req.body.resumeData) : []
    });
    const errorMessage = error.message || 'Failed to customize resume';
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/resume/extract-placeholders
 * Extract all placeholders from a template
 */
router.post('/extract-placeholders', protect, async (req, res) => {
  try {
    const { templateId } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId is required'
      });
    }
    
    // Load template config
    const config = await templateConfigService.loadConfig(templateId);
    
    // Get template metadata
    const template = templateService.getTemplateById(templateId);
    if (!template || !template.file) {
      return res.status(404).json({
        success: false,
        error: `Template ${templateId} not found`
      });
    }
    
    // Read template file
    const templatesDir = path.join(process.cwd(), 'templates', 'store');
    const templatePath = path.join(templatesDir, template.file);
    const texContent = await fsPromises.readFile(templatePath, 'utf-8');
    
    // Create customizer to extract placeholders
    const customizer = new GenericLatexCustomizer(templateId, texContent, config);
    const placeholders = customizer.extractPlaceholders();
    
    // Merge with config placeholders for metadata
    const placeholderMetadata = {};
    if (config.placeholders) {
      for (const [key, value] of Object.entries(config.placeholders)) {
        placeholderMetadata[key] = {
          ...value,
          currentValue: placeholders[key] || value.default || ''
        };
      }
    }
    
    // Add any extracted placeholders not in config
    for (const [key, value] of Object.entries(placeholders)) {
      if (!placeholderMetadata[key]) {
        placeholderMetadata[key] = {
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: 'text',
          default: '',
          currentValue: value
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        placeholders: placeholderMetadata,
        sections: customizer.extractSections()
      }
    });
    
  } catch (error) {
    console.error('❌ Error extracting placeholders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract placeholders'
    });
  }
});

export default router;
