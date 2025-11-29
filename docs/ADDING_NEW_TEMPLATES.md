# Adding New Templates Guide

This guide explains how to add a new LaTeX template to the system using the template-agnostic customization system.

## Overview

Adding a new template requires:
1. Adding template files to the templates directory
2. Creating a template configuration JSON file
3. Adding template metadata (optional, for discovery)

## Step-by-Step Process

### Step 1: Add Template Files

1. Place your template files in `backend/templates/store/`
2. Ensure all required files are included (.tex, .cls, .sty, images, etc.)
3. Note the main .tex file name

### Step 2: Create Template Configuration File

1. Create a new file: `backend/config/templates/{templateId}.config.json`
2. Use the template ID as the filename (e.g., `my-template.config.json`)
3. Fill in the configuration following the structure in `TEMPLATE_CONFIG_GUIDE.md`

### Step 3: Identify Template Characteristics

Before creating the config, analyze your template:

#### A. Placeholder Format
- Scan the .tex file for placeholders
- Common formats:
  - `FULL_NAME`, `EMAIL` (all caps)
  - `\PLACEHOLDERNAME` (LaTeX command)
  - `\name{PLACEHOLDER}` (command argument)

#### B. Color Scheme Support
- Check if template has color scheme commands
- Look for commands like `\setcolorscheme{}`, `\definecolor{}`, etc.
- List all available color schemes

#### C. Font Support
- Check if template allows font changes
- Identify font packages used
- Note font switching commands

#### D. Section Structure
- Identify section markers (e.g., `\cvsection{}`, `\csection{}`)
- Determine section boundaries
- Note which sections can be removed

#### E. LaTeX Engine
- Check template documentation
- XeLaTeX: Usually for fonts, Unicode support
- pdfLaTeX: Standard LaTeX compilation
- LuaLaTeX: Advanced scripting

### Step 4: Write Configuration File

Example for a new template:

```json
{
  "templateId": "my-new-template",
  "version": "1.0.0",
  "metadata": {
    "name": "My New Template",
    "description": "Description of the template",
    "mainFile": "main.tex"
  },
  "colorSchemes": {
    "blue": {
      "label": "Blue",
      "command": "\\setcolor{blue}",
      "type": "predefined"
    }
  },
  "fonts": {
    "default": {
      "label": "Default",
      "packages": [],
      "commands": ""
    }
  },
  "sections": {
    "experience": {
      "label": "Experience",
      "pattern": "\\\\section\\{Experience\\}[\\s\\S]*?(?=\\\\section|\\\\end\\{document\\})",
      "startMarker": "\\\\section\\{Experience\\}",
      "removable": true
    }
  },
  "placeholders": {
    "NAME": {
      "label": "Name",
      "type": "text",
      "default": ""
    },
    "EMAIL": {
      "label": "Email",
      "type": "email",
      "default": ""
    }
  },
  "preambleInsertPoint": "\\\\begin\\{document\\}",
  "documentInsertPoint": "\\\\begin\\{document\\}",
  "engine": "pdflatex",
  "features": {
    "supportsColorSchemes": true,
    "supportsFonts": false,
    "supportsSectionToggle": true,
    "supportsCustomColors": false
  }
}
```

### Step 5: Test Configuration

1. **Validate Config:**
   - Start the backend server
   - The config will be validated on first load
   - Check console for validation errors

2. **Test Placeholder Extraction:**
   ```bash
   POST /api/resume/extract-placeholders
   {
     "templateId": "my-new-template"
   }
   ```

3. **Test Customization:**
   ```bash
   POST /api/resume/customize
   {
     "templateId": "my-new-template",
     "resumeData": { ... },
     "customizations": {
       "colorScheme": "blue",
       "enabledSections": { "experience": true },
       "editedContent": { "NAME": "Test Name" }
     }
   }
   ```

4. **Verify PDF Generation:**
   - Check that PDF is generated correctly
   - Verify customizations are applied
   - Test section removal
   - Test color scheme changes

### Step 6: Add to Metadata (Optional)

If you want the template to appear in template listings:

1. Edit `backend/templates/metadata.json`
2. Add entry:
   ```json
   {
     "id": "my-new-template",
     "name": "My New Template",
     "source": "custom",
     "type": "latex",
     "file": "main.tex",
     ...
   }
   ```

## Common Issues and Solutions

### Issue: Placeholders Not Found

**Problem**: Placeholders are not being extracted or replaced.

**Solutions**:
- Verify placeholder format in config matches actual format in .tex
- Check regex patterns are correct
- Ensure placeholders are listed in config's `placeholders` object
- Try different placeholder formats (with/without braces, with/without backslash)

### Issue: Sections Not Removable

**Problem**: Sections cannot be toggled off.

**Solutions**:
- Verify `removable: true` is set
- Check regex pattern matches actual section structure
- Test pattern with sample LaTeX content
- Ensure `startMarker` is correct
- Add `endMarker` if section has explicit end

### Issue: Color Scheme Not Applying

**Problem**: Color scheme changes don't appear in PDF.

**Solutions**:
- Verify command syntax is correct
- Check if command needs to be in preamble vs document
- Ensure template actually supports color schemes
- Test command manually in LaTeX file

### Issue: Font Not Changing

**Problem**: Font selection doesn't change the output.

**Solutions**:
- Verify font packages are correct
- Check if template requires specific engine (XeLaTeX for some fonts)
- Ensure commands are inserted in correct location
- Test font commands manually

### Issue: LaTeX Compilation Errors

**Problem**: PDF generation fails with LaTeX errors.

**Solutions**:
- Check LaTeX engine is correct (pdflatex vs xelatex)
- Verify all required packages are available
- Check for syntax errors in modified LaTeX
- Review LaTeX compilation logs in temp directory

## Testing Checklist

- [ ] Config file validates without errors
- [ ] Placeholders are extracted correctly
- [ ] Placeholders can be edited and replaced
- [ ] Color schemes apply correctly (if supported)
- [ ] Fonts change correctly (if supported)
- [ ] Sections can be toggled on/off (if supported)
- [ ] Custom colors work (if supported)
- [ ] PDF generates without errors
- [ ] All customizations appear in final PDF
- [ ] Template works with existing resume data structure

## Advanced: Custom LaTeX Commands

If your template uses custom commands:

1. Document the command syntax
2. Add to config's command fields
3. Test thoroughly
4. Consider adding to template documentation

## Maintenance

- Update config version when making changes
- Document any template-specific quirks
- Keep config in sync with template updates
- Test after template file changes

## Getting Help

If you encounter issues:

1. Check `TEMPLATE_CONFIG_GUIDE.md` for configuration details
2. Review existing config files for examples
3. Check backend logs for validation errors
4. Test LaTeX compilation manually
5. Verify all file paths are correct



