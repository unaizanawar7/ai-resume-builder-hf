/**
 * AI Service - Handles all AI operations using Google Gemini
 * 
 * This service manages:
 * - Resume parsing from uploaded files
 * - Layout recommendations based on user profile
 * - Resume content generation
 * - Career coaching chatbot
 * 
 * Using: Google Gemini 2.0 Flash Experimental
 */

import { callGemini } from './gemini-client.js';

/**
 * Helper function to call Google Gemini API
 * @deprecated Use callGemini from gemini-client.js directly
 */
async function callGeminiAI(prompt, maxTokens = 2000) {
  return await callGemini(prompt, { maxTokens });
}

/**
 * Parse resume text and extract structured information
 * @param {string} resumeText - Raw text from uploaded resume
 * @returns {Promise<Object>} Structured resume data
 */
export async function parseResume(resumeText) {
  console.log('🤖 AI: Parsing resume with Gemini...');
  
  const prompt = `You are an expert resume parser. Extract ALL information from the following resume and return it as valid JSON.

Resume text:
${resumeText}

Return ONLY valid JSON in this exact structure (fill in ALL data you can extract from the resume):
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "website": "",
    "github": ""
  },
  "summary": "",
  "experience": [
    {
      "company": "",
      "position": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "responsibilities": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "location": "",
      "graduationDate": "",
      "gpa": ""
    }
  ],
  "skills": {
    "technical": [],
    "soft": [],
    "languages": []
  },
  "certifications": [],
  "projects": [],
  "achievements": []
}

Return ONLY the JSON, no markdown, no explanation, just the raw JSON object.`;

  try {
    const response = await callGeminiAI(prompt, 3000);
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const parsedData = JSON.parse(jsonText);
    console.log('✅ AI: Resume parsed successfully');
    return parsedData;
  } catch (error) {
    console.error('❌ AI Error parsing resume:', error);
    // Return basic structure as fallback
    return createBasicStructure(resumeText);
  }
}

/**
 * Create basic structure when AI parsing fails
 * Enhanced fallback with comprehensive regex extraction
 */
