/**
 * Template Service - Manages resume templates
 * 
 * Loads templates from metadata.json and provides methods to:
 * - Get all templates
 * - Get template by ID
 * - Search and filter templates
 * - Get template statistics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METADATA_PATH = path.join(__dirname, '../../templates/metadata.json');

class TemplateService {
  constructor() {
    this.templates = [];
    this.loadTemplates();
  }

  /**
   * Load templates from metadata.json
   */
  loadTemplates() {
    try {
      const metadataContent = fs.readFileSync(METADATA_PATH, 'utf-8');
      this.templates = JSON.parse(metadataContent);
      console.log(`✅ Loaded ${this.templates.length} templates from metadata.json`);
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      this.templates = [];
    }
  }

  /**
   * Get all templates
   */
  getAllTemplates() {
    return this.templates;
  }

  /**
   * Get template by ID
   */
  getTemplateById(id) {
    return this.templates.find(t => t.id === id || t.name.toLowerCase() === id.toLowerCase());
  }

  /**
   * Search templates by name or description
   */
  searchTemplates(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.templates.filter(template => {
      return (
        template.name.toLowerCase().includes(term) ||
        template.description?.toLowerCase().includes(term) ||
        template.category?.some(cat => cat.toLowerCase().includes(term)) ||
        template.jobTypes?.some(job => job.toLowerCase().includes(term))
      );
    });
  }

  /**
   * Filter templates by various criteria
   */
  filterTemplates(filters) {
    let filtered = [...this.templates];

    if (filters.category) {
      filtered = filtered.filter(t => 
        t.category && t.category.some(cat => cat.toLowerCase() === filters.category.toLowerCase())
      );
    }

    if (filters.jobType) {
      filtered = filtered.filter(t => 
        t.jobTypes && t.jobTypes.some(job => job.toLowerCase() === filters.jobType.toLowerCase())
      );
    }

    if (filters.difficulty) {
      filtered = filtered.filter(t => 
        t.difficulty && t.difficulty.toLowerCase() === filters.difficulty.toLowerCase()
      );
    }

    if (filters.source) {
      filtered = filtered.filter(t => 
        t.source && t.source.toLowerCase() === filters.source.toLowerCase()
      );
    }

    return filtered;
  }

  /**
   * Get featured templates (first N templates)
   */
  getFeaturedTemplates(limit = 5) {
    return this.templates.slice(0, limit);
  }

  /**
   * Get template statistics
   */
  getTemplateStats() {
    const categories = new Set();
    const jobTypes = new Set();
    const difficulties = new Set();
    const sources = new Set();

    this.templates.forEach(template => {
      if (template.category) {
        template.category.forEach(cat => categories.add(cat));
      }
      if (template.jobTypes) {
        template.jobTypes.forEach(job => jobTypes.add(job));
      }
      if (template.difficulty) {
        difficulties.add(template.difficulty);
      }
      if (template.source) {
        sources.add(template.source);
      }
    });

    return {
      total: this.templates.length,
      categories: Array.from(categories),
      jobTypes: Array.from(jobTypes),
      difficulties: Array.from(difficulties),
      sources: Array.from(sources)
    };
  }

  /**
   * Get all unique categories
   */
  getCategories() {
    const categories = new Set();
    this.templates.forEach(template => {
      if (template.category) {
        template.category.forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories);
  }

  /**
   * Get all unique job types
   */
  getJobTypes() {
    const jobTypes = new Set();
    this.templates.forEach(template => {
      if (template.jobTypes) {
        template.jobTypes.forEach(job => jobTypes.add(job));
      }
    });
    return Array.from(jobTypes);
  }

  /**
   * Get required fields for a template
   */
  async getRequiredFields(templateId) {
    // Define required fields for each template
    const requiredFieldsMap = {
      'customised-curve-cv': {
        personalInfo: ['fullName', 'email'],
        experience: ['position', 'company', 'responsibilities'],
        education: ['degree', 'institution', 'graduationDate'],
        skills: ['technical'],
        summary: true
      },
      'altacv': {
        personalInfo: ['fullName', 'email', 'phone', 'location'],
        experience: ['position', 'company', 'responsibilities'],
        education: ['degree', 'institution', 'graduationDate'],
        skills: ['technical'],
        summary: true
      },
      'simple-hipster-cv': {
        personalInfo: ['fullName', 'email'],
        experience: ['position', 'company', 'responsibilities'],
        education: ['degree', 'institution', 'graduationDate'],
        skills: ['technical'],
        summary: true
      }
    };

    const template = this.getTemplateById(templateId);
    if (!template) {
      return {};
    }

    return requiredFieldsMap[template.id] || {};
  }

  /**
   * Check for missing required fields in resume data
   */
  async checkMissingFields(templateId, resumeData) {
    const requiredFields = await this.getRequiredFields(templateId);
    const missingFields = {};
    const isEmptyValue = (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return value.trim().length === 0;
      if (Array.isArray(value)) {
        if (value.length === 0) return true;
        return value.every(item => isEmptyValue(item));
      }
      if (typeof value === 'object') {
        return Object.keys(value).length === 0;
      }
      return false;
    };

    // Check personalInfo
    if (requiredFields.personalInfo) {
      const missingPersonalInfo = [];
      requiredFields.personalInfo.forEach(field => {
        const value = resumeData.personalInfo ? resumeData.personalInfo[field] : undefined;
        if (isEmptyValue(value)) {
          missingPersonalInfo.push(field);
        }
      });
      if (missingPersonalInfo.length > 0) {
        missingFields.personalInfo = missingPersonalInfo;
      }
    }

    // Check summary
    if (requiredFields.summary && isEmptyValue(resumeData.summary)) {
      missingFields.summary = true;
    }

    // Check experience
    if (requiredFields.experience) {
      if (!resumeData.experience || resumeData.experience.length === 0) {
        missingFields.experience = true;
      } else {
        const incompleteExp = [];
        resumeData.experience.forEach((exp, idx) => {
          const missing = requiredFields.experience.filter(field => {
            const value = exp ? exp[field] : undefined;
            if (field === 'responsibilities') {
              if (!Array.isArray(value)) return true;
              return value.length === 0 || value.every(item => isEmptyValue(item));
            }
            return isEmptyValue(value);
          });
          if (missing.length > 0) {
            incompleteExp.push({ index: idx, missing });
          }
        });
        if (incompleteExp.length > 0) {
          missingFields.experience = incompleteExp;
        }
      }
    }

    // Check education
    if (requiredFields.education) {
      if (!resumeData.education || resumeData.education.length === 0) {
        missingFields.education = true;
      } else {
        const incompleteEdu = [];
        resumeData.education.forEach((edu, idx) => {
          const missing = requiredFields.education.filter(field => {
            const value = edu ? edu[field] : undefined;
            return isEmptyValue(value);
          });
          if (missing.length > 0) {
            incompleteEdu.push({ index: idx, missing });
          }
        });
        if (incompleteEdu.length > 0) {
          missingFields.education = incompleteEdu;
        }
      }
    }

    // Check skills
    if (requiredFields.skills) {
      if (requiredFields.skills.includes('technical')) {
        if (
          !resumeData.skills ||
          !Array.isArray(resumeData.skills.technical) ||
          resumeData.skills.technical.length === 0 ||
          resumeData.skills.technical.every(skill => isEmptyValue(skill))
        ) {
          missingFields.skills = ['technical'];
        }
      }
    }

    return missingFields;
  }
}

export default new TemplateService();


