/**
 * LaTeX Service - Compiles LaTeX templates with user data
 * 
 * This service:
 * - Checks LaTeX availability
 * - Compiles LaTeX templates
 * - Injects user data into templates using placeholders
 * - Handles template-specific data formatting
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '../../templates/store');
const TEMP_DIR = path.join(__dirname, '../../temp');

class LaTeXService {
  /**
   * Check if LaTeX compiler is available
   */
  async isLaTeXAvailable() {
    try {
      await execAsync('pdflatex --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Compile LaTeX template with user data
   */
  async compileTemplate(templateId, resumeData) {
    console.log(`📄 Compiling LaTeX template: ${templateId}`);
    
    // Get template metadata
    const templateService = (await import('./template.service.js')).default;
    const template = templateService.getTemplateById(templateId);
    
    if (!template || !template.file) {
      throw new Error(`Template ${templateId} not found or has no file`);
    }

    // Create temp directory for compilation
    const compileDir = path.join(TEMP_DIR, `compile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(compileDir, { recursive: true });

    try {
      // Copy template files to compile directory
      const templatePath = path.join(TEMPLATES_DIR, template.file);
      const templateDir = path.dirname(templatePath);
      const templateBaseName = path.basename(templatePath, '.tex');

      // Copy all files from template directory
      const files = await fs.readdir(templateDir);
      for (const file of files) {
        if (file.startsWith('.')) continue; // Skip hidden files
        const srcPath = path.join(templateDir, file);
        const destPath = path.join(compileDir, file);
        const stat = await fs.stat(srcPath);
        if (stat.isFile()) {
          await fs.copyFile(srcPath, destPath);
        }
      }

      // Read and inject data into main template
      const mainTemplate = path.join(compileDir, path.basename(template.file));
      let compiledContent = await fs.readFile(mainTemplate, 'utf-8');

      // Inject data based on template type
      const templateName = template.name.toLowerCase();
      const normalizedId = templateId.toLowerCase();
      
      if (templateName.includes('curve') || normalizedId.includes('curve')) {
        compiledContent = await this.injectCurveCVData(mainTemplate, resumeData, compileDir);
      } else if ((templateName.includes('alta') && !templateName.includes('maltacv')) || (normalizedId.includes('alta') && !normalizedId.includes('maltacv'))) {
        compiledContent = await this.injectAltaCVData(mainTemplate, resumeData);
      } else if (templateName.includes('maltacv') || normalizedId.includes('maltacv')) {
        compiledContent = await this.injectMAltaCVData(mainTemplate, resumeData);
      } else if (templateName.includes('hipster') || templateName.includes('simple') || normalizedId.includes('hipster')) {
        compiledContent = await this.injectHipsterCVData(mainTemplate, resumeData);
      } else if (templateName.includes('sixty') || normalizedId.includes('sixty')) {
        compiledContent = await this.injectSixtySecondsCVData(mainTemplate, resumeData);
      } else if (templateName.includes('resume template') || normalizedId.includes('resume-template')) {
        compiledContent = await this.injectResumeTemplateData(mainTemplate, resumeData);
      } else if (templateName.includes('cv template') || normalizedId.includes('cv-template')) {
        compiledContent = await this.injectCVTemplateData(mainTemplate, resumeData);
      } else {
        // Generic placeholder replacement
        compiledContent = this.replacePlaceholders(compiledContent, resumeData);
      }

      // Final safety sanitization: handle unresolved placeholders and image tokens
      try {
        // Create a tiny transparent PNG placeholder for unresolved images
        const placeholderPngPath = path.join(compileDir, 'placeholder.png');
        const placeholderPngBase64 =
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAucB9W5y1i0AAAAASUVORK5CYII=';
        try {
          await fs.access(placeholderPngPath);
        } catch {
          await fs.writeFile(placeholderPngPath, Buffer.from(placeholderPngBase64, 'base64'));
        }
        // Replace common unresolved image tokens with the placeholder path
        const imageTokens = ['PROFILE_IMAGE', 'PHOTO_PATH', 'PROFILE_PHOTO', 'AVATAR_PATH', 'IMAGE_PATH'];
        imageTokens.forEach((tok) => {
          const includePattern = new RegExp(`(\\\\includegraphics(?:\\[[^\\]]*\\])?\\{)${tok}(\\})`, 'g');
          compiledContent = compiledContent.replace(includePattern, `$1${placeholderPngPath.replace(/\\/g, '/')}$2`);
        });
        // Comment out any includegraphics that still reference ALL_CAPS tokens
        compiledContent = compiledContent.replace(/^(.*\\includegraphics[^\{]*\{[A-Z_]+\}.*)$/gm, '% $1');
        // Remove unresolved ALL_CAPS placeholders in braces e.g., {HOMEPAGE_URL} -> {}
        compiledContent = compiledContent.replace(/\{[A-Z_]{2,}\}/g, '{}');
        // Replace bare ALL_CAPS tokens not part of commands to avoid math mode issues (no commenting)
        compiledContent = compiledContent.replace(/\b[A-Z_]{2,}\b/g, '');
        // Normalize accidental double dollars
        compiledContent = compiledContent.replace(/\$\$/g, '$');
      } catch (sanitizeErr) {
        // Non-fatal
        console.warn('⚠️ Sanitization step failed:', sanitizeErr?.message);
      }

      // Write compiled content
      await fs.writeFile(mainTemplate, compiledContent, 'utf-8');

      // Determine LaTeX engine (AltaCV prefers XeLaTeX for font support)
      let engine = 'pdflatex';
      if (
        (templateName.includes('alta') && !templateName.includes('maltacv')) ||
        (normalizedId.includes('alta') && !normalizedId.includes('maltacv')) ||
        templateName.includes('maltacv') ||
        normalizedId.includes('maltacv') ||
        templateName.includes('curve') ||
        normalizedId.includes('curve') ||
        templateName.includes('sixty') ||
        normalizedId.includes('sixty')
      ) {
        engine = 'xelatex';
      }

      // Compile LaTeX
      const pdfPath = path.join(compileDir, `${templateBaseName}.pdf`);
      if (engine === 'pdflatex') {
        const stubPath = path.join(compileDir, 'figureversions.sty');
        const stubContent = `\\NeedsTeXFormat{LaTeX2e}
\\ProvidesPackage{figureversions}[2024/01/01 Stub implementation]\\relax
\\providecommand\\DeclareFigureStyle[2][]{}
\\providecommand\\DeclareFigureAlignment[2][]{}
\\providecommand\\DeclareFigureVersion[2][]{}
\\providecommand\\figureversion[1][]{}
\\providecommand\\DeclareFigureFamily[2][]{}
\\providecommand\\DeclareFigureMathVersions[1][]{}
`;
        await fs.writeFile(stubPath, stubContent, 'utf-8');
      }
      await this.runLatex(engine, compileDir, templateBaseName);

      // Check if PDF was generated
      if (!await this.fileExists(pdfPath)) {
        throw new Error('PDF generation failed - no output file created');
      }

      // Copy PDF to permanent location
      const finalPdfPath = path.join(TEMP_DIR, `resume_${Date.now()}.pdf`);
      await fs.copyFile(pdfPath, finalPdfPath);

      console.log('✅ LaTeX compilation successful');
      return finalPdfPath;

    } catch (error) {
      console.error('❌ LaTeX compilation error:', error);
      
      // Try to extract error from log file
      const logPath = path.join(compileDir, `${path.basename(template.file, '.tex')}.log`);
      let errorDetails = error.message;
      
      try {
        if (await this.fileExists(logPath)) {
          const logContent = await fs.readFile(logPath, 'utf-8');
          const errorMatch = logContent.match(/! (.*?)(?=\n|$)/g);
          if (errorMatch) {
            errorDetails = errorMatch.slice(-3).join('\n');
          }
          
          // Check for missing packages
          const missingPackage = logContent.match(/! LaTeX Error: File `([^']+)' not found/);
          if (missingPackage) {
            errorDetails += `\n\nMissing LaTeX package: ${missingPackage[1]}. Please install it using: mpm --install=${missingPackage[1]} --admin`;
          }
        }
      } catch (logError) {
        // Ignore log reading errors
      }

      throw new Error(`LaTeX compilation failed: ${errorDetails}`);
    } finally {
      // Cleanup compile directory after a delay (for debugging)
      setTimeout(async () => {
        try {
          await fs.rm(compileDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('Warning: Could not cleanup compile directory:', cleanupDir);
        }
      }, 30000); // Keep for 30 seconds
    }
  }

  /**
   * Run pdflatex compiler
   */
  async runLatex(engine, workDir, baseName) {
    const command = engine === 'xelatex' ? 'xelatex' : 'pdflatex';
    const texFile = path.join(workDir, `${baseName}.tex`);
    
    // First run
    await execAsync(`${command} -interaction=nonstopmode -halt-on-error -output-directory="${workDir}" "${texFile}"`, {
      cwd: workDir,
      maxBuffer: 10 * 1024 * 1024
    });

    // Second run for references (if needed)
    try {
      await execAsync(`${command} -interaction=nonstopmode -halt-on-error -output-directory="${workDir}" "${texFile}"`, {
        cwd: workDir,
        maxBuffer: 10 * 1024 * 1024
      });
    } catch (error) {
      // Ignore errors on second run
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Escape LaTeX special characters
   */
  escapeLatex(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/#/g, '\\#')
      .replace(/\$/g, '\\$')
      .replace(/%/g, '\\%')
      .replace(/&/g, '\\&')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/_/g, '\\_')
      .replace(/~/g, '\\textasciitilde{}');
  }

  /**
   * Inject data into Curve CV template using placeholders
   */
  async injectCurveCVData(latexFile, resumeData, compileDir) {
    console.log('📝 Injecting Curve CV data...');
    let content = await fs.readFile(latexFile, 'utf-8');
    const data = resumeData;
    
    console.log('📋 Resume data keys:', Object.keys(data || {}));
    console.log('📋 Personal info keys:', Object.keys(data.personalInfo || {}));
    
    // Comment out problematic lines that require files we don't have
    content = content.replace(/\\addbibresource\{[^}]+\}/g, '% $&'); // Comment out bibresource
    content = content.replace(/\\photo\[[^\]]*\]\{[^}]+\}/g, '% $&'); // Comment out photo commands
    
    // Replace name placeholder
    const name = this.escapeLatex(data.personalInfo?.fullName || data.personalInfo?.name || 'Your Name');
    if (data.personalInfo?.title) {
      content = content.replace(/\\PLACEHOLDERNAME/g, `${name}, ${this.escapeLatex(data.personalInfo.title)}`);
    } else {
      content = content.replace(/\\PLACEHOLDERNAME/g, name);
    }
    console.log(`✅ Name replaced: ${name}`);
    
    // Build contact info
    const email = this.escapeLatex(data.personalInfo?.email || '');
    const phone = this.escapeLatex(data.personalInfo?.phone || '');
    const linkedin = data.personalInfo?.linkedin || '';
    const github = data.personalInfo?.github || '';
    const website = data.personalInfo?.website || '';
    
    let contactInfo = '';
    if (email) {
      contactInfo += `  \\makefield{\\faEnvelope[regular]}{\\href{mailto:${email}}{\\texttt{${email}}}}\n`;
    }
    if (phone) {
      contactInfo += `  \\makefield{\\faPhone}{\\texttt{${phone}}}\n`;
    }
    if (linkedin) {
      const linkedinId = linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
      contactInfo += `  \\makefield{\\faLinkedin}{\\href{${linkedin}}{\\texttt{${this.escapeLatex(linkedinId)}}}}\n`;
    }
    if (github) {
      const githubId = github.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
      contactInfo += `  \\makefield{\\faGithub}{\\href{${github}}{\\texttt{${this.escapeLatex(githubId)}}}}\n`;
    }
    if (website) {
      contactInfo += `  \\makefield{\\faGlobe}{\\url{${website}}}\n`;
    }
    
    if (!contactInfo) {
      contactInfo = '  % No contact info provided\n';
    }
    
    content = content.replace(/\\PLACEHOLDERCONTACTINFO/g, contactInfo.trim());
    console.log(`✅ Contact info replaced: email=${!!email}, phone=${!!phone}, linkedin=${!!linkedin}, github=${!!github}`);
    
    // Generate section files
    console.log('📝 Generating Curve CV section files...');
    await this.generateCurveSection('employment', data.experience || [], compileDir);
    console.log(`✅ Employment section generated (${(data.experience || []).length} items)`);
    
    await this.generateCurveSection('education', data.education || [], compileDir);
    console.log(`✅ Education section generated (${(data.education || []).length} items)`);
    
    await this.generateCurveSection('skills', data.skills || {}, compileDir);
    console.log(`✅ Skills section generated`);
    
    // Generate empty placeholder files for required sections
    await this.generateEmptySection('publications', compileDir);
    await this.generateEmptySection('misc', compileDir);
    await this.generateEmptySection('referee', compileDir);
    
    console.log('✅ Curve CV data injection complete');
    return content;
  }

  /**
   * Generate Curve CV section file
   */
  async generateCurveSection(sectionName, data, compileDir) {
    let content = `\\begin{rubric}{${this.getSectionTitle(sectionName)}}\n`;
    
    if (sectionName === 'employment' && Array.isArray(data)) {
      data.forEach(exp => {
        const startDate = exp.startDate || exp.start || '';
        const endDate = exp.endDate || exp.end || (exp.current ? 'Present' : 'Present');
        const dateRange = `${startDate} -- ${endDate}`;
        const position = this.escapeLatex(exp.position || exp.title || '');
        const company = this.escapeLatex(exp.company || exp.employer || '');
        const responsibilities = exp.responsibilities || exp.description || [];
        
        // Handle responsibilities as array or string
        let respList = [];
        if (Array.isArray(responsibilities)) {
          respList = responsibilities;
        } else if (typeof responsibilities === 'string') {
          respList = responsibilities.split('\n').filter(r => r.trim());
        }
        
        content += `\\entry*[${dateRange}]%\n`;
        content += `\t\\textbf{${position},} ${company}.\n`;
        if (respList.length > 0) {
          respList.forEach(resp => {
            const respText = typeof resp === 'string' ? resp : (resp.text || resp.description || '');
            if (respText) {
              content += `\t\\par ${this.escapeLatex(respText)}\n`;
            }
          });
        }
        content += `%\n`;
      });
    } else if (sectionName === 'education' && Array.isArray(data)) {
      data.forEach(edu => {
        const gradDate = edu.graduationDate || edu.date || edu.endDate || '';
        const degree = this.escapeLatex(edu.degree || edu.field || '');
        const institution = this.escapeLatex(edu.institution || edu.school || '');
        const field = edu.field || edu.major ? ` ${this.escapeLatex(edu.field || edu.major)}` : '';
        
        content += `\\entry*[${gradDate}]%\n`;
        content += `\t\\textbf{${degree},} ${institution}${field}.\n`;
        if (edu.thesis) {
          content += `\t\\par Thesis title: \\emph{${this.escapeLatex(edu.thesis)}}.}\n`;
        }
        if (edu.gpa) {
          content += `\t\\par GPA: ${this.escapeLatex(edu.gpa)}.\n`;
        }
        if (edu.honors) {
          content += `\t\\par ${this.escapeLatex(edu.honors)}.\n`;
        }
        content += `%\n`;
      });
    } else if (sectionName === 'skills' && typeof data === 'object') {
      if (data.technical && Array.isArray(data.technical)) {
        content += `\\entry*[Technical Skills\\hfill]\n`;
        content += `\t${data.technical.map(s => this.escapeLatex(s)).join(', ')}.\n`;
      }
      if (data.soft && Array.isArray(data.soft)) {
        content += `\\entry*[Soft Skills\\hfill]\n`;
        content += `\t${data.soft.map(s => this.escapeLatex(s)).join(', ')}.\n`;
      }
      if (data.languages && Array.isArray(data.languages)) {
        content += `\\entry*[Languages]\n`;
        const langList = data.languages.map(l => {
          const langName = typeof l === 'object' ? (l.name || l.language) : l;
          return this.escapeLatex(langName);
        }).join(', ');
        content += `\t${langList}.\n`;
      }
    }
    
    content += `\\end{rubric}\n`;
    
    await fs.writeFile(path.join(compileDir, `${sectionName}.tex`), content, 'utf-8');
  }

  /**
   * Get section title for Curve CV
   */
  getSectionTitle(sectionName) {
    const titles = {
      employment: 'Employment History',
      education: 'Education',
      skills: 'Skills',
      publications: 'Research Publications',
      misc: 'Miscellaneous Experience'
    };
    return titles[sectionName] || sectionName;
  }

  /**
   * Generate empty section file (for required but empty sections)
   */
  async generateEmptySection(sectionName, compileDir) {
    let content = '';
    if (sectionName === 'publications') {
      // For publications, we need a LaTeX file that can be \input
      content = '% No publications provided\n';
    } else {
      // For other sections, use the rubric format
      content = `\\begin{rubric}{${this.getSectionTitle(sectionName)}}\n\\end{rubric}\n`;
    }
    await fs.writeFile(path.join(compileDir, `${sectionName}.tex`), content, 'utf-8');
  }

  /**
   * Inject data into AltaCV template using placeholders
   */
  async injectAltaCVData(latexFile, resumeData) {
    let content = await fs.readFile(latexFile, 'utf-8');
    const data = resumeData;
    
    console.log('📝 Injecting AltaCV data...');
    console.log('📋 Resume data keys:', Object.keys(data || {}));
    console.log('📋 Personal info keys:', Object.keys(data.personalInfo || {}));
    
    // Extract name - handle multiple formats
    const fullName = data.personalInfo?.fullName || data.personalInfo?.name || 'Your Name Here';
    const name = this.escapeLatex(fullName);
    const nameParts = fullName.split(' ');
    const firstName = this.escapeLatex(nameParts[0] || '');
    const lastName = this.escapeLatex(nameParts.slice(1).join(' ') || '');
    
    // Replace name in various formats
    content = content.replace(/\\PLACEHOLDERNAME/g, name);
    content = content.replace(/FULL_NAME/g, name);
    content = content.replace(/FIRST_NAME/g, firstName);
    content = content.replace(/LAST_NAME/g, lastName);
    content = content.replace(/\\name\{[^}]*\}/g, `\\name{${name}}`);
    content = content.replace(/\\firstname\{[^}]*\}/g, `\\firstname{${firstName}}`);
    content = content.replace(/\\familyname\{[^}]*\}/g, `\\familyname{${lastName}}`);
    
    console.log(`✅ Name replaced: ${name}`);
    
    // Extract tagline/summary
    const tagline = this.escapeLatex(data.summary || data.personalInfo?.title || data.professionalSummary || 'Your Position or Tagline Here');
    content = content.replace(/\\PLACEHOLDERTAGLINE/g, tagline);
    content = content.replace(/TAGLINE/g, tagline);
    content = content.replace(/\\tagline\{[^}]*\}/g, `\\tagline{${tagline}}`);
    
    console.log(`✅ Tagline replaced: ${tagline.substring(0, 50)}...`);
    
    // Build personal info
    const email = this.escapeLatex(data.personalInfo?.email || '');
    const phone = this.escapeLatex(data.personalInfo?.phone || '');
    const location = this.escapeLatex(data.personalInfo?.location || '');
    const website = data.personalInfo?.website || '';
    const linkedin = data.personalInfo?.linkedin || '';
    const github = data.personalInfo?.github || '';
    
    // Replace individual contact fields
    if (email) {
      content = content.replace(/EMAIL/g, email);
      content = content.replace(/\\email\{[^}]*\}/g, `\\email{${email}}`);
    }
    if (phone) {
      content = content.replace(/PHONE_NUMBER/g, phone);
      content = content.replace(/\\phone\{[^}]*\}/g, `\\phone{${phone}}`);
    }
    if (location) {
      content = content.replace(/LOCATION/g, location);
      content = content.replace(/\\location\{[^}]*\}/g, `\\location{${location}}`);
    }
    
    let personalInfo = '';
    if (email) personalInfo += `  \\email{${email}}\n`;
    if (phone) personalInfo += `  \\phone{${phone}}\n`;
    if (location) personalInfo += `  \\location{${location}}\n`;
    if (website) personalInfo += `  \\homepage{${website}}\n`;
    if (linkedin) {
      const linkedinId = linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
      const linkedinEscaped = this.escapeLatex(linkedinId);
      personalInfo += `  \\linkedin{${linkedinEscaped}}\n`;
      content = content.replace(/LINKEDIN_USERNAME/g, linkedinEscaped);
      content = content.replace(/\\linkedin\{[^}]*\}/g, `\\linkedin{${linkedinEscaped}}`);
    }
    if (github) {
      const githubId = github.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
      const githubEscaped = this.escapeLatex(githubId);
      personalInfo += `  \\github{${githubEscaped}}\n`;
      content = content.replace(/GITHUB_USERNAME/g, githubEscaped);
      content = content.replace(/\\github\{[^}]*\}/g, `\\github{${githubEscaped}}`);
    }
    
    if (!personalInfo.trim()) {
      personalInfo = '  % No personal info provided\n';
    }
    
    content = content.replace(/\\PLACEHOLDERPERSONALINFO/g, personalInfo.trim());
    
    // Replace bio
    const bio = this.escapeLatex(data.summary || data.personalInfo?.bio || data.professionalSummary || '');
    if (bio) {
      content = content.replace(/BIO_TEXT/g, bio);
      content = content.replace(/\\bio\{[^}]*\}/g, `\\bio{${bio}}`);
    }
    
    console.log(`✅ Contact info replaced: email=${!!email}, phone=${!!phone}, linkedin=${!!linkedin}, github=${!!github}`);
    
    // Replace experience section
    const experienceContent = this.generateAltaCVExperience(data.experience || []);
    if (experienceContent) {
      content = content.replace(/\\PLACEHOLDEREXPERIENCE/g, experienceContent);
      content = content.replace(/EXPERIENCE_ITEMS/g, experienceContent);
      console.log(`✅ Experience section replaced (${(data.experience || []).length} items)`);
    } else {
      content = content.replace(/\\PLACEHOLDEREXPERIENCE/g, '% No experience provided');
      content = content.replace(/EXPERIENCE_ITEMS/g, '% No experience provided');
      console.log('⚠️ No experience data found');
    }
    
    // Replace projects section
    let projectsContent = '';
    if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
      projectsContent = `\\cvsection{Projects}\n\n${this.generateAltaCVProjects(data.projects)}\n\n`;
      content = content.replace(/ACTIVITIES_PROJECTS_LIST/g, this.generateAltaCVProjects(data.projects));
      console.log(`✅ Projects section replaced (${data.projects.length} items)`);
    } else {
      content = content.replace(/ACTIVITIES_PROJECTS_LIST/g, '% No projects provided');
      console.log('⚠️ No projects data found');
    }
    content = content.replace(/\\PLACEHOLDERPROJECTS/g, projectsContent);
    
    // Replace publications section
    let publicationsContent = `% use ONLY \\newpage if you want to force a page break for\n% ONLY the current column\n\\newpage\n\n\\cvsection{Publications}\n\n`;
    content = content.replace(/\\PLACEHOLDERPUBLICATIONS/g, publicationsContent);
    
    // Replace "My Life Philosophy" section
    let philosophyContent = '';
    if (data.summary || data.achievements?.length > 0) {
      const philosophyText = data.summary?.split('.')[0] || data.achievements?.[0] || 'Dedicated professional committed to excellence.';
      philosophyContent = `\\cvsection{My Life Philosophy}\n\n\\begin{quote}\n\`\`${this.escapeLatex(philosophyText)}''\n\\end{quote}\n\n`;
    }
    content = content.replace(/\\PLACEHOLDERPHILOSOPHY/g, philosophyContent);
    
    // Replace "Most Proud Of" section
    let proudContent = '';
    if (data.achievements && Array.isArray(data.achievements) && data.achievements.length > 0) {
      proudContent = `\\cvsection{Most Proud of}\n\n${this.generateAltaCVAchievements(data.achievements)}\n\n`;
      content = content.replace(/AWARDS_LIST/g, this.generateAltaCVAchievements(data.achievements));
      content = content.replace(/AWARDS_LIST_2/g, '');
      console.log(`✅ Achievements/Awards section replaced (${data.achievements.length} items)`);
    } else {
      content = content.replace(/AWARDS_LIST/g, '% No awards provided');
      content = content.replace(/AWARDS_LIST_2/g, '');
      console.log('⚠️ No achievements/awards data found');
    }
    content = content.replace(/\\PLACEHOLDERPROUD/g, proudContent);
    
    // Replace Strengths/Skills section
    let strengthsContent = '';
    if (data.skills?.technical && Array.isArray(data.skills.technical)) {
      strengthsContent = `\\cvsection{Strengths}\n\n${this.generateAltaCVSkills(data.skills)}\n\n`;
      // Handle SKILLS_LIST placeholder (for MAltaCV)
      const skillsList = data.skills.technical.map(s => `\\cvtag{${this.escapeLatex(s)}}`).join('\n');
      content = content.replace(/SKILLS_LIST/g, skillsList);
      console.log(`✅ Skills section replaced (${data.skills.technical.length} skills)`);
    } else {
      content = content.replace(/SKILLS_LIST/g, '% No skills provided');
      console.log('⚠️ No skills data found');
    }
    content = content.replace(/\\PLACEHOLDERSTRENGTHS/g, strengthsContent);
    
    // Replace Languages section
    let languagesContent = '';
    if (data.skills?.languages && Array.isArray(data.skills.languages)) {
      languagesContent = `\\cvsection{Languages}\n\n${this.generateAltaCVLanguages(data.skills.languages)}\n\n\\medskip\n\n`;
    }
    content = content.replace(/\\PLACEHOLDERLANGUAGES/g, languagesContent);
    
    // Replace Education section
    let educationContent = '';
    if (data.education && Array.isArray(data.education) && data.education.length > 0) {
      educationContent = `\\cvsection{Education}\n\n${this.generateAltaCVEducation(data.education)}\n\n`;
      // Handle EDUCATION_ITEMS and EDUCATION_ITEMS_2 (for MAltaCV two-column layout)
      const educationItems = this.generateAltaCVEducation(data.education);
      const midPoint = Math.ceil(data.education.length / 2);
      const education1 = data.education.slice(0, midPoint);
      const education2 = data.education.slice(midPoint);
      content = content.replace(/EDUCATION_ITEMS/g, this.generateAltaCVEducation(education1));
      content = content.replace(/EDUCATION_ITEMS_2/g, this.generateAltaCVEducation(education2));
      console.log(`✅ Education section replaced (${data.education.length} items)`);
    } else {
      content = content.replace(/EDUCATION_ITEMS/g, '% No education provided');
      content = content.replace(/EDUCATION_ITEMS_2/g, '');
      console.log('⚠️ No education data found');
    }
    content = content.replace(/\\PLACEHOLDEREDUCATION/g, educationContent);
    
    // Replace Referees section
    const refereesContent = '';
    content = content.replace(/\\PLACEHOLDERREFEREES/g, refereesContent);
    
    console.log('✅ AltaCV data injection complete');
    return content;
  }

  /**
   * Generate AltaCV experience section
   */
  generateAltaCVExperience(experience) {
    if (!experience || !Array.isArray(experience) || experience.length === 0) {
      return '';
    }
    
    let content = '';
    experience.forEach((exp, idx) => {
      const title = this.escapeLatex(exp.position || exp.title || 'Job Title');
      const company = this.escapeLatex(exp.company || exp.employer || 'Company');
      const startDate = exp.startDate || exp.start || '';
      const endDate = exp.endDate || exp.end || (exp.current ? 'Present' : 'Ongoing');
      const dateRange = `${startDate} -- ${endDate}`;
      const location = this.escapeLatex(exp.location || '');
      const responsibilities = exp.responsibilities || exp.description || [];
      
      // Handle responsibilities as array or string
      let respList = [];
      if (Array.isArray(responsibilities)) {
        respList = responsibilities;
      } else if (typeof responsibilities === 'string') {
        respList = responsibilities.split('\n').filter(r => r.trim());
      }
      
      content += `\\cvevent{${title}}{${company}}{${dateRange}}{${location}}\n`;
      if (respList.length > 0) {
        content += `\\begin{itemize}\n`;
        respList.forEach(resp => {
          const respText = typeof resp === 'string' ? resp : (resp.text || resp.description || '');
          if (respText) {
            content += `\\item ${this.escapeLatex(respText)}\n`;
          }
        });
        content += `\\end{itemize}\n`;
      }
      if (idx < experience.length - 1) {
        content += `\n\\divider\n\n`;
      }
    });
    return content;
  }

  /**
   * Generate AltaCV skills section
   */
  generateAltaCVSkills(skills) {
    let content = '';
    if (skills.technical && Array.isArray(skills.technical)) {
      skills.technical.slice(0, 10).forEach(skill => {
        content += `\\cvtag{${this.escapeLatex(skill)}}\n`;
      });
      if (skills.technical.length > 10) {
        content += `\\cvtag{${this.escapeLatex(skills.technical.slice(10).join(', '))}}\n`;
      }
    }
    return content;
  }

  /**
   * Generate AltaCV projects section
   */
  generateAltaCVProjects(projects) {
    let content = '';
    projects.slice(0, 5).forEach((proj, idx) => {
      const name = typeof proj === 'object' ? proj.name : proj;
      const description = typeof proj === 'object' ? (proj.description || '') : '';
      const company = typeof proj === 'object' ? (proj.company || '') : '';
      
      content += `\\cvevent{${this.escapeLatex(name)}}{${this.escapeLatex(company)}}{}{}\n`;
      if (description) {
        content += `${this.escapeLatex(description)}\n`;
      }
      if (idx < projects.length - 1) {
        content += `\n\\divider\n\n`;
      }
    });
    return content;
  }

  /**
   * Generate AltaCV education section
   */
  generateAltaCVEducation(education) {
    if (!education || !Array.isArray(education) || education.length === 0) {
      return '';
    }
    
    let content = '';
    education.forEach((edu, idx) => {
      const degree = this.escapeLatex(edu.degree || edu.field || '');
      const institution = this.escapeLatex(edu.institution || edu.school || '');
      const date = edu.graduationDate || edu.date || edu.endDate || '';
      const gpa = edu.gpa ? `, GPA: ${this.escapeLatex(edu.gpa)}` : '';
      const location = edu.location ? `, ${this.escapeLatex(edu.location)}` : '';
      
      content += `\\cvevent{${degree}}{${institution}}{${date}${gpa}${location}}{}\n`;
      if (edu.thesis || edu.field || edu.major) {
        content += `${this.escapeLatex(edu.thesis || edu.field || edu.major || '')}\n`;
      }
      if (edu.honors) {
        content += `${this.escapeLatex(edu.honors)}\n`;
      }
      if (idx < education.length - 1) {
        content += `\n\\divider\n\n`;
      }
    });
    return content;
  }

  /**
   * Generate AltaCV languages section
   */
  generateAltaCVLanguages(languages) {
    let content = '';
    languages.forEach((lang, idx) => {
      const langName = typeof lang === 'object' ? lang.name : lang;
      const proficiency = typeof lang === 'object' ? (lang.proficiency || 5) : 5;
      content += `\\cvskill{${this.escapeLatex(langName)}}{${Math.min(5, Math.max(1, proficiency))}}\n`;
      if (idx < languages.length - 1) {
        content += `\\divider\n`;
      }
    });
    return content;
  }
  
  /**
   * Generate AltaCV achievements section
   */
  generateAltaCVAchievements(achievements) {
    let content = '';
    achievements.slice(0, 3).forEach((ach, idx) => {
      const title = typeof ach === 'object' ? (ach.title || ach.name) : ach;
      const description = typeof ach === 'object' ? (ach.description || '') : '';
      const icon = idx === 0 ? '\\faTrophy' : '\\faHeartbeat';
      
      content += `\\cvachievement{${icon}}{${this.escapeLatex(title)}}{${this.escapeLatex(description)}}\n`;
      if (idx < achievements.length - 1) {
        content += `\n\\divider\n\n`;
      }
    });
    return content;
  }

  /**
   * Inject data into Hipster CV template using placeholders
   */
  async injectHipsterCVData(latexFile, resumeData) {
    console.log('📝 Injecting Hipster CV data...');
    let content = await fs.readFile(latexFile, 'utf-8');
    const data = resumeData;
    
    // Extract name parts for header
    const fullName = data.personalInfo?.fullName || data.personalInfo?.name || 'Your Name';
    const nameParts = fullName.split(' ');
    const firstName = this.escapeLatex(nameParts[0] || 'Your');
    const lastName = this.escapeLatex(nameParts.slice(1).join(' ') || 'Name');
    const title = this.escapeLatex(data.personalInfo?.title || data.summary?.split('.')[0] || 'Professional');
    
    content = content.replace(/\\PLACEHOLDERFIRSTNAME/g, firstName);
    content = content.replace(/\\PLACEHOLDERLASTNAME/g, lastName);
    content = content.replace(/\\PLACEHOLDERTITLE/g, title);
    console.log(`✅ Name replaced: ${firstName} ${lastName}`);
    
    // Replace About Me section
    const summary = this.escapeLatex(data.summary || data.personalInfo?.bio || data.professionalSummary || 'Professional with expertise in multiple domains.');
    content = content.replace(/\\PLACEHOLDERABOUTME/g, summary);
    console.log(`✅ Summary replaced`);
    
    // Build personal info in sidebar
    const name = this.escapeLatex(fullName);
    const email = this.escapeLatex(data.personalInfo?.email || '');
    const phone = this.escapeLatex(data.personalInfo?.phone || '');
    const location = this.escapeLatex(data.personalInfo?.location || '');
    const nationality = this.escapeLatex(data.personalInfo?.nationality || '');
    
    let personalInfoBlock = name;
    if (email) personalInfoBlock += `\n\nemail: ${email}`;
    if (phone) personalInfoBlock += `\n\nphone: ${phone}`;
    if (location) personalInfoBlock += `\n\nlocation: ${location}`;
    if (nationality) personalInfoBlock += `\n\nnationality: ${nationality}`;
    
    content = content.replace(/\\PLACEHOLDERPERSONALINFO/g, this.escapeLatex(personalInfoBlock));
    
    // Replace Areas of specialization/Skills
    let specializationContent = '';
    if (data.skills?.technical && Array.isArray(data.skills.technical)) {
      specializationContent = data.skills.technical.map(s => this.escapeLatex(s)).join(' ~•~ ');
    }
    content = content.replace(/\\PLACEHOLDERSPECIALIZATION/g, specializationContent);
    
    // Replace Interests section
    let interestsContent = '';
    if (data.skills?.interests || data.personalInfo?.interests) {
      const interests = data.skills?.interests || data.personalInfo?.interests || [];
      const interestsText = Array.isArray(interests) ? interests.join(', ') : interests;
      interestsContent = this.escapeLatex(interestsText);
    }
    // Also handle technical skills display
    if (data.skills?.technical && Array.isArray(data.skills.technical)) {
      const techSkills = data.skills.technical.slice(0, 6);
      const techSkillsText = techSkills.map(s => `\\texttt{${this.escapeLatex(s)}}`).join(' ~/~ ');
      if (interestsContent) {
        interestsContent += `\n\n\\bg{cvgreen}{white}{Interests}\\\\[0.5em]\n\n${techSkillsText}`;
      } else {
        interestsContent = techSkillsText;
      }
    }
    content = content.replace(/\\PLACEHOLDERINTERESTS/g, interestsContent);
    
    // Replace contact info bubbles
    let contactBubbles = '';
    if (data.personalInfo?.email) {
      contactBubbles += `\\infobubble{\\faAt}{cvgreen}{white}{${this.escapeLatex(data.personalInfo.email)}}\n`;
    }
    if (data.personalInfo?.linkedin) {
      const linkedinId = data.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
      contactBubbles += `\\infobubble{\\faLinkedin}{cvgreen}{white}{${this.escapeLatex(linkedinId)}}\n`;
    }
    if (data.personalInfo?.github) {
      const githubId = data.personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
      contactBubbles += `\\infobubble{\\faGithub}{cvgreen}{white}{${this.escapeLatex(githubId)}}\n`;
    }
    if (data.personalInfo?.website) {
      contactBubbles += `\\infobubble{\\faGlobe}{cvgreen}{white}{${this.escapeLatex(data.personalInfo.website)}}\n`;
    }
    if (!contactBubbles) {
      contactBubbles = '% No contact bubbles provided\n';
    }
    content = content.replace(/\\PLACEHOLDERCONTACTBUBBLES/g, contactBubbles.trim());
    
    // Replace Short Resumé/Experience section
    const experienceContent = this.generateHipsterCVExperience(data.experience || []);
    if (experienceContent) {
      content = content.replace(/\\PLACEHOLDEREXPERIENCE/g, experienceContent);
    } else {
      content = content.replace(/\\PLACEHOLDEREXPERIENCE/g, '% No experience provided');
    }
    
    // Replace Degrees/Education section
    const educationContent = this.generateHipsterCVEducation(data.education || []);
    if (educationContent) {
      content = content.replace(/\\PLACEHOLDEREDUCATION/g, educationContent);
    } else {
      content = content.replace(/\\PLACEHOLDEREDUCATION/g, '% No education provided');
    }
    
    // Replace Programming skills section
    let programmingContent = '';
    if (data.skills?.technical && Array.isArray(data.skills.technical)) {
      const skills = data.skills.technical.slice(0, 5);
      skills.forEach((skill, idx) => {
        const level = 0.4 + (idx * 0.1);
        programmingContent += `     \\bg{skilllabelcolour}{iconcolour}{${this.escapeLatex(skill)}} &  \\barrule{${level.toFixed(2)}}{0.5em}{cvpurple}`;
        if (idx < skills.length - 1) {
          programmingContent += ' \\\\\n';
        }
      });
    }
    if (!programmingContent) {
      programmingContent = '     % No programming skills provided';
    }
    content = content.replace(/\\PLACEHOLDERPROGRAMMING/g, programmingContent);
    
    // Replace Curriculum section
    const curriculumContent = this.generateHipsterCVExperience(data.experience || []);
    let curriculumSection = '';
    if (curriculumContent) {
      curriculumSection = `\\section*{Curriculum}\n\\begin{tabular}{r| p{0.5\\textwidth} c}\n    ${curriculumContent}\n\\end{tabular}`;
    }
    content = content.replace(/\\PLACEHOLDERCURRICULUM/g, curriculumSection);
    
    // Replace Certificates section
    let certificatesContent = '';
    if (data.certifications && Array.isArray(data.certifications) && data.certifications.length > 0) {
      certificatesContent = `\\section*{Certificates \\& Grants}\n\\begin{tabular}{>{\\footnotesize\\bfseries}r >{\\footnotesize}p{0.55\\textwidth}}\n`;
      data.certifications.slice(0, 5).forEach(cert => {
        const date = cert.date || cert.issueDate || '';
        const name = typeof cert === 'object' ? cert.name : cert;
        certificatesContent += `    ${date} & ${this.escapeLatex(name)} \\\\\n`;
      });
      certificatesContent += `\\end{tabular}`;
    }
    content = content.replace(/\\PLACEHOLDERCERTIFICATES/g, certificatesContent);
    
    // Replace Languages section
    let languagesContent = '';
    if (data.skills?.languages && Array.isArray(data.skills.languages)) {
      data.skills.languages.slice(0, 4).forEach((lang, idx) => {
        const langName = typeof lang === 'object' ? lang.name : lang;
        const proficiency = typeof lang === 'object' ? (lang.proficiency || 'C2') : 'C2';
        languagesContent += `\\textbf{${this.escapeLatex(langName)}} & ${proficiency} & {\\phantom{x}\\footnotesize ${idx === 0 ? 'fluent' : ''}}`;
        if (idx < data.skills.languages.length - 1) {
          languagesContent += ' \\\\\n';
        }
      });
    }
    if (!languagesContent) {
      languagesContent = '% No languages provided';
    }
    content = content.replace(/\\PLACEHOLDERLANGUAGES/g, languagesContent);
    
    // Replace Publications section
    let pubsContent = '';
    if (data.publications && Array.isArray(data.publications) && data.publications.length > 0) {
      pubsContent = `\\section*{Publications}\n\\begin{tabular}{>{\\footnotesize\\bfseries}r >{\\footnotesize}p{0.7\\textwidth}}\n`;
      data.publications.slice(0, 3).forEach(pub => {
        const year = pub.year || pub.date || '';
        const title = typeof pub === 'object' ? pub.title : pub;
        pubsContent += `    ${year} & \\emph{${this.escapeLatex(title)}}`;
        if (pub.publisher) pubsContent += `, ${this.escapeLatex(pub.publisher)}`;
        pubsContent += '. \\\\\n';
      });
      pubsContent += `\\end{tabular}`;
    }
    content = content.replace(/\\PLACEHOLDERPUBS/g, pubsContent);
    
    // Replace Footer
    let footerContent = '';
    if (fullName) footerContent += this.escapeLatex(fullName);
    if (location) footerContent += ` \\icon{\\faMapMarker}{cvgreen}{} ${this.escapeLatex(location)}`;
    if (phone) footerContent += ` \\icon{\\faPhone}{cvgreen}{} ${this.escapeLatex(phone)}`;
    if (email) footerContent += ` \\newline\\icon{\\faAt}{cvgreen}{} \\protect\\url{${this.escapeLatex(email)}}`;
    
    if (!footerContent) {
      footerContent = '% No footer info provided';
    }
    content = content.replace(/\\PLACEHOLDERFOOTER/g, footerContent);
    
    return content;
  }
  
  /**
   * Generate Hipster CV experience entries
   */
  generateHipsterCVExperience(experience) {
    let content = '';
    experience.slice(0, 5).forEach((exp, idx) => {
      const date = `${exp.startDate || ''}--${exp.endDate || 'Present'}`;
      const title = this.escapeLatex(exp.position || '');
      const role = this.escapeLatex(exp.company || '');
      const location = this.escapeLatex(exp.location || '');
      const description = exp.responsibilities ? exp.responsibilities.slice(0, 2).map(r => this.escapeLatex(r)).join('. ') : '';
      
      content += `\\cvevent{${date}}{${title}}{${role}}{${location} \\color{cvred}}{${description}}{}`;
      if (idx < experience.length - 1) {
        content += ' \\\\\n    ';
      }
    });
    return content;
  }
  
  /**
   * Generate Hipster CV education entries
   */
  generateHipsterCVEducation(education) {
    let content = '';
    education.slice(0, 3).forEach((edu, idx) => {
      const date = edu.graduationDate || '';
      const degree = this.escapeLatex(edu.degree || '');
      const level = edu.level || 'Degree';
      const institution = this.escapeLatex(edu.institution || '');
      const field = edu.field ? ` ${this.escapeLatex(edu.field)}` : '';
      
      content += `\\cvdegree{${date}}{${degree}}{${level}}{${institution}${field} \\color{headerblue}}{}{}`;
      if (idx < education.length - 1) {
        content += ' \\\\\n    ';
      }
    });
    return content;
  }

  /**
   * Replace placeholders in LaTeX content with user data (generic fallback)
   */
  /**
   * Inject data into MAltaCV template (similar to AltaCV)
   */
  async injectMAltaCVData(latexFile, resumeData) {
    console.log('📝 Injecting MAltaCV data...');
    // MAltaCV uses similar structure to AltaCV but may have different placeholders
    // First try AltaCV method, then handle MAltaCV-specific placeholders
    let content = await this.injectAltaCVData(latexFile, resumeData);
    
    const data = resumeData;
    
    // MAltaCV specific: Check for any remaining placeholders
    const placeholders = [
      { pattern: /FULL_NAME/g, value: this.escapeLatex(data.personalInfo?.fullName || data.personalInfo?.name || '') },
      { pattern: /FIRST_NAME/g, value: this.escapeLatex((data.personalInfo?.fullName || '').split(' ')[0] || '') },
      { pattern: /LAST_NAME/g, value: this.escapeLatex((data.personalInfo?.fullName || '').split(' ').slice(1).join(' ') || '') },
      { pattern: /EMAIL/g, value: this.escapeLatex(data.personalInfo?.email || '') },
      { pattern: /PHONE_NUMBER/g, value: this.escapeLatex(data.personalInfo?.phone || '') },
      { pattern: /LINKEDIN_USERNAME/g, value: this.escapeLatex((data.personalInfo?.linkedin || '').replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '') || '') },
      { pattern: /GITHUB_USERNAME/g, value: this.escapeLatex((data.personalInfo?.github || '').replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '') || '') },
      { pattern: /TAGLINE/g, value: this.escapeLatex(data.summary || data.personalInfo?.title || '') },
      { pattern: /BIO_TEXT/g, value: this.escapeLatex(data.summary || data.personalInfo?.bio || '') }
    ];
    
    placeholders.forEach(({ pattern, value }) => {
      if (value && content.match(pattern)) {
        content = content.replace(pattern, value);
        console.log(`✅ Replaced ${pattern} with value`);
      }
    });
    
    return content;
  }

  /**
   * Inject data into SixtySecondsCV template
   */
  async injectSixtySecondsCVData(latexFile, resumeData) {
    console.log('📝 Injecting SixtySecondsCV data...');
    let content = await fs.readFile(latexFile, 'utf-8');
    const data = resumeData;
    
    // Replace name (uses \cvname{FULL_NAME})
    const name = this.escapeLatex(data.personalInfo?.fullName || data.personalInfo?.name || 'Your Name');
    content = content.replace(/\\cvname\{[^}]*\}/g, `\\cvname{${name}}`);
    content = content.replace(/FULL_NAME/g, name);
    console.log(`✅ Name replaced: ${name}`);
    
    // Replace job title (uses \cvjobtitle{JOB_TITLE})
    const jobTitle = this.escapeLatex(data.personalInfo?.title || data.summary?.split('.')[0] || 'Professional');
    content = content.replace(/\\cvjobtitle\{[^}]*\}/g, `\\cvjobtitle{${jobTitle}}`);
    content = content.replace(/JOB_TITLE/g, jobTitle);
    console.log(`✅ Job title replaced: ${jobTitle}`);
    
    // Replace contact info (uses \cvmail{EMAIL}, \cvphone{PHONE_NUMBER}, \cvaddress{ADDRESS})
    const email = this.escapeLatex(data.personalInfo?.email || '');
    const phone = this.escapeLatex(data.personalInfo?.phone || '');
    const location = this.escapeLatex(data.personalInfo?.location || '');
    
    if (email) {
      content = content.replace(/\\cvmail\{[^}]*\}/g, `\\cvmail{${email}}`);
      content = content.replace(/EMAIL/g, email);
      console.log(`✅ Email replaced: ${email}`);
    }
    if (phone) {
      content = content.replace(/\\cvphone\{[^}]*\}/g, `\\cvphone{${phone}}`);
      content = content.replace(/PHONE_NUMBER/g, phone);
      console.log(`✅ Phone replaced: ${phone}`);
    }
    if (location) {
      content = content.replace(/\\cvaddress\{[^}]*\}/g, `\\cvaddress{${location}}`);
      content = content.replace(/ADDRESS/g, location);
      console.log(`✅ Location replaced: ${location}`);
    }
    
    // Replace website
    if (data.personalInfo?.website) {
      content = content.replace(/\\cvsite\{[^}]*\}/g, `\\cvsite{${data.personalInfo.website}}`);
      content = content.replace(/WEBSITE_URL/g, data.personalInfo.website);
    }
    
    // Replace GitHub
    if (data.personalInfo?.github) {
      const githubId = data.personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
      content = content.replace(/GITHUB_URL/g, data.personalInfo.github);
      content = content.replace(/GITHUB_TEXT/g, githubId);
    }
    
    // Replace LinkedIn
    if (data.personalInfo?.linkedin) {
      content = content.replace(/LINKEDIN_URL/g, data.personalInfo.linkedin);
      const linkedinId = data.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
      content = content.replace(/LINKEDIN_TEXT/g, linkedinId);
    }
    
    // Note: SixtySecondsCV uses a different structure for experience/education
    // It uses \cvevent or similar commands that are defined in the template
    // We'll replace placeholders but the template structure may need manual adjustment
    
    console.log('✅ SixtySecondsCV data injection complete');
    return content;
  }

  /**
   * Inject data into Resume Template
   */
  async injectResumeTemplateData(latexFile, resumeData) {
    console.log('📝 Injecting Resume Template data...');
    let content = await fs.readFile(latexFile, 'utf-8');
    const data = resumeData;
    
    // Replace name (uses FULL_NAME placeholder)
    const name = this.escapeLatex(data.personalInfo?.fullName || data.personalInfo?.name || 'Your Name');
    content = content.replace(/FULL_NAME/g, name);
    console.log(`✅ Name replaced: ${name}`);
    
    // Replace tagline
    const tagline = this.escapeLatex(data.personalInfo?.title || data.summary?.split('.')[0] || 'Professional');
    content = content.replace(/TAGLINE/g, tagline);
    console.log(`✅ Tagline replaced: ${tagline}`);
    
    // Replace contact info (uses EMAIL, PHONE, ADDRESS placeholders)
    const email = this.escapeLatex(data.personalInfo?.email || '');
    const phone = this.escapeLatex(data.personalInfo?.phone || '');
    const location = this.escapeLatex(data.personalInfo?.location || '');
    
    content = content.replace(/EMAIL/g, email);
    content = content.replace(/PHONE/g, phone);
    content = content.replace(/ADDRESS/g, location);
    console.log(`✅ Contact info replaced: email=${!!email}, phone=${!!phone}, location=${!!location}`);
    
    // Replace URLs
    if (data.personalInfo?.website) {
      content = content.replace(/PORTFOLIO_URL/g, data.personalInfo.website);
    }
    if (data.personalInfo?.github) {
      content = content.replace(/GITHUB_URL/g, data.personalInfo.github);
    }
    if (data.personalInfo?.linkedin) {
      content = content.replace(/LINKEDIN_URL/g, data.personalInfo.linkedin);
    }
    
    // Replace summary (uses SUMMARY_TEXT placeholder)
    const summary = this.escapeLatex(data.summary || data.professionalSummary || '');
    content = content.replace(/SUMMARY_TEXT/g, summary);
    if (summary) console.log(`✅ Summary replaced`);
    
    // Replace education (uses EDUCATION_LEVEL, INSTITUTION, START_YEAR-END_YEAR, MARKS_CGPA)
    if (data.education && Array.isArray(data.education) && data.education.length > 0) {
      const edu = data.education[0]; // Use first education entry
      const degree = this.escapeLatex(edu.degree || edu.field || '');
      const institution = this.escapeLatex(edu.institution || edu.school || '');
      const startYear = edu.graduationDate?.split('-')[0] || edu.date?.split('-')[0] || '';
      const endYear = edu.graduationDate?.split('-')[1] || edu.date?.split('-')[1] || edu.graduationDate || '';
      const gpa = edu.gpa || '';
      
      content = content.replace(/EDUCATION_LEVEL/g, degree);
      content = content.replace(/INSTITUTION/g, institution);
      content = content.replace(/START_YEAR-END_YEAR/g, `${startYear}-${endYear}`);
      content = content.replace(/MARKS_CGPA/g, gpa);
      console.log(`✅ Education replaced: ${degree} at ${institution}`);
    } else {
      console.log('⚠️ No education data found');
    }
    
    // Replace skills (uses SKILLS_CATEGORY and SKILLS_LIST)
    if (data.skills?.technical && Array.isArray(data.skills.technical)) {
      const skillsText = data.skills.technical.map(s => this.escapeLatex(s)).join(', ');
      content = content.replace(/SKILLS_CATEGORY/g, 'Technical Skills');
      content = content.replace(/SKILLS_LIST/g, skillsText);
      console.log(`✅ Skills replaced (${data.skills.technical.length} skills)`);
    } else {
      console.log('⚠️ No skills data found');
    }
    
    // Replace experience (uses EMPLOYER_NAME, START_MONTH YEAR – END_MONTH YEAR, DESIGNATION)
    if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) {
      const exp = data.experience[0]; // Use first experience entry
      const company = this.escapeLatex(exp.company || exp.employer || '');
      const position = this.escapeLatex(exp.position || exp.title || '');
      const startDate = exp.startDate || exp.start || '';
      const endDate = exp.endDate || exp.end || (exp.current ? 'Present' : '');
      
      content = content.replace(/EMPLOYER_NAME/g, company);
      content = content.replace(/DESIGNATION/g, position);
      content = content.replace(/START_MONTH YEAR – END_MONTH YEAR \(DURATION\)/g, `${startDate} – ${endDate}`);
      console.log(`✅ Experience replaced: ${position} at ${company}`);
    } else {
      console.log('⚠️ No experience data found');
    }
    
    // Replace projects (uses PROJECT_NAME, PROJECT_DEMO_URL, PROJECT_GITHUB_URL)
    if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
      const proj = data.projects[0]; // Use first project
      const projName = this.escapeLatex(proj.name || '');
      const projLink = proj.link || '';
      
      content = content.replace(/PROJECT_NAME/g, projName);
      content = content.replace(/PROJECT_DEMO_URL/g, projLink);
      content = content.replace(/PROJECT_GITHUB_URL/g, projLink);
      console.log(`✅ Project replaced: ${projName}`);
    }
    
    console.log('✅ Resume Template data injection complete');
    return content;
  }

  /**
   * Inject data into CV Template
   */
  async injectCVTemplateData(latexFile, resumeData) {
    console.log('📝 Injecting CV Template data...');
    let content = await fs.readFile(latexFile, 'utf-8');
    const data = resumeData;
    
    // CV Template uses \newcommand{\name}{...}, \newcommand{\email}{...}, etc.
    const name = this.escapeLatex(data.personalInfo?.fullName || data.personalInfo?.name || 'Your Name');
    const email = this.escapeLatex(data.personalInfo?.email || '');
    const phone = this.escapeLatex(data.personalInfo?.phone || '');
    const website = data.personalInfo?.website || '';
    
    // Replace name command
    content = content.replace(/\\newcommand\{\\name\}\{[^}]*\}/g, `\\newcommand{\\name}{${name}}`);
    console.log(`✅ Name replaced: ${name}`);
    
    // Replace email command
    if (email) {
      content = content.replace(/\\newcommand\{\\email\}\{[^}]*\}/g, `\\newcommand{\\email}{${email}}`);
      console.log(`✅ Email replaced: ${email}`);
    }
    
    // Replace phone command
    if (phone) {
      content = content.replace(/\\newcommand\{\\phone\}\{[^}]*\}/g, `\\newcommand{\\phone}{${phone}}`);
      console.log(`✅ Phone replaced: ${phone}`);
    }
    
    // Replace website command
    if (website) {
      content = content.replace(/\\newcommand\{\\website\}\{[^}]*\}/g, `\\newcommand{\\website}{${website}}`);
      console.log(`✅ Website replaced: ${website}`);
    }
    
    // Replace work entries (uses \workOneTitle, \workOneDates, \workOnePosition, \workOneDescription)
    if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) {
      data.experience.slice(0, 3).forEach((exp, idx) => {
        const num = idx === 0 ? 'One' : idx === 1 ? 'Two' : 'Three';
        const company = this.escapeLatex(exp.company || exp.employer || '');
        const position = this.escapeLatex(exp.position || exp.title || '');
        const dates = `${exp.startDate || exp.start || ''} - ${exp.endDate || exp.end || (exp.current ? 'Present' : '')}`;
        const responsibilities = exp.responsibilities || exp.description || [];
        let description = '';
        
        if (Array.isArray(responsibilities)) {
          description = responsibilities.slice(0, 3).map(r => {
            const respText = typeof r === 'string' ? r : (r.text || r.description || '');
            return this.escapeLatex(respText);
          }).join('. ');
        } else if (typeof responsibilities === 'string') {
          description = this.escapeLatex(responsibilities);
        }
        
        content = content.replace(new RegExp(`\\\\newcommand\{\\\\work${num}Title\}\{[^}]*\}`, 'g'), `\\newcommand{\\work${num}Title}{${company}}`);
        content = content.replace(new RegExp(`\\\\newcommand\{\\\\work${num}Dates\}\{[^}]*\}`, 'g'), `\\newcommand{\\work${num}Dates}{${dates}}`);
        content = content.replace(new RegExp(`\\\\newcommand\{\\\\work${num}Position\}\{[^}]*\}`, 'g'), `\\newcommand{\\work${num}Position}{${position}}`);
        content = content.replace(new RegExp(`\\\\newcommand\{\\\\work${num}Description\}\{[^}]*\}`, 'g'), `\\newcommand{\\work${num}Description}{${description}}`);
      });
      console.log(`✅ Work experience replaced (${Math.min(data.experience.length, 3)} entries)`);
    } else {
      console.log('⚠️ No experience data found');
    }
    
    // Replace education entries (uses \eduOneTitle, \eduOneDates, \eduOneSchool, \eduOneDescription)
    if (data.education && Array.isArray(data.education) && data.education.length > 0) {
      data.education.slice(0, 3).forEach((edu, idx) => {
        const num = idx === 0 ? 'One' : idx === 1 ? 'Two' : 'Three';
        const degree = this.escapeLatex(edu.degree || edu.field || '');
        const institution = this.escapeLatex(edu.institution || edu.school || '');
        const date = edu.graduationDate || edu.date || edu.endDate || '';
        const description = edu.field || edu.major || '';
        
        content = content.replace(new RegExp(`\\\\newcommand\{\\\\edu${num}Title\}\{[^}]*\}`, 'g'), `\\newcommand{\\edu${num}Title}{${degree}}`);
        content = content.replace(new RegExp(`\\\\newcommand\{\\\\edu${num}Dates\}\{[^}]*\}`, 'g'), `\\newcommand{\\edu${num}Dates}{${date}}`);
        content = content.replace(new RegExp(`\\\\newcommand\{\\\\edu${num}School\}\{[^}]*\}`, 'g'), `\\newcommand{\\edu${num}School}{${institution}}`);
        if (description) {
          content = content.replace(new RegExp(`\\\\newcommand\{\\\\edu${num}Description\}\{[^}]*\}`, 'g'), `\\newcommand{\\edu${num}Description}{${this.escapeLatex(description)}}`);
        }
      });
      console.log(`✅ Education replaced (${Math.min(data.education.length, 3)} entries)`);
    } else {
      console.log('⚠️ No education data found');
    }
    
    console.log('✅ CV Template data injection complete');
    return content;
  }

  replacePlaceholders(content, data) {
    console.log('📝 Using generic placeholder replacement...');
    // Generic placeholder replacement for templates without specific handlers
    const name = this.escapeLatex(data.personalInfo?.fullName || data.personalInfo?.name || '');
    const email = this.escapeLatex(data.personalInfo?.email || '');
    const phone = this.escapeLatex(data.personalInfo?.phone || '');
    const location = this.escapeLatex(data.personalInfo?.location || '');
    const summary = this.escapeLatex(data.summary || data.professionalSummary || '');
    const linkedin = data.personalInfo?.linkedin || '';
    const github = data.personalInfo?.github || '';
    const website = data.personalInfo?.website || '';
    
    // Replace common placeholders
    content = content.replace(/\{\{name\}\}/g, name);
    content = content.replace(/\{\{email\}\}/g, email);
    content = content.replace(/\{\{phone\}\}/g, phone);
    content = content.replace(/\{\{location\}\}/g, location);
    content = content.replace(/\{\{summary\}\}/g, summary);
    
    // Replace uppercase placeholders
    content = content.replace(/FULL_NAME/g, name);
    content = content.replace(/EMAIL/g, email);
    content = content.replace(/PHONE/g, phone);
    content = content.replace(/PHONE_NUMBER/g, phone);
    content = content.replace(/LOCATION/g, location);
    content = content.replace(/SUMMARY/g, summary);
    
    // Replace LaTeX command placeholders
    content = content.replace(/\\name\{[^}]*\}/g, `\\name{${name}}`);
    content = content.replace(/\\email\{[^}]*\}/g, `\\email{${email}}`);
    content = content.replace(/\\phone\{[^}]*\}/g, `\\phone{${phone}}`);
    content = content.replace(/\\location\{[^}]*\}/g, `\\location{${location}}`);
    
    if (linkedin) {
      const linkedinId = linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
      content = content.replace(/LINKEDIN_USERNAME/g, this.escapeLatex(linkedinId));
      content = content.replace(/\\linkedin\{[^}]*\}/g, `\\linkedin{${this.escapeLatex(linkedinId)}}`);
    }
    if (github) {
      const githubId = github.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
      content = content.replace(/GITHUB_USERNAME/g, this.escapeLatex(githubId));
      content = content.replace(/\\github\{[^}]*\}/g, `\\github{${this.escapeLatex(githubId)}}`);
    }
    if (website) {
      content = content.replace(/HOMEPAGE_URL/g, website);
      content = content.replace(/\\homepage\{[^}]*\}/g, `\\homepage{${website}}`);
    }
    
    console.log(`✅ Generic placeholders replaced: name=${!!name}, email=${!!email}, phone=${!!phone}`);
    return content;
  }
}

export default new LaTeXService();