function createBasicStructure(text) {
  console.log('⚠️ Using fallback parsing (AI unavailable)');
  
  // Split text into lines for easier parsing
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract contact information
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/);
  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin:)\s*([\w-]+)/i);
  const githubMatch = text.match(/(?:github\.com\/|github:)\s*([\w-]+)/i);
  const websiteMatch = text.match(/(https?:\/\/(?:www\.)?[\w.-]+\.\w+)/);
  
  // Extract name (usually in first few lines, often the longest capitalized text)
  let fullName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    // Name is often all caps or title case, longer than 5 chars, no special chars
    if (line.length > 5 && line.length < 50 && 
        /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(line)) {
      fullName = line;
      break;
    } else if (/^[A-Z\s]{10,50}$/.test(line)) {
      fullName = line;
      break;
    }
  }
  
  // Extract skills - look for common skill section headers
  const skills = { technical: [], soft: [], languages: [] };
  const skillSectionMatch = text.match(/(?:SKILLS?|TECHNICAL SKILLS?|CORE COMPETENCIES)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n[A-Z]{2,}|$)/i);
  if (skillSectionMatch) {
    const skillsText = skillSectionMatch[1];
    // Split by common separators
    const extractedSkills = skillsText
      .split(/[,•|·\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && s.length < 50);
    
    // Categorize skills
    const techKeywords = /javascript|python|java|react|node|sql|aws|docker|html|css|angular|vue|typescript|c\+\+|ruby|php|swift|kotlin|git|api|database/i;
    const languageKeywords = /english|spanish|french|german|mandarin|chinese|arabic|hindi|bengali|portuguese|urdu/i;
    
    extractedSkills.forEach(skill => {
      if (techKeywords.test(skill)) {
        skills.technical.push(skill);
      } else if (languageKeywords.test(skill)) {
        skills.languages.push(skill);
      } else {
        skills.soft.push(skill);
      }
    });
  }
  
  // Extract experience - look for date patterns and company names
  const experience = [];
  const expSectionMatch = text.match(/(?:EXPERIENCE|WORK HISTORY|EMPLOYMENT)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n(?:EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|$))/i);
  if (expSectionMatch) {
    const expText = expSectionMatch[1];
    // Look for date patterns like "2020 - 2022", "Jan 2020 - Present"
    const datePattern = /(\d{4}|\w{3,9}\s+\d{4})\s*[-–—]\s*(\d{4}|\w{3,9}\s+\d{4}|Present|Current)/gi;
    const dateMatches = [...expText.matchAll(datePattern)];
    
    dateMatches.forEach(match => {
      const contextStart = Math.max(0, match.index - 200);
      const contextEnd = Math.min(expText.length, match.index + 200);
      const context = expText.substring(contextStart, contextEnd);
      
      // Extract company and position from context
      const lines = context.split('\n').filter(l => l.trim());
      const position = lines.find(l => !datePattern.test(l) && l.length > 10 && l.length < 100) || '';
      
      experience.push({
        company: '',
        position: position.trim(),
        location: '',
        startDate: match[1],
        endDate: match[2],
        responsibilities: []
      });
    });
  }
  
  // Extract education - look for degree keywords
  const education = [];
  const eduSectionMatch = text.match(/(?:EDUCATION)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n(?:EXPERIENCE|SKILLS|PROJECTS|CERTIFICATIONS|$))/i);
  if (eduSectionMatch) {
    const eduText = eduSectionMatch[1];
    const degreePattern = /(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|MBA|Associate)[\s\w]*(?:in|of)?\s*([\w\s]+)/gi;
    const degreeMatches = [...eduText.matchAll(degreePattern)];
    
    degreeMatches.forEach(match => {
      const contextStart = Math.max(0, match.index - 100);
      const contextEnd = Math.min(eduText.length, match.index + 200);
      const context = eduText.substring(contextStart, contextEnd);
      
      // Look for graduation year
      const yearMatch = context.match(/\b(19|20)\d{2}\b/);
      
      education.push({
        institution: '',
        degree: match[0].trim(),
        field: match[2]?.trim() || '',
        location: '',
        graduationDate: yearMatch ? yearMatch[0] : '',
        gpa: ''
      });
    });
  }
  
  // Extract summary/objective
  let summary = '';
  const summaryMatch = text.match(/(?:SUMMARY|OBJECTIVE|PROFILE)[:\s]*([^\n]+(?:\n[^\n]+){0,3})/i);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }
  
  // Extract certifications
  const certifications = [];
  const certMatch = text.match(/(?:CERTIFICATIONS?|LICENSES?)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n[A-Z]{2,}|$)/i);
  if (certMatch) {
    certifications.push(...certMatch[1]
      .split(/\n|•|·/)
      .map(c => c.trim())
      .filter(c => c.length > 3 && c.length < 100));
  }
  
  // Extract projects
  const projects = [];
  const projectMatch = text.match(/(?:PROJECTS?)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n[A-Z]{2,}|$)/i);
  if (projectMatch) {
    projects.push(...projectMatch[1]
      .split(/\n(?=[A-Z])|•|·/)
      .map(p => p.trim())
      .filter(p => p.length > 10 && p.length < 200));
  }
  
  console.log('✅ Fallback parsing completed');
  
  return {
    personalInfo: {
      fullName: fullName,
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: '',
      linkedin: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : '',
      website: websiteMatch ? websiteMatch[1] : '',
      github: githubMatch ? `https://github.com/${githubMatch[1]}` : ''
    },
    summary: summary,
    experience: experience,
    education: education,
    skills: skills,
    certifications: certifications,
    projects: projects,
    achievements: []
  };
}

/**
 * Recommend the best resume layout based on user profile
 * @param {Object} resumeData - User's resume information
 * @param {string} targetRole - The job role user is targeting
 * @returns {Promise<Object>} Layout recommendation with reasoning
 */
