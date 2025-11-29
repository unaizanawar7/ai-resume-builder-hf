# How to Add Your Own Thumbnails

## Quick Guide

### Step 1: Add Your Thumbnail Files

1. Place your thumbnail image files in: `frontend/src/assets/`
   - Supported formats: `.svg`, `.png`, `.jpg`, `.jpeg`
   - Recommended size: 800x480 pixels (5:3 aspect ratio)
   - Example names: `my-custom-preview.png`, `template-1.jpg`, etc.

### Step 2: Import Your Thumbnails in App.jsx

Open `frontend/src/App.jsx` and add import statements at the top (around line 20-22):

```javascript
import myCustomPreview from './assets/my-custom-preview.png';
import anotherPreview from './assets/another-preview.jpg';
```

### Step 3: Add Your Layout to the Layouts Array

Find the `layouts` array (around line 1432) and add your new layout:

```javascript
const layouts = [
  { 
    name: 'Customised Curve CV', 
    desc: 'Light green & maroon accents with a clean horizontal header',
    preview: curvePreview 
  },
  { 
    name: 'AltaCV', 
    desc: 'Two-column layout with bold headline sidebar styling',
    preview: altacvPreview 
  },
  { 
    name: 'Simple Hipster CV', 
    desc: 'Dark sidebar with minimalist content emphasis',
    preview: hipsterPreview 
  },
  // ADD YOUR NEW LAYOUT HERE:
  { 
    name: 'My Custom Layout',  // Change this to your layout name
    desc: 'Description of your layout',  // Add a description
    preview: myCustomPreview  // Use the imported variable name
  },
];
```

### Step 4: Make Sure Your Layout Exists in Backend

Your layout name must match a template in `backend/templates/store/`. Check the `metadata.json` file to see available templates.

## Example: Adding a New Layout

Let's say you want to add a layout called "Modern Professional":

1. **Add thumbnail file:**
   - Save as: `frontend/src/assets/modern-professional-preview.png`

2. **Add import (line ~22):**
   ```javascript
   import modernProfessionalPreview from './assets/modern-professional-preview.png';
   ```

3. **Add to layouts array (line ~1448):**
   ```javascript
   { 
     name: 'Modern Professional', 
     desc: 'Clean and modern design with professional styling',
     preview: modernProfessionalPreview 
   },
   ```

4. **Verify template exists:**
   - Check that "Modern Professional" template exists in `backend/templates/store/`

## Tips

- **Image Size:** Keep thumbnails under 500KB for fast loading
- **Aspect Ratio:** Use 5:3 ratio (e.g., 800x480, 1000x600) for best display
- **File Names:** Use lowercase with hyphens (e.g., `my-layout-preview.png`)
- **Format:** SVG is best for scalability, PNG for photos, JPG for smaller file sizes

## Troubleshooting

- **Image not showing?** Check the file path and import statement
- **Layout not working?** Make sure the layout name matches a template in the backend
- **Build errors?** Ensure the file extension matches (`.svg`, `.png`, etc.)


