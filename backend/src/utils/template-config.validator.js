/**
 * Template Configuration Validator
 * Validates template config JSON files against schema
 */

/**
 * Validate template configuration against schema
 * @param {Object} config - Template configuration object
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateTemplateConfig(config) {
  const errors = [];

  // Required top-level fields
  if (!config.templateId || typeof config.templateId !== 'string') {
    errors.push('templateId is required and must be a string');
  }

  if (!config.version || typeof config.version !== 'string') {
    errors.push('version is required and must be a string');
  }

  if (!config.metadata || typeof config.metadata !== 'object') {
    errors.push('metadata is required and must be an object');
  } else {
    if (!config.metadata.name || typeof config.metadata.name !== 'string') {
      errors.push('metadata.name is required and must be a string');
    }
    if (!config.metadata.mainFile || typeof config.metadata.mainFile !== 'string') {
      errors.push('metadata.mainFile is required and must be a string');
    }
  }

  // Validate features object
  if (config.features) {
    const validFeatureKeys = ['supportsColorSchemes', 'supportsFonts', 'supportsSectionToggle', 'supportsCustomColors'];
    for (const key of validFeatureKeys) {
      if (config.features[key] !== undefined && typeof config.features[key] !== 'boolean') {
        errors.push(`features.${key} must be a boolean`);
      }
    }
  }

  // Validate colorSchemes (optional)
  if (config.colorSchemes && typeof config.colorSchemes === 'object') {
    for (const [schemeName, scheme] of Object.entries(config.colorSchemes)) {
      if (!scheme.label || typeof scheme.label !== 'string') {
        errors.push(`colorSchemes.${schemeName}.label is required and must be a string`);
      }
      if (scheme.command !== undefined && typeof scheme.command !== 'string') {
        errors.push(`colorSchemes.${schemeName}.command must be a string`);
      }
      if (scheme.type && !['predefined', 'custom'].includes(scheme.type)) {
        errors.push(`colorSchemes.${schemeName}.type must be 'predefined' or 'custom'`);
      }
    }
  }

  // Validate fonts (optional)
  if (config.fonts && typeof config.fonts === 'object') {
    for (const [fontName, font] of Object.entries(config.fonts)) {
      if (!font.label || typeof font.label !== 'string') {
        errors.push(`fonts.${fontName}.label is required and must be a string`);
      }
      if (font.packages && !Array.isArray(font.packages)) {
        errors.push(`fonts.${fontName}.packages must be an array`);
      }
      if (font.commands !== undefined && typeof font.commands !== 'string') {
        errors.push(`fonts.${fontName}.commands must be a string`);
      }
    }
  }

  // Validate sections (optional)
  if (config.sections && typeof config.sections === 'object') {
    for (const [sectionId, section] of Object.entries(config.sections)) {
      if (!section.label || typeof section.label !== 'string') {
        errors.push(`sections.${sectionId}.label is required and must be a string`);
      }
      if (section.pattern && typeof section.pattern !== 'string') {
        errors.push(`sections.${sectionId}.pattern must be a string`);
      }
      if (section.startMarker && typeof section.startMarker !== 'string') {
        errors.push(`sections.${sectionId}.startMarker must be a string`);
      }
      if (section.removable !== undefined && typeof section.removable !== 'boolean') {
        errors.push(`sections.${sectionId}.removable must be a boolean`);
      }
    }
  }

  // Validate placeholders (optional)
  if (config.placeholders && typeof config.placeholders === 'object') {
    for (const [placeholderName, placeholder] of Object.entries(config.placeholders)) {
      if (!placeholder.label || typeof placeholder.label !== 'string') {
        errors.push(`placeholders.${placeholderName}.label is required and must be a string`);
      }
      const validTypes = ['text', 'textarea', 'email', 'phone', 'url', 'date'];
      if (placeholder.type && !validTypes.includes(placeholder.type)) {
        errors.push(`placeholders.${placeholderName}.type must be one of: ${validTypes.join(', ')}`);
      }
    }
  }

  // Validate engine
  if (config.engine && !['pdflatex', 'xelatex', 'lualatex'].includes(config.engine)) {
    errors.push('engine must be one of: pdflatex, xelatex, lualatex');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}



