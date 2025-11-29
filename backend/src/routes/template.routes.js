import express from 'express';
import templateService from '../services/template.service.js';
import templateConfigService from '../services/template-config.service.js';
import aiService from '../services/ai.service.js';
import latexService from '../services/latex.service.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/templates
 * Get all templates with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { search, category, jobType, difficulty, source, limit } = req.query;
    
    let templates;
    
    if (search) {
      templates = await templateService.searchTemplates(search);
    } else if (category || jobType || difficulty || source) {
      templates = await templateService.filterTemplates({
        category,
        jobType,
        difficulty,
        source
      });
    } else {
      templates = await templateService.getAllTemplates();
    }
    
    // Apply limit
    if (limit && !isNaN(parseInt(limit))) {
      templates = templates.slice(0, parseInt(limit));
    }
    
    console.log(`📋 Templates request: ${templates.length} results`);
    res.json({ templates, count: templates.length });
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/templates/featured
 * Get featured/popular templates
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const templates = await templateService.getFeaturedTemplates(limit);
    
    console.log(`⭐ Featured templates: ${templates.length} results`);
    res.json({ templates, count: templates.length });
  } catch (error) {
    console.error('❌ Error fetching featured templates:', error);
    res.status(500).json({ error: 'Failed to fetch featured templates' });
  }
});

/**
 * GET /api/templates/stats
 * Get template statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await templateService.getTemplateStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching template stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/templates/categories
 * Get all unique categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await templateService.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/templates/job-types
 * Get all unique job types
 */
router.get('/job-types', async (req, res) => {
  try {
    const jobTypes = await templateService.getJobTypes();
    res.json({ jobTypes });
  } catch (error) {
    console.error('❌ Error fetching job types:', error);
    res.status(500).json({ error: 'Failed to fetch job types' });
  }
});

/**
 * GET /api/templates/:id
 * Get template by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('❌ Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * POST /api/templates/recommend
 * Get AI-recommended templates based on user's resume
 */
router.post('/recommend', protect, async (req, res) => {
  try {
    const { resumeData, topN = 10 } = req.body;
    
    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }
    
    console.log('🎯 AI template recommendations request');
    
    // Get all templates
    const allTemplates = await templateService.getAllTemplates();
    
    // Get AI recommendations
    const recommendations = await aiService.recommendTemplates(
      resumeData,
      allTemplates,
      parseInt(topN)
    );
    
    console.log(`✅ Generated ${recommendations.length} recommendations`);
    res.json({ recommendations, count: recommendations.length });
  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * POST /api/templates/:id/render
 * Compile and render a LaTeX template with user data
 */
router.post('/:id/render', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { resumeData } = req.body;
    
    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }
    
    console.log(`📄 Rendering template: ${id}`);
    
    // Check if LaTeX is available
    const latexAvailable = await latexService.isLaTeXAvailable();
    if (!latexAvailable) {
      return res.status(503).json({ 
        error: 'LaTeX compiler not available',
        fallback: 'Please ensure MiKTeX or TeX Live is installed'
      });
    }
    
    // Compile template
    const pdfPath = await latexService.compileTemplate(id, resumeData);
    
    // Send PDF as response
    res.sendFile(pdfPath);
  } catch (error) {
    console.error('❌ Error rendering template:', error);
    res.status(500).json({ 
      error: 'Failed to render template',
      details: error.message 
    });
  }
});

/**
 * GET /api/templates/:id/preview
 * Get preview/thumbnail of template
 */
router.get('/:id/preview', async (req, res) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // For now, return placeholder
    res.json({ 
      thumbnail: template.thumbnails?.small || null,
      message: 'Preview not yet implemented'
    });
  } catch (error) {
    console.error('❌ Error fetching preview:', error);
    res.status(500).json({ error: 'Failed to fetch preview' });
  }
});

/**
 * GET /api/templates/available
 * Get all templates with their configuration info
 */
router.get('/available', async (req, res) => {
  try {
    console.log('📋 Fetching available templates with configs');
    const templates = await templateConfigService.getAvailableTemplates();
    
    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('❌ Error fetching available templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch available templates'
    });
  }
});

/**
 * GET /api/templates/:templateId/config
 * Get template configuration for a specific template
 */
router.get('/:templateId/config', async (req, res) => {
  try {
    const { templateId } = req.params;
    console.log(`📋 Fetching config for template: ${templateId}`);
    
    const config = await templateConfigService.loadConfig(templateId);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error(`❌ Error fetching template config for ${req.params.templateId}:`, error);
    res.status(404).json({
      success: false,
      error: error.message || 'Template config not found'
    });
  }
});

export default router;