export async function recommendLayout(resumeData, targetRole = '') {
  console.log('🤖 AI: Recommending layout with Gemini...');
  
  // Get available templates dynamically
  const templateService = (await import('./template.service.js')).default;
  const allTemplates = await templateService.getAllTemplates();
  
  const yearsOfExperience = calculateYearsOfExperience(resumeData.experience);
  const industry = inferIndustry(resumeData);
  
  // Build template list for AI
  const templateList = allTemplates.map((t, idx) => 
    `${idx + 1}. ${t.name} - ${t.description} (${t.category.join(', ')})`
  ).join('\n');
  
  // Build template list with job types for better matching
  const templateListWithJobTypes = allTemplates.map((t, idx) => {
    const jobTypes = t.jobTypes ? t.jobTypes.join(', ') : 'general';
    return `${idx + 1}. ${t.name} - ${t.description} (Job Types: ${jobTypes}, Categories: ${t.category.join(', ')})`;
  }).join('\n');

  const prompt = `You are a professional resume consultant. Recommend the BEST resume layout for this candidate.

CRITICAL: The TARGET ROLE is the PRIMARY and MOST IMPORTANT factor in your recommendation. Prioritize templates whose job types match the target role.

Candidate Profile:
- Target Role: ${targetRole || 'Not specified'} ⭐ PRIMARY FACTOR
- Years of Experience: ${yearsOfExperience}
- Industry: ${industry}
- Education: ${resumeData.education?.[0]?.degree || 'Not specified'}
- Technical Skills: ${resumeData.skills?.technical?.length || 0}

Available Layouts:
${templateListWithJobTypes}

Selection Criteria (in order of importance):
1. TARGET ROLE MATCH: Does the template's job types align with the target role? This is the PRIMARY factor.
2. Experience Level: Does the template suit the candidate's years of experience?
3. Industry Fit: Does the template match the candidate's industry?
4. Visual Style: Does the template's style match the role's expectations?

Return ONLY valid JSON in this exact format:
{
  "recommendedLayout": "exact template name from the list above",
  "reasoning": "2-3 sentences explaining how this layout matches the target role requirements and why it's the best fit",
  "alternativeLayouts": ["second best template name", "third best template name"],
  "confidenceScore": 0.85
}

IMPORTANT: 
- Use the EXACT template names from the list above
- Your reasoning MUST explain how the layout matches the target role
- Return ONLY the JSON object, no markdown, no explanation`;

  try {
    const response = await callGeminiAI(prompt, 500);
    
    // Extract JSON from response
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const recommendation = JSON.parse(jsonText);
    
    // Validate that recommended layout exists
    const recommendedTemplate = allTemplates.find(t => 
      t.name.toLowerCase() === recommendation.recommendedLayout.toLowerCase()
    );
    
    if (!recommendedTemplate) {
      console.warn('⚠️ AI recommended non-existent layout, using default');
      return getDefaultLayoutRecommendation(yearsOfExperience, industry, allTemplates, targetRole);
    }
    
    console.log('✅ AI: Layout recommended -', recommendation.recommendedLayout);
    return recommendation;
  } catch (error) {
    console.error('❌ AI Error recommending layout:', error);
    return getDefaultLayoutRecommendation(yearsOfExperience, industry, allTemplates, targetRole);
  }
}

/**
 * Default layout recommendation if AI fails
 */
