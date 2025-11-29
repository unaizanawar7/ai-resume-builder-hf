# Template Configuration Guide

This guide explains how to create and configure template JSON files for the template-agnostic customization system.

## Overview

Each LaTeX template requires a JSON configuration file that defines:
- Available color schemes and how to apply them
- Available font options
- Sections that can be toggled
- Placeholders that can be edited
- Template-specific features and capabilities

## Configuration File Structure

### Basic Structure

```json
{
  "templateId": "template-id",
  "version": "1.0.0",
  "metadata": { ... },
  "colorSchemes": { ... },
  "fonts": { ... },
  "sections": { ... },
  "placeholders": { ... },
  "preambleInsertPoint": "...",
  "documentInsertPoint": "...",
  "engine": "pdflatex|xelatex|lualatex",
  "features": { ... }
}
```

## Required Fields

### templateId
- **Type**: String
- **Required**: Yes
- **Description**: Unique identifier for the template (must match template ID in metadata.json)
- **Example**: `"maltacv"`

### version
- **Type**: String
- **Required**: Yes
- **Description**: Configuration version
- **Example**: `"1.0.0"`

### metadata
- **Type**: Object
- **Required**: Yes
- **Fields**:
  - `name`: Display name of the template
  - `description`: Template description
  - `mainFile`: Relative path to the main .tex file (from templates/store/)

### features
- **Type**: Object
- **Required**: Yes
- **Fields**:
  - `supportsColorSchemes`: Boolean - Whether template supports color schemes
  - `supportsFonts`: Boolean - Whether template supports font changes
  - `supportsSectionToggle`: Boolean - Whether sections can be toggled
  - `supportsCustomColors`: Boolean - Whether custom colors can be applied

## Optional Fields

### colorSchemes
- **Type**: Object
- **Required**: No (only if `supportsColorSchemes` is true)
- **Structure**: 
  ```json
  {
    "schemeName": {
      "label": "Display Name",
      "command": "LaTeX command to apply",
      "type": "predefined|custom"
    }
  }
  ```
- **Example**:
  ```json
  {
    "indigo": {
      "label": "Indigo",
      "command": "\\setcolorscheme{indigo}",
      "type": "predefined"
    }
  }
  ```

### fonts
- **Type**: Object
- **Required**: No (only if `supportsFonts` is true)
- **Structure**:
  ```json
  {
    "fontName": {
      "label": "Display Name",
      "packages": ["package1", "package2"],
      "commands": "LaTeX commands to apply"
    }
  }
  ```
- **Example**:
  ```json
  {
    "helvetica": {
      "label": "Helvetica",
      "packages": [],
      "commands": "\\usepackage{helvet}\\renewcommand{\\familydefault}{\\sfdefault}"
    }
  }
  ```

### sections
- **Type**: Object
- **Required**: No (only if `supportsSectionToggle` is true)
- **Structure**:
  ```json
  {
    "sectionId": {
      "label": "Display Name",
      "pattern": "regex pattern to find section",
      "startMarker": "LaTeX command that starts section",
      "endMarker": "LaTeX command that ends section (optional)",
      "removable": true|false
    }
  }
  ```
- **Example**:
  ```json
  {
    "experience": {
      "label": "Experience",
      "pattern": "\\\\cvsection\\{Experience\\}[\\s\\S]*?(?=\\\\cvsection|\\\\end\\{document\\})",
      "startMarker": "\\\\cvsection\\{Experience\\}",
      "removable": true
    }
  }
  ```

### placeholders
- **Type**: Object
- **Required**: No
- **Structure**:
  ```json
  {
    "PLACEHOLDER_NAME": {
      "label": "Display Label",
      "type": "text|textarea|email|phone|url|date",
      "default": "default value"
    }
  }
  ```
- **Example**:
  ```json
  {
    "FULL_NAME": {
      "label": "Full Name",
      "type": "text",
      "default": ""
    },
    "EMAIL": {
      "label": "Email",
      "type": "email",
      "default": ""
    }
  }
  ```

### preambleInsertPoint
- **Type**: String (regex pattern)
- **Required**: No
- **Description**: Regex pattern indicating where to insert preamble commands
- **Example**: `"\\\\begin\\{document\\}"`

