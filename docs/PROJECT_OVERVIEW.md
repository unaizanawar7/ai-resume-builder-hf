# AI Resume Builder - Complete Project Documentation

## 📋 Project Overview

An intelligent resume building platform that helps users create, customize, and optimize their resumes using AI technology.

## 🎯 Core Features

### 1. **Resume Creation**
- Manual entry of information
- Import existing resume (PDF/DOCX parsing)
- AI-powered information extraction

### 2. **Layout Selection**
- Multiple professional templates (inspired by Overleaf's CurVe and similar)
- AI recommendations based on user profile
- User can override AI suggestions

### 3. **AI Resume Generation**
- Generates polished resume content
- Optimizes formatting and wording
- Maintains user's authentic voice

### 4. **Interactive Editing**
- Real-time preview
- Drag-and-drop section reordering
- Inline text editing

### 5. **AI Career Coach**
- Chatbot interface for personalized advice
- Tailored recommendations based on target job
- Story development for unique personal branding

### 6. **Export Options**
- PDF download
- DOCX download
- ATS-friendly formats

## 🏗️ System Architecture

### **Frontend (React + TypeScript)**
```
- Landing Page
- Resume Builder Interface
  ├── Information Entry Form
  ├── File Upload Component
  ├── Layout Selector
  ├── Resume Editor
  └── Preview Panel
- AI Chat Interface
- Export Manager
```

### **Backend (Node.js + Express)**
```
- REST API Endpoints
- AI Integration Layer
  ├── Resume Parser (for imports)
  ├── Content Generator
  ├── Layout Recommender
  └── Career Chatbot
- PDF/DOCX Generator
- File Storage
```

### **AI Components**
```
- Claude API (Anthropic) - Main AI engine
- Document Parsing (mammoth.js for DOCX, pdf-parse for PDF)
- Content Generation Prompts
- Conversational AI for career advice
```

## 📊 Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - API calls
- **React DnD** - Drag and drop
- **React PDF** - Preview generation

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Multer** - File uploads
- **PDFKit** - PDF generation
- **Mammoth.js** - DOCX parsing
- **PDF-parse** - PDF parsing
- **Anthropic SDK** - AI integration

### Database (Optional for MVP)
- **Local Storage** for initial version
- Can upgrade to MongoDB/PostgreSQL later

## 🔄 User Flow

### Step 1: Landing & Onboarding
```
User visits → Welcome screen → "Create Resume" button
```

### Step 2: Information Gathering
```
Two options:
A) Manual Entry
   ├── Personal Info
   ├── Work Experience
   ├── Education
   ├── Skills
   └── Additional Sections
   
B) Import Resume
   ├── Upload file (PDF/DOCX)
   ├── AI extracts information
   └── User reviews & edits extracted data
```

### Step 3: Layout Selection
```
AI analyzes user profile
  ↓
Recommends 3 layouts
  ↓
User chooses or requests alternatives
```

### Step 4: AI Generation
```
AI generates resume content
  ↓
Applies chosen layout
  ↓
Displays preview
```

### Step 5: Interactive Editing
```
User can:
- Edit any text inline
- Reorder sections
- Add/remove sections
- Adjust formatting
- Request AI improvements
```

### Step 6: AI Career Chat
```
Chatbot opens
  ↓
Asks about target job/industry
  ↓
Provides tailored advice:
- Resume improvements
- Career trajectory
- Skill gaps
- Unique story development
- Interview preparation
```

### Step 7: Export
```
User satisfied → Export as PDF/DOCX
```

## 🤖 AI Prompt Engineering

### Resume Parser Prompt
```
"Extract the following information from this resume:
- Personal Information (name, email, phone, location)
- Work Experience (company, title, dates, responsibilities)
- Education (institution, degree, dates, GPA if present)
- Skills (technical, soft skills, languages)
- Certifications
- Projects
- Other relevant sections

Format as JSON with clear structure."
```

### Layout Recommender Prompt
```
"Based on this user profile:
- Experience level: [X years]
- Industry: [Industry]
- Target role: [Role]
- Key strengths: [Skills]

Recommend the best resume layout from:
1. Classic Professional (Traditional, ATS-friendly)
2. Modern Creative (Clean, contemporary design)
3. Technical Focused (Emphasizes skills and projects)
4. Executive (Leadership-oriented)
5. Academic (Research and publications focus)

Explain why this layout suits them."
```

### Content Generator Prompt
```
"Create professional resume content with these guidelines:
- Use action verbs
- Quantify achievements where possible
- Maintain authentic voice
- Tailor to [target industry/role]
- Keep bullet points concise (1-2 lines)
- Highlight transferable skills
- Ensure ATS compatibility

User Information:
[Insert extracted/entered data]

Target Role: [Role]
Industry: [Industry]"
```

### Career Coach Prompt
```
"You are an expert career coach helping this user:

Profile:
[User resume data]

Target: [Job/Industry]

Provide personalized advice that:
1. Identifies unique strengths and story angles
2. Suggests resume improvements
3. Highlights relevant experiences
4. Recommends skill development
5. Helps craft compelling narratives
6. Prepares for interviews

Be encouraging, specific, and actionable. Help them stand out authentically."
```

## 📁 Project Structure

```
ai-resume-builder/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── ResumeBuilder/
│   │   │   │   ├── InformationForm.tsx
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   ├── LayoutSelector.tsx
│   │   │   │   ├── ResumeEditor.tsx
│   │   │   │   └── PreviewPanel.tsx
│   │   │   ├── AIChat/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   └── MessageBubble.tsx
│   │   │   └── Export/
│   │   │       └── ExportOptions.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── resume.types.ts
│   │   ├── styles/
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── resume.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   └── export.routes.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts
│   │   │   ├── parser.service.ts
│   │   │   ├── generator.service.ts
│   │   │   └── export.service.ts
│   │   ├── utils/
│   │   └── server.ts
│   ├── uploads/
│   └── package.json
└── docs/
    └── PROJECT_OVERVIEW.md
```

## 🚀 Implementation Plan

### Phase 1: Setup & Basic UI (Days 1-2)
- Initialize React frontend with Vite
- Set up Express backend
- Create basic landing page
- Implement manual information form

### Phase 2: File Upload & Parsing (Days 3-4)
- Add file upload functionality
- Integrate document parsing
- Connect to AI for information extraction
- Display extracted data for review

### Phase 3: Layout System (Days 5-6)
- Create 3-5 resume templates
- Implement layout rendering engine
- Add AI layout recommendation
- Allow user selection override

### Phase 4: AI Generation (Days 7-8)
- Integrate Claude API
- Implement content generation
- Create resume preview component
- Add real-time generation

### Phase 5: Editing Interface (Days 9-10)
- Build interactive editor
- Add inline editing
- Implement drag-and-drop
- Section management

### Phase 6: AI Chat (Days 11-12)
- Create chat interface
- Implement conversational AI
- Add context awareness
- Career advice system

### Phase 7: Export & Polish (Days 13-14)
- PDF generation
- DOCX export
- Final UI polish
- Testing & bug fixes

## 🔐 Security Considerations

1. **API Key Management**: Store Anthropic API key in environment variables
2. **File Validation**: Verify uploaded files are legitimate documents
3. **Rate Limiting**: Prevent API abuse
4. **Data Privacy**: Don't store sensitive information permanently (MVP)
5. **Input Sanitization**: Clean all user inputs

## 💡 Future Enhancements

- User accounts and saved resumes
- Multiple resume versions
- Job application tracking
- Cover letter generation
- LinkedIn profile optimization
- Interview preparation tools
- Industry-specific templates
- Collaboration features
- Analytics dashboard

## 📝 Notes

- Start with no login (as requested) - use browser localStorage
- Focus on making AI responses highly personalized
- Ensure each user's story feels unique and authentic
- Prioritize ATS-friendly formats
- Keep UI clean and intuitive
- Make the experience feel magical with smooth AI interactions

---

**Ready to build something amazing! 🚀**