function getDefaultLayoutRecommendation(years, industry, allTemplates, targetRole = '') {
  // Use first available template as default
  const defaultTemplate = allTemplates[0] || { name: 'Classic CV' };
  let layout = defaultTemplate.name;
  let reasoning = 'This professional layout works well for most industries.';
  
  // If target role is provided, prioritize templates matching the role
  if (targetRole) {
    const roleLower = targetRole.toLowerCase();
    const matchingTemplates = allTemplates.filter(t => {
      if (!t.jobTypes || !Array.isArray(t.jobTypes)) return false;
      return t.jobTypes.some(jt => {
        const jtLower = jt.toLowerCase();
        return jtLower.includes(roleLower) || roleLower.includes(jtLower) ||
               (roleLower.includes('engineer') && jtLower.includes('engineer')) ||
               (roleLower.includes('developer') && jtLower.includes('developer')) ||
               (roleLower.includes('designer') && jtLower.includes('designer')) ||
               (roleLower.includes('manager') && jtLower.includes('manager'));
      });
    });
    
    if (matchingTemplates.length > 0) {
      layout = matchingTemplates[0].name;
      reasoning = `This layout is well-suited for ${targetRole} positions based on template job type matching.`;
    }
  }
  
  // Find best match from available templates
  const techTemplates = allTemplates.filter(t => 
    t.jobTypes && t.jobTypes.some(jt => jt.includes('developer') || jt.includes('designer') || jt.includes('engineer'))
  );
  const professionalTemplates = allTemplates.filter(t => 
    t.jobTypes && t.jobTypes.some(jt => jt.includes('business') || jt.includes('professional') || jt.includes('manager'))
  );
  
  // Only use fallback if no target role match was found
  if (layout === defaultTemplate.name) {
    if (years < 2 && techTemplates.length > 0) {
      layout = techTemplates[0].name;
      reasoning = 'The modern layout helps early-career professionals present credentials clearly.';
    } else if (industry.includes('Tech') && techTemplates.length > 0) {
      layout = techTemplates[0].name;
      reasoning = 'This layout emphasizes your technical skills and projects.';
    } else if (professionalTemplates.length > 0) {
      layout = professionalTemplates[0].name;
      reasoning = 'This professional layout works well for your industry.';
    }
  }
  
  // Get alternative layouts
  const alternatives = allTemplates
    .filter(t => t.name !== layout)
    .slice(0, 2)
    .map(t => t.name);
  
  return {
    recommendedLayout: layout,
    reasoning: reasoning,
    alternativeLayouts: alternatives,
    confidenceScore: 0.75
  };
}

/**
 * Generate polished resume content from user data
 * @param {Object} resumeData - Raw resume information
 * @param {string} targetRole - Target job role
 * @param {string} targetIndustry - Target industry
 * @returns {Promise<Object>} Enhanced resume content
 */
export async function generateResumeContent(resumeData, targetRole = '', targetIndustry = '') {
  console.log('🤖 AI: Generating resume content with Gemini...');
  
  const prompt = `You are an expert resume writer specializing in ATS-optimized resumes.

Transform this resume into polished, professional content optimized for ${targetRole || 'their target role'} in ${targetIndustry || 'their industry'}.

Current Resume:
${JSON.stringify(resumeData, null, 2)}

Guidelines:
1. Start bullets with strong action verbs (Led, Developed, Implemented, Increased)
2. Quantify achievements with numbers and percentages
3. Focus on impact and results, not just tasks
4. Keep bullets concise (1-2 lines)
5. Use present tense for current role, past tense for previous
6. Create a compelling 2-3 sentence professional summary
7. Optimize for ATS with relevant keywords

Return the enhanced resume in the EXACT same JSON structure, but with improved content.
Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const response = await callGeminiAI(prompt, 4000);
    
    // Extract JSON from response
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const enhancedResume = JSON.parse(jsonText);
    console.log('✅ AI: Resume content generated successfully');
    return enhancedResume;
  } catch (error) {
    console.error('❌ AI Error generating content:', error);
    return enhanceResumeBasic(resumeData);
  }
}

/**
 * Basic enhancement if AI fails
 */
function enhanceResumeBasic(resumeData) {
  // Just return the original data with a generic summary if missing
  if (!resumeData.summary) {
    resumeData.summary = `Experienced professional with ${resumeData.experience?.length || 0} positions of expertise. Skilled in ${resumeData.skills?.technical?.slice(0, 3).join(', ') || 'various areas'}.`;
  }
  return resumeData;
}

/**
 * Career chatbot - Provides personalized career advice
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @param {Object} resumeData - User's resume data for context
 * @param {string} userMessage - User's current message
 * @returns {Promise<string>} AI's response
 */
export async function chatWithCareerCoach(conversationHistory, resumeData, userMessage) {
  console.log('🤖 AI: Career coach responding with Gemini...');
  
  const contextPrompt = resumeData 
    ? `\n\nCandidate's Resume Context:\n${JSON.stringify(resumeData, null, 2)}`
    : '';
  
  const prompt = `You are an expert career coach and resume consultant. Help the user with their career and resume questions. Be friendly, professional, and provide actionable advice.

Previous conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's Question: ${userMessage}${contextPrompt}

Provide a helpful, specific response focused on:
- Resume writing best practices
- Career development advice
- Interview preparation tips
- Professional development
- ATS optimization

CRITICAL: Keep your response SHORT and to the point. Maximum 2-3 sentences unless absolutely necessary. If you need to provide multiple tips, use brief bullet points. Be concise and actionable.`;

  try {
    const response = await callGeminiAI(prompt, 1000);
    
    console.log('✅ AI: Career coach responded');
    return response;
  } catch (error) {
    console.error('❌ AI Error in career chat:', error);
    
    // Simple fallback response when AI is unavailable
    return `I'm having trouble connecting to the AI service right now. This usually means the API key needs to be configured. 

In the meantime, here are some general career tips:
- Use strong action verbs in your resume (Led, Developed, Implemented)
- Quantify your achievements with numbers and metrics
- Tailor your resume to each job application
- Keep your LinkedIn profile updated
- Network actively in your industry

Please make sure your Gemini API key is properly configured, then try again!`;
  }
}

