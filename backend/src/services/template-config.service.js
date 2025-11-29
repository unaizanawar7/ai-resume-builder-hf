/**
 * Template Configuration Loader Service
 * Loads and manages template configuration files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateTemplateConfig } from '../utils/template-config.validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_DIR = path.join(__dirname, '../../config/templates');
const configCache = new Map();

class TemplateConfigService {
  /**
   * Load template configuration from file
   * @param {string} templateId - Template identifier
   * @returns {Promise<Object>} Template configuration object
   */
  async loadConfig(templateId) {
    // Check cache first
    if (configCache.has(templateId)) {
      return configCache.get(templateId);
    }

    try {
      const configPath = path.join(CONFIG_DIR, `${templateId}.config.json`);
      
      // Check if file exists
      try {
        await fs.access(configPath);
      } catch (error) {
        throw new Error(`Template config not found for templateId: ${templateId}`);
      }

      // Read and parse config file
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      // Validate config
      const validation = validateTemplateConfig(config);
      if (!validation.valid) {
        throw new Error(`Invalid template config for ${templateId}: ${validation.errors.join(', ')}`);
      }

      // Verify templateId matches
      if (config.templateId !== templateId) {
        throw new Error(`Template ID mismatch: config has ${config.templateId}, expected ${templateId}`);
      }

      // Cache the config
      configCache.set(templateId, config);

      return config;
    } catch (error) {
      console.error(`Error loading template config for ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached template configuration
   * @param {string} templateId - Template identifier
   * @returns {Object|null} Cached configuration or null
   */
  getTemplateConfig(templateId) {
    return configCache.get(templateId) || null;
  }

  /**
   * Get all available templates with configs
   * @returns {Promise<Array>} Array of template metadata
   */
  async getAvailableTemplates() {
    try {
      const files = await fs.readdir(CONFIG_DIR);
      const configFiles = files.filter(file => file.endsWith('.config.json'));
      
      const templates = [];
      
      for (const file of configFiles) {
        const templateId = file.replace('.config.json', '');
        try {
          const config = await this.loadConfig(templateId);
          templates.push({
            templateId: config.templateId,
            name: config.metadata.name,
            description: config.metadata.description,
            mainFile: config.metadata.mainFile,
            features: config.features || {},
            version: config.version
          });
        } catch (error) {
          console.warn(`Skipping invalid config file: ${file}`, error.message);
        }
      }

      return templates;
    } catch (error) {
      console.error('Error getting available templates:', error);
      throw error;
    }
  }

  /**
   * Get template features
   * @param {string} templateId - Template identifier
   * @returns {Promise<Object>} Features object
   */
  async getTemplateFeatures(templateId) {
    const config = await this.loadConfig(templateId);
    return config.features || {};
  }

  /**
   * Validate a configuration object
   * @param {Object} config - Configuration to validate
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validateConfig(config) {
    return validateTemplateConfig(config);
  }

  /**
   * Clear config cache (useful for testing or hot-reloading)
   */
  clearCache() {
    configCache.clear();
  }

  /**
   * Clear specific template from cache
   * @param {string} templateId - Template identifier
   */
  clearTemplateCache(templateId) {
    configCache.delete(templateId);
  }
}

export default new TemplateConfigService();



