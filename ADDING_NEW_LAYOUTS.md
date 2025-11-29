# Guide: Adding New Resume Layouts

## Overview
This guide explains how to add new resume template layouts to the AI Resume Builder.

## Steps to Add a New Layout

### 1. Add Template to Backend Metadata

Edit `backend/templates/metadata.json` and add a new entry:

```json
{
  "id": "your-template-id",
  "name": "Your Template Name",
  "source": "overleaf" or "custom",
  "type": "latex",
  "author": "Author Name",
  "description": "Brief description of the template",
  "category": ["modern", "professional"],
  "features": ["feature1", "feature2"],
  "difficulty": "easy" or "medium" or "hard",
  "thumbnails": {
    "small": "your-template-small.jpg",
    "large": "your-template-large.jpg"
  },
  "jobTypes": ["software-engineer", "general"],
  "years": ["entry", "mid", "senior"],
  "file": "your-template.tex"
}
```

### 2. Ensure Template File Exists

Make sure your `.tex` file exists in `backend/templates/store/` or the correct subdirectory.

### 3. Create Thumbnail Images

Create thumbnail images for your template:
- **Location**: `frontend/src/assets/`
- **Format**: JPEG or PNG
- **Recommended size**: 800x480 pixels (5:3 aspect ratio)
- **Naming**: Match the template name (e.g., `Your Template Name.jpeg`)

### 4. Update Frontend

Edit `frontend/src/App.jsx`:

1. **Import the thumbnail** (around line 20-23):
```javascript
import yourTemplatePreview from './assets/Your Template Name.jpeg';
```

2. **Add to layouts array** (around line 1435):
```javascript
const layouts = [
  // ... existing layouts ...
  { 
    name: 'Your Template Name', 
    desc: 'Brief description of the template',
    preview: yourTemplatePreview 
  },
];
```

### 5. Test the New Layout

1. Restart the backend server to load new metadata
2. Refresh the frontend
3. Navigate to layout selection step
4. Verify the new layout appears
5. Test selecting it and generating a PDF

## Current Templates

1. **Customised Curve CV** - Modern CV with light green and maroon accents
2. **AltaCV** - Two-column CV with red/gold accents
3. **Simple Hipster CV** - Sidebar layout with teal accents
4. **CV Template** - Professional CV with clean layout
5. **Infographics CV** - Modern CV with visual infographics (thumbnail needed)

## Notes

- Template names in frontend must match exactly with metadata.json
- Thumbnails are required for the layout to display properly
- The hover zoom feature will work automatically once thumbnails are added
- All templates must be LaTeX-based and compatible with pdflatex