/**
 * Suggest improvements to specific sections of the resume
 * @param {Object} section - The resume section to improve
 * @param {string} sectionType - Type of section (experience, education, skills, etc.)
 * @returns {Promise<string>} Improvement suggestions
 */
export async function suggestSectionImprovements(section, sectionType) {
  console.log(`🤖 AI: Suggesting improvements for ${sectionType}...`);
  
  const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are a resume expert providing specific, actionable improvement suggestions.<|eot_id|>

<|start_header_id|>user<|end_header_id|>
Analyze this ${sectionType} section and provide specific improvements:

Current ${sectionType}:
${JSON.stringify(section, null, 2)}

Provide:
1. What's working well (be specific)
2. 3-5 concrete improvements (what to change and how)
3. Example of one improved version

Be encouraging but honest. Keep advice practical and tailored to this content.<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;

  try {
    const response = await callHuggingFace(prompt, 1000);
    console.log('✅ AI: Suggestions generated');
    return response || "Consider adding more specific metrics and achievements to strengthen this section.";
  } catch (error) {
    console.error('❌ AI Error suggesting improvements:', error);
    return "Consider adding more quantifiable achievements and using stronger action verbs to make this section more impactful.";
  }
}

// Helper functions

function calculateYearsOfExperience(experience) {
  if (!experience || experience.length === 0) return 0;
  
  let totalMonths = 0;
  experience.forEach(exp => {
    if (!exp.startDate) return; // Skip if no start date
    
    const start = new Date(exp.startDate);
    const end = (!exp.endDate || exp.endDate.toLowerCase() === 'present') 
      ? new Date() 
      : new Date(exp.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += months;
  });
  
  return Math.round(totalMonths / 12 * 10) / 10;
}

function inferIndustry(resumeData) {
  const allText = JSON.stringify(resumeData).toLowerCase();
  
  if (allText.includes('software') || allText.includes('developer') || allText.includes('engineer')) {
    return 'Technology/Software';
  } else if (allText.includes('marketing') || allText.includes('brand')) {
    return 'Marketing';
  } else if (allText.includes('finance') || allText.includes('accounting')) {
    return 'Finance';
  } else if (allText.includes('design') || allText.includes('creative')) {
    return 'Design/Creative';
  } else if (allText.includes('research') || allText.includes('phd')) {
    return 'Research/Academic';
  } else {
    return 'General/Multiple Industries';
  }
}

/**
 * Generate personalized interview questions based on resume
 * @param {Object} resumeData - User's resume data
 * @param {string} jobDescription - Optional job description
 * @returns {Promise<Array>} Array of interview questions
 */
export async function generateInterviewQuestions(resumeData, jobDescription = '') {
  console.log('🤖 AI: Generating personalized interview questions...');
  
  const jobContext = jobDescription 
    ? `\n\nTarget Job Description:\n${jobDescription.substring(0, 1000)}`
    : '';
  
  const prompt = `You are conducting a personalized interview to tailor a resume. Based on the candidate's resume data, generate 5-8 thoughtful, engaging questions.

Resume Data:
${JSON.stringify(resumeData, null, 2)}
${jobContext}

Generate questions that:
1. Dive deeper into specific experiences mentioned in their resume
2. Ask about quantifiable achievements and impact
3. Understand how they've applied their skills in real situations
4. Discover their career goals and motivations
5. Uncover what makes them unique as a candidate
6. Match terminology and requirements from the job description (if provided)

Return ONLY valid JSON array in this exact format:
[
  {
    "question": "What is your question here?",
    "type": "experience|achievements|skills|goals|personality",
    "followUp": "Optional suggested follow-up question if they give a short answer"
  }
]

Generate 5-8 questions. Make them conversational and natural, like a friendly interviewer would ask.
Return ONLY the JSON array, no markdown, no explanation.`;

  try {
    const response = await callGeminiAI(prompt, 2000);
    
    // Extract JSON from response
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const questions = JSON.parse(jsonText);
    console.log('✅ AI: Generated', questions.length, 'interview questions');
    return questions;
  } catch (error) {
    console.error('❌ AI Error generating questions:', error);
    return getDefaultInterviewQuestions(resumeData);
  }
}

/**
 * Generate tailored resume based on user's original resume, job description, and interview responses
 * @param {Object} resumeData - Original resume data
 * @param {string} jobDescription - Target job description
 * @param {Array} interviewResponses - User's responses to interview questions
 * @returns {Promise<Object>} Tailored resume data
 */
export async function generateTailoredResume(resumeData, jobDescription = '', interviewResponses = []) {
  console.log('🤖 AI: Generating tailored resume...');
  
  const hasInterviewData = interviewResponses && interviewResponses.length > 0;
  const hasJobDescription = jobDescription && jobDescription.trim().length > 0;
  
  let interviewSummary = '';
  if (hasInterviewData) {
    interviewSummary = interviewResponses
      .map((r, idx) => `Q${idx + 1}: ${r.question}\nA${idx + 1}: ${r.answer}`)
      .join('\n\n');
  }
  
  // Build prompt based on what data is available
  let contextInstructions = '';
  
  if (hasJobDescription && hasInterviewData) {
    contextInstructions = `Target Job Description:\n${jobDescription}\n\nInterview Insights (personal details from user):\n${interviewSummary}`;
  } else if (hasJobDescription && !hasInterviewData) {
    contextInstructions = `Target Job Description:\n${jobDescription}`;
  } else if (!hasJobDescription && hasInterviewData) {
    contextInstructions = `Interview Insights (personal details from user):\n${interviewSummary}`;
  } else {
    contextInstructions = `No additional context provided. Use your expertise to create the best possible resume based on the candidate's background.`;
  }
  
  const prompt = `You are an expert resume writer tasked with creating a highly tailored, ATS-optimized resume.

Original Resume Data:
${JSON.stringify(resumeData, null, 2)}

${contextInstructions}

Create a tailored resume that:
1. Uses ATS-friendly keywords from the job description (if provided)
2. Incorporates the candidate's authentic voice and specific details from interview responses (if provided)
3. Reorders and emphasizes experiences most relevant to the target role (if job description provided)
4. Adds personality and unique selling points from the interview (if provided)
5. Matches terminology and phrasing from the job description (if provided)
6. Keeps it professional but shows the candidate's authentic personality
7. Optimizes for ATS compatibility while maintaining readability
8. Quantifies achievements using details from both resume and interview (if provided)
${!hasJobDescription && !hasInterviewData ? '9. Use your intelligence to infer the best industry, role type, and highlight the candidate\'s strongest qualifications based on their experience and skills' : ''}

Return the tailored resume in the EXACT same JSON structure as the original, but with:
- Enhanced and personalized summary
- Tailored experience descriptions
- Optimized skills section
- Added achievements and personality traits
- Job-specific keywords integrated naturally (if job description provided)

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const response = await callGeminiAI(prompt, 4000);
    
    // Extract JSON from response
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const tailoredResume = JSON.parse(jsonText);
    console.log('✅ AI: Tailored resume generated successfully');
    return tailoredResume;
  } catch (error) {
    console.error('❌ AI Error generating tailored resume:', error);
    return resumeData; // Return original if AI fails
  }
}

/**
 * Get default interview questions if AI fails
 */
function getDefaultInterviewQuestions(resumeData) {
  const questions = [
    { question: "Can you tell me about a specific project or achievement you're most proud of from your work experience?", type: "achievements", followUp: "What made it so meaningful to you?" },
    { question: "How have you demonstrated leadership or initiative in your previous roles?", type: "experience", followUp: "Can you give me a specific example?" },
    { question: "What unique skills or qualities do you bring that set you apart from other candidates?", type: "personality", followUp: "How have you used these in your work?" },
    { question: "What are your career goals for the next 3-5 years?", type: "goals", followUp: "What motivates you in your career?" },
    { question: "Can you describe a challenging situation you faced at work and how you handled it?", type: "experience", followUp: "What did you learn from that experience?" }
  ];
  
  console.log('⚠️ Using default interview questions');
  return questions;
}

/**
 * Recommend top templates for user based on their resume
 * @param {Object} resumeData - User's resume data
 * @param {Array} allTemplates - All available templates
 * @param {number} topN - Number of recommendations to return
 * @returns {Promise<Array>} Top N recommended templates
 */
export async function recommendTemplates(resumeData, allTemplates, topN = 10) {
  console.log('🎨 AI: Recommending templates with Gemini...');
  
  // Build template summary for AI
  const templateSummary = allTemplates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category.join(', '),
    jobTypes: t.jobTypes.join(', '),
    features: t.features.join(', ')
  }));

  const prompt = `You are a career expert. Analyze the user's resume and recommend the TOP ${topN} resume templates that best match their profile.

User Resume Summary:
- Experience Level: ${calculateYearsOfExperience(resumeData.experience)} years
- Skills: ${(resumeData.skills?.technical || []).join(', ')}
- Job Focus: ${resumeData.experience[0]?.position || 'Not specified'}

Available Templates:
${JSON.stringify(templateSummary, null, 2)}

Return ONLY valid JSON with this exact structure:
{
  "recommendations": [
    {
      "templateId": "template_id",
      "name": "Template Name",
      "matchScore": 85,
      "reasoning": "Why this template fits (1-2 sentences)"
    }
  ]
}

Sort by match score (highest first). Consider:
1. Industry/job type alignment
2. Experience level appropriateness
3. Template features that match user's skills
4. Professional aesthetic vs creative balance

Return ONLY the JSON, no markdown, no explanation.`;

  try {
    const response = await callGeminiAI(prompt, 2000);
    
    // Extract JSON from response
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const recommendations = JSON.parse(jsonText);
    console.log('✅ AI: Template recommendations generated');
    
    // Enrich with full template data
    const enriched = recommendations.recommendations.map(rec => {
      const template = allTemplates.find(t => t.id === rec.templateId);
      return {
        ...rec,
        ...template
      };
    }).filter(t => t !== undefined);
    
    return enriched;
  } catch (error) {
    console.error('❌ AI Error recommending templates:', error);
    return getDefaultTemplateRecommendations(resumeData, allTemplates, topN);
  }
}

/**
 * Default template recommendations if AI fails
 */
function getDefaultTemplateRecommendations(resumeData, allTemplates, topN) {
  const years = calculateYearsOfExperience(resumeData.experience);
  
  // Simple scoring based on job type and experience
  const scored = allTemplates.map(template => {
    let score = 50; // base score
    
    // Boost score if job type matches
    if (resumeData.experience[0]?.position) {
      const position = resumeData.experience[0].position.toLowerCase();
      const matchesJobType = template.jobTypes.some(job => 
        position.includes(job.toLowerCase())
      );
      if (matchesJobType) score += 30;
    }
    
    // Boost score based on experience level
    if (years < 2 && template.years.includes('entry')) score += 20;
    if (years >= 2 && years < 5 && template.years.includes('mid')) score += 20;
    if (years >= 5 && template.years.includes('senior')) score += 20;
    
    return {
      ...template,
      matchScore: score,
      reasoning: `Good match for your experience level and industry.`
    };
  });
  
  // Sort by score and take top N
  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN);
}

export default {
  parseResume,
  recommendLayout,
  generateResumeContent,
  chatWithCareerCoach,
  suggestSectionImprovements,
  generateInterviewQuestions,
  generateTailoredResume,
  recommendTemplates
};
