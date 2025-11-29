/**
 * Generic LaTeX Customizer Service
 * Template-agnostic LaTeX customization using configuration files
 */

class GenericLatexCustomizer {
  /**
   * Constructor
   * @param {string} templateId - Template identifier
   * @param {string} texContent - Original LaTeX content
   * @param {Object} config - Template configuration object
   */
  constructor(templateId, texContent, config) {
    this.templateId = templateId;
    this.texContent = texContent;
    this.config = config;
    this.modifiedContent = texContent;
  }

  /**
   * Apply color scheme
   * @param {string} schemeName - Name of color scheme from config
   * @returns {this} For method chaining
   */
  applyColorScheme(schemeName) {
    if (!this.config.colorSchemes || !this.config.colorSchemes[schemeName]) {
      console.warn(`Color scheme '${schemeName}' not found in config for template ${this.templateId}`);
      return this;
    }

    const scheme = this.config.colorSchemes[schemeName];
    
    // Handle both object format (with .command) and string format
    let command = null;
    if (typeof scheme === 'string') {
      command = scheme;
    } else if (scheme && scheme.command) {
      command = scheme.command;
    } else {
      console.warn(`Color scheme '${schemeName}' has no command defined`);
      return this;
    }

    if (!command) {
      return this;
    }

    console.log(`🎨 Applying color scheme '${schemeName}': ${command}`);

    // Find existing color scheme command and replace it, or insert before \begin{document}
    // Match various color scheme patterns
    const colorSchemePatterns = [
      /\\setcolorscheme\{[^}]+\}/g,
      /\\colorlet\{[^}]+\}\{[^}]+\}/g,
      /\\definecolor\{[^}]+\}\{[^}]+\}\{[^}]+\}/g
    ];
    
    let replaced = false;
    for (const pattern of colorSchemePatterns) {
      if (pattern.test(this.modifiedContent)) {
        // Replace existing color scheme
        this.modifiedContent = this.modifiedContent.replace(pattern, command);
        replaced = true;
        break;
      }
    }
    
    if (!replaced) {
      // Insert before \begin{document}
      const insertPoint = this.modifiedContent.indexOf('\\begin{document}');
      if (insertPoint !== -1) {
        this.modifiedContent = 
          this.modifiedContent.slice(0, insertPoint) + 
          command + '\n' + 
          this.modifiedContent.slice(insertPoint);
        console.log('✅ Color scheme command inserted before \\begin{document}');
      } else {
        console.warn('⚠️ Could not find \\begin{document} to insert color scheme');
      }
    } else {
      console.log('✅ Existing color scheme replaced');
    }

    return this;
  }

  /**
   * Apply font
   * @param {string} fontName - Name of font from config
   * @returns {this} For method chaining
   */
  applyFont(fontName) {
    if (!this.config.fonts || !this.config.fonts[fontName]) {
      console.warn(`Font '${fontName}' not found in config for template ${this.templateId}`);
      return this;
    }

    const font = this.config.fonts[fontName];
    
    // Insert font packages and commands in preamble
    const preambleEnd = this.modifiedContent.indexOf('\\begin{document}');
    if (preambleEnd === -1) {
      console.warn('Could not find \\begin{document} in LaTeX content');
      return this;
    }

    const preamble = this.modifiedContent.slice(0, preambleEnd);
    const document = this.modifiedContent.slice(preambleEnd);

    // Check if font packages are already loaded
    let newPreamble = preamble;
    
    if (font.packages && Array.isArray(font.packages)) {
      for (const pkg of font.packages) {
        const pkgPattern = new RegExp(`\\\\usepackage(?:\\[.*?\\])?\\{${pkg}\\}`, 'g');
        if (!pkgPattern.test(preamble)) {
          // Insert package before \begin{document}
          newPreamble += `\\usepackage{${pkg}}\n`;
        }
      }
    }

    if (font.commands) {
      // Remove existing font commands if any (simple heuristic)
      const fontCommandPattern = /\\renewcommand\{\\familydefault\}.*?\n/g;
      newPreamble = newPreamble.replace(fontCommandPattern, '');
      
      // Insert font commands before \begin{document}
      newPreamble += font.commands + '\n';
    }

    this.modifiedContent = newPreamble + document;
    return this;
  }

  /**
   * Toggle section visibility
   * @param {string} sectionId - Section identifier from config
   * @param {boolean} enabled - Whether section should be visible
   * @returns {this} For method chaining
   */
  toggleSection(sectionId, enabled) {
    if (!this.config.sections || !this.config.sections[sectionId]) {
      console.warn(`Section '${sectionId}' not found in config for template ${this.templateId}`);
      return this;
    }

    const section = this.config.sections[sectionId];
    
    if (!section.removable) {
      return this; // Section cannot be removed
    }

    if (enabled) {
      // Section should be visible - ensure it exists (re-adding removed sections is complex, so we'll just ensure it's not removed)
      return this;
    }

    // Remove section using pattern
    if (section.pattern) {
      try {
        const regex = new RegExp(section.pattern, 'g');
        this.modifiedContent = this.modifiedContent.replace(regex, '');
      } catch (error) {
        console.error(`Error removing section ${sectionId}:`, error);
      }
    } else if (section.startMarker && section.endMarker) {
      // Use start and end markers
      const startPattern = new RegExp(this.escapeRegex(section.startMarker), 'g');
      const endPattern = new RegExp(this.escapeRegex(section.endMarker), 'g');
      
      let startIndex = this.modifiedContent.search(startPattern);
      if (startIndex !== -1) {
        let endIndex = this.modifiedContent.indexOf(section.endMarker, startIndex);
        if (endIndex !== -1) {
          endIndex += section.endMarker.length;
          this.modifiedContent = 
            this.modifiedContent.slice(0, startIndex) + 
            this.modifiedContent.slice(endIndex);
        }
      }
    } else if (section.startMarker) {
      // Remove from start marker to next section or end of document
      const startPattern = new RegExp(this.escapeRegex(section.startMarker), 'g');
      const matches = [...this.modifiedContent.matchAll(startPattern)];
      
      for (const match of matches) {
        const startIndex = match.index;
        // Find next section or end of document
        const nextSectionPattern = /\\cvsection\{|\\(?:begin|end)\{document\}|\\csection\{/g;
        let endIndex = this.modifiedContent.length;
        
        const nextMatch = [...this.modifiedContent.slice(startIndex + match[0].length).matchAll(nextSectionPattern)];
        if (nextMatch.length > 0) {
          endIndex = startIndex + match[0].length + nextMatch[0].index;
        }
        
        this.modifiedContent = 
          this.modifiedContent.slice(0, startIndex) + 
          this.modifiedContent.slice(endIndex);
        break; // Only remove first occurrence
      }
    }

    return this;
  }

  /**
   * Replace single placeholder
   * @param {string} placeholderName - Placeholder name (e.g., "FULL_NAME" or "\\PLACEHOLDERNAME")
   * @param {string} value - Value to replace with
   * @returns {this} For method chaining
   */
  replacePlaceholder(placeholderName, value) {
    // Escape LaTeX special characters in value
    const escapedValue = this.escapeLatex(value);
    
    // Try different placeholder formats
    const patterns = [
      new RegExp(this.escapeRegex(placeholderName), 'g'), // Exact match
      new RegExp(this.escapeRegex(placeholderName.replace(/\\/g, '')), 'g'), // Without backslash
      new RegExp(`\\{${this.escapeRegex(placeholderName)}\\}`, 'g'), // {PLACEHOLDER}
      new RegExp(`\\\\${this.escapeRegex(placeholderName)}`, 'g'), // \PLACEHOLDER
    ];

    for (const pattern of patterns) {
      if (pattern.test(this.modifiedContent)) {
        this.modifiedContent = this.modifiedContent.replace(pattern, escapedValue);
        return this;
      }
    }

    // If not found, try as LaTeX command argument
    const commandPattern = new RegExp(`(\\\\[a-zA-Z]+)\\{${this.escapeRegex(placeholderName)}\\}`, 'g');
    if (commandPattern.test(this.modifiedContent)) {
      this.modifiedContent = this.modifiedContent.replace(commandPattern, `$1{${escapedValue}}`);
      return this;
    }

    console.warn(`Placeholder '${placeholderName}' not found in LaTeX content`);
    return this;
  }

  /**
   * Replace all placeholders from a map
   * @param {Object} placeholderMap - Map of placeholder name -> value
   * @returns {this} For method chaining
   */
  replaceAllPlaceholders(placeholderMap) {
    for (const [placeholderName, value] of Object.entries(placeholderMap)) {
      this.replacePlaceholder(placeholderName, value);
    }
    return this;
  }

  /**
   * Apply custom color
   * @param {string} colorName - Color name (e.g., "primary", "accent")
   * @param {string} hexValue - Hex color value (e.g., "#3b82f6")
   * @returns {this} For method chaining
   */
  applyCustomColor(colorName, hexValue) {
    if (!this.config.features?.supportsCustomColors) {
      console.warn(`Template ${this.templateId} does not support custom colors`);
      return this;
    }

    // Convert hex to RGB
    const rgb = this.hexToRgb(hexValue);
    if (!rgb) {
      console.warn(`Invalid hex color: ${hexValue}`);
      return this;
    }

    // Insert color definition in preamble
    const colorDef = `\\definecolor{${colorName}}{RGB}{${rgb.r},${rgb.g},${rgb.b}}\n`;
    const colorlet = `\\colorlet{${colorName}}{${colorName}}\n`;
    
    const preambleEnd = this.modifiedContent.indexOf('\\begin{document}');
    if (preambleEnd !== -1) {
      this.modifiedContent = 
        this.modifiedContent.slice(0, preambleEnd) + 
        colorDef + colorlet + 
        this.modifiedContent.slice(preambleEnd);
    }

    return this;
  }

  /**
   * Inject content into preamble
   * @param {string} content - Content to inject
   * @returns {this} For method chaining
   */
  injectIntoPreamble(content) {
    if (!this.config.preambleInsertPoint) {
      return this;
    }

    try {
      const regex = new RegExp(this.config.preambleInsertPoint);
      const match = this.modifiedContent.match(regex);
      if (match && match.index !== undefined) {
        const insertIndex = match.index;
        this.modifiedContent = 
          this.modifiedContent.slice(0, insertIndex) + 
          content + '\n' + 
          this.modifiedContent.slice(insertIndex);
      }
    } catch (error) {
      console.error('Error injecting into preamble:', error);
    }

    return this;
  }

  /**
   * Inject content into document
   * @param {string} content - Content to inject
   * @returns {this} For method chaining
   */
  injectIntoDocument(content) {
    if (!this.config.documentInsertPoint) {
      return this;
    }

    try {
      const regex = new RegExp(this.config.documentInsertPoint);
      const match = this.modifiedContent.match(regex);
      if (match && match.index !== undefined) {
        const insertIndex = match.index + match[0].length;
        this.modifiedContent = 
          this.modifiedContent.slice(0, insertIndex) + 
          '\n' + content + '\n' + 
          this.modifiedContent.slice(insertIndex);
      }
    } catch (error) {
      console.error('Error injecting into document:', error);
    }

    return this;
  }

  /**
   * Extract all placeholders from current .tex content
   * @returns {Object} Map of placeholder name -> current value
   */
  extractPlaceholders() {
    const placeholders = {};
    
    // Pattern 1: ALL_CAPS_WITH_UNDERSCORES (standalone or in braces)
    const pattern1 = /\{([A-Z_]+)\}/g;
    let match;
    while ((match = pattern1.exec(this.modifiedContent)) !== null) {
      const placeholder = match[1];
      if (!placeholders[placeholder]) {
        // Extract value from surrounding context
        const value = this.extractPlaceholderValue(placeholder);
        placeholders[placeholder] = value || '';
      }
    }

    // Pattern 2: \PLACEHOLDERNAME format
    const pattern2 = /\\([A-Z]+PLACEHOLDER[A-Z_]*)/g;
    while ((match = pattern2.exec(this.modifiedContent)) !== null) {
      const placeholder = match[1];
      if (!placeholders[placeholder]) {
        const value = this.extractPlaceholderValue(placeholder);
        placeholders[placeholder] = value || '';
      }
    }

    // Pattern 3: Commands with placeholder arguments like \name{PLACEHOLDER}
    const pattern3 = /\\([a-zA-Z]+)\{([A-Z_]+)\}/g;
    while ((match = pattern3.exec(this.modifiedContent)) !== null) {
      const placeholder = match[2];
      if (placeholder.length > 3 && !placeholders[placeholder]) {
        const value = this.extractPlaceholderValue(placeholder);
        placeholders[placeholder] = value || '';
      }
    }

    return placeholders;
  }

  /**
   * Extract value for a placeholder (helper method)
   * @param {string} placeholder - Placeholder name
   * @returns {string} Extracted value
   */
  extractPlaceholderValue(placeholder) {
    // Try to find the placeholder and extract its value
    const patterns = [
      new RegExp(`\\{${this.escapeRegex(placeholder)}\\}`, 'g'),
      new RegExp(`\\\\${this.escapeRegex(placeholder)}`, 'g'),
      new RegExp(`(\\\\[a-zA-Z]+)\\{${this.escapeRegex(placeholder)}\\}`, 'g'),
    ];

    for (const pattern of patterns) {
      const match = this.modifiedContent.match(pattern);
      if (match) {
        // For now, return empty string - actual value extraction would require parsing LaTeX
        return '';
      }
    }

    return '';
  }

  /**
   * Extract sections from current .tex content
   * @returns {Array} Array of section objects with id, label, and content
   */
  extractSections() {
    const sections = [];
    
    if (!this.config.sections) {
      return sections;
    }

    for (const [sectionId, sectionConfig] of Object.entries(this.config.sections)) {
      if (sectionConfig.pattern) {
        try {
          const regex = new RegExp(sectionConfig.pattern, 'g');
          const match = this.modifiedContent.match(regex);
          if (match) {
            sections.push({
              id: sectionId,
              label: sectionConfig.label,
              exists: true,
              content: match[0]
            });
          } else {
            sections.push({
              id: sectionId,
              label: sectionConfig.label,
              exists: false
            });
          }
        } catch (error) {
          console.error(`Error extracting section ${sectionId}:`, error);
        }
      }
    }

    return sections;
  }

  /**
   * Get modified LaTeX content
   * @returns {string} Final modified .tex content
   */
  getModifiedTex() {
    return this.modifiedContent;
  }

  /**
   * Escape LaTeX special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeLatex(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\$/g, '\\$')
      .replace(/%/g, '\\%')
      .replace(/&/g, '\\&')
      .replace(/#/g, '\\#')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/_/g, '\\_')
      .replace(/~/g, '\\textasciitilde{}');
  }

  /**
   * Escape regex special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Convert hex color to RGB
   * @param {string} hex - Hex color (e.g., "#3b82f6")
   * @returns {Object|null} {r, g, b} or null if invalid
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

export default GenericLatexCustomizer;