### documentInsertPoint
- **Type**: String (regex pattern)
- **Required**: No
- **Description**: Regex pattern indicating where to insert document content
- **Example**: `"\\\\begin\\{document\\}"`

### engine
- **Type**: String
- **Required**: No
- **Values**: `"pdflatex"`, `"xelatex"`, `"lualatex"`
- **Default**: `"pdflatex"`

## Common Patterns

### Placeholder Formats

Templates use different placeholder formats:

1. **ALL_CAPS_WITH_UNDERSCORES**:**
   - Example: `FULL_NAME`, `EMAIL`, `PHONE_NUMBER`
   - Pattern: `\{FULL_NAME\}` or `FULL_NAME`

2. **LaTeX Command Format:**
   - Example: `\PLACEHOLDERNAME`, `\PLACEHOLDERTAGLINE`
   - Pattern: `\\PLACEHOLDERNAME`

3. **Command Arguments:**
   - Example: `\name{PLACEHOLDER}`
   - Pattern: `\\name\{PLACEHOLDER\}`

### Section Patterns

Common section patterns:

1. **cvsection format:**
   ```regex
   \\\\cvsection\\{SectionName\\}[\\s\\S]*?(?=\\\\cvsection|\\\\end\\{document\\})
   ```

2. **csection format:**
   ```regex
   \\\\csection\\{SECTION\\}[\\s\\S]*?(?=\\\\csection|\\\\end\\{document\\})
   ```

3. **Environment format:**
   ```regex
   \\\\begin\\{sectionname\\}[\\s\\S]*?\\\\end\\{sectionname\\}
   ```

## Examples

### MAltaCV Template

```json
{
  "templateId": "maltacv",
  "version": "1.0.0",
  "metadata": {
    "name": "MAltaCV",
    "description": "Modern two-column CV template",
    "mainFile": "cv.tex"
  },
  "colorSchemes": {
    "indigo": {
      "label": "Indigo",
      "command": "\\setcolorscheme{indigo}",
      "type": "predefined"
    }
  },
  "fonts": {
    "default": {
      "label": "Default",
      "packages": ["tgheros"],
      "commands": "\\usepackage{tgheros}\\renewcommand*\\familydefault{\\sfdefault}"
    }
  },
  "sections": {
    "skills": {
      "label": "Skills",
      "pattern": "\\\\cvsection\\{Skills\\}[\\s\\S]*?(?=\\\\cvsection|\\\\end\\{document\\})",
      "startMarker": "\\\\cvsection\\{Skills\\}",
      "removable": true
    }
  },
  "placeholders": {
    "FULL_NAME": {
      "label": "Full Name",
      "type": "text",
      "default": ""
    }
  },
  "engine": "xelatex",
  "features": {
    "supportsColorSchemes": true,
    "supportsFonts": true,
    "supportsSectionToggle": true,
    "supportsCustomColors": true
  }
}
```

## Validation

The configuration file is automatically validated when loaded. Common validation errors:

1. **Missing required fields**: Ensure all required fields are present
2. **Invalid regex patterns**: Test your regex patterns before adding them
3. **Template ID mismatch**: Ensure `templateId` matches the template ID in metadata.json
4. **Invalid feature flags**: Feature flags must be boolean values

## Best Practices

1. **Test regex patterns**: Use online regex testers to verify your patterns work correctly
2. **Escape special characters**: Properly escape LaTeX and regex special characters
3. **Use descriptive labels**: Make placeholder and section labels user-friendly
4. **Document custom commands**: If using custom LaTeX commands, document them
5. **Version your configs**: Update version number when making changes
6. **Handle edge cases**: Consider templates with no color schemes, fonts, etc.

## Troubleshooting

### Template not detected
- Ensure config file is named `{templateId}.config.json`
- Verify templateId matches metadata.json
- Check file is in `backend/config/templates/` directory

### Placeholders not extracted
- Verify placeholder format matches template's actual format
- Check regex patterns are correct
- Ensure placeholders are in the config's `placeholders` object

### Sections not removable
- Verify `removable: true` is set
- Check regex pattern matches actual section structure
- Test pattern with sample LaTeX content

### Color scheme not applying
- Verify command syntax is correct
- Check if template supports color schemes
- Ensure command is inserted at correct location



