/**
 * Resume Validator - Validation schemas for resume data
 */

import { createValidator } from '../middleware/validation.middleware.js';

/**
 * Schema for personal information
 */
export const personalInfoSchema = {
  fullName: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  email: { type: 'string', required: true, email: true, maxLength: 255 },
  phone: { type: 'string', required: false, phone: true, maxLength: 20 },
  location: { type: 'string', required: false, maxLength: 100 }
};

/**
 * Schema for work experience entry
 */
export const experienceEntrySchema = {
  company: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  position: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  startDate: { type: 'string', required: false, maxLength: 50 },
  endDate: { type: 'string', required: false, maxLength: 50 },
  responsibilities: { type: 'array', required: true, minLength: 1, maxLength: 20 }
};

/**
 * Schema for education entry
 */
export const educationEntrySchema = {
  institution: { type: 'string', required: true, minLength: 1, maxLength: 200 },
  degree: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  field: { type: 'string', required: false, maxLength: 100 },
  graduationDate: { type: 'string', required: false, maxLength: 50 },
  gpa: { type: 'string', required: false, maxLength: 10 }
};

/**
 * Schema for skills
 */
export const skillsSchema = {
  technical: { type: 'array', required: false, maxLength: 50 },
  soft: { type: 'array', required: false, maxLength: 30 }
};

/**
 * Schema for project entry
 */
export const projectEntrySchema = {
  title: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  description: { type: 'string', required: false, maxLength: 1000 },
  technologies: { type: 'array', required: false, maxLength: 20 },
  link: { type: 'string', required: false, maxLength: 500 }
};

/**
 * Schema for certification entry
 */
export const certificationEntrySchema = {
  name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
  issuer: { type: 'string', required: false, maxLength: 200 },
  date: { type: 'string', required: false, maxLength: 50 }
};

/**
 * Validate personal information
 */
export const validatePersonalInfo = createValidator(personalInfoSchema);

/**
 * Validate complete resume data structure
 */
export function validateResumeData(data) {
  const errors = [];
  const sanitized = {};
  
  // Validate personal info
  if (data.personalInfo) {
    const personalInfoValidation = validatePersonalInfo(data.personalInfo);
    if (personalInfoValidation.error) {
      errors.push(...personalInfoValidation.error.details.map(d => `Personal Info: ${d}`));
    } else {
      sanitized.personalInfo = personalInfoValidation.value;
    }
  } else {
    errors.push('Personal information is required');
  }
  
  // Validate professional summary (optional but if provided, validate)
  if (data.professionalSummary !== undefined) {
    if (typeof data.professionalSummary !== 'string') {
      errors.push('Professional summary must be a string');
    } else if (data.professionalSummary.length > 2000) {
      errors.push('Professional summary must be less than 2000 characters');
    } else {
      sanitized.professionalSummary = data.professionalSummary.trim();
    }
  }
  
  // Validate experience array
  if (data.experience) {
    if (!Array.isArray(data.experience)) {
      errors.push('Experience must be an array');
    } else if (data.experience.length > 20) {
      errors.push('Experience array cannot have more than 20 entries');
    } else {
      sanitized.experience = data.experience.map((exp, idx) => {
        const expValidation = createValidator(experienceEntrySchema)(exp);
        if (expValidation.error) {
          errors.push(...expValidation.error.details.map(d => `Experience ${idx + 1}: ${d}`));
          return null;
        }
        return expValidation.value;
      }).filter(Boolean);
    }
  } else {
    sanitized.experience = [];
  }
  
  // Validate education array
  if (data.education) {
    if (!Array.isArray(data.education)) {
      errors.push('Education must be an array');
    } else if (data.education.length > 10) {
      errors.push('Education array cannot have more than 10 entries');
    } else {
      sanitized.education = data.education.map((edu, idx) => {
        const eduValidation = createValidator(educationEntrySchema)(edu);
        if (eduValidation.error) {
          errors.push(...eduValidation.error.details.map(d => `Education ${idx + 1}: ${d}`));
          return null;
        }
        return eduValidation.value;
      }).filter(Boolean);
    }
  } else {
    sanitized.education = [];
  }
  
  // Validate skills
  if (data.skills) {
    const skillsValidation = createValidator(skillsSchema)(data.skills);
    if (skillsValidation.error) {
      errors.push(...skillsValidation.error.details.map(d => `Skills: ${d}`));
    } else {
      sanitized.skills = skillsValidation.value;
    }
  }
  
  // Validate projects array
  if (data.projects) {
    if (!Array.isArray(data.projects)) {
      errors.push('Projects must be an array');
    } else if (data.projects.length > 20) {
      errors.push('Projects array cannot have more than 20 entries');
    } else {
      sanitized.projects = data.projects.map((proj, idx) => {
        const projValidation = createValidator(projectEntrySchema)(proj);
        if (projValidation.error) {
          errors.push(...projValidation.error.details.map(d => `Project ${idx + 1}: ${d}`));
          return null;
        }
        return projValidation.value;
      }).filter(Boolean);
    }
  }
  
  // Validate certifications array
  if (data.certifications) {
    if (!Array.isArray(data.certifications)) {
      errors.push('Certifications must be an array');
    } else if (data.certifications.length > 30) {
      errors.push('Certifications array cannot have more than 30 entries');
    } else {
      sanitized.certifications = data.certifications.map((cert, idx) => {
        const certValidation = createValidator(certificationEntrySchema)(cert);
        if (certValidation.error) {
          errors.push(...certValidation.error.details.map(d => `Certification ${idx + 1}: ${d}`));
          return null;
        }
        return certValidation.value;
      }).filter(Boolean);
    }
  }
  
  // Validate achievements array
  if (data.achievements) {
    if (!Array.isArray(data.achievements)) {
      errors.push('Achievements must be an array');
    } else if (data.achievements.length > 50) {
      errors.push('Achievements array cannot have more than 50 entries');
    } else {
      sanitized.achievements = data.achievements.filter(ach => typeof ach === 'string' && ach.trim().length > 0 && ach.length <= 500);
    }
  }
  
  // Validate selectedLayout
  if (data.selectedLayout) {
    if (typeof data.selectedLayout !== 'string' || data.selectedLayout.length > 100) {
      errors.push('Selected layout must be a valid string');
    } else {
      sanitized.selectedLayout = data.selectedLayout.trim();
    }
  }
  
  if (errors.length > 0) {
    return {
      error: {
        message: 'Resume validation failed',
        details: errors
      }
    };
  }
  
  return { error: null, value: sanitized };
}


