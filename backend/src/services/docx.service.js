/**
 * DOCX Service
 * 
 * Provides minimal DOCX generation so the export flow can work.
 * This creates a simple, well-structured resume document using the `docx` package.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureTempDir() {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

function makeHeading(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { after: 150 },
  });
}

function makeBullets(items = []) {
  return items.map((item) =>
    new Paragraph({
      text: item,
      bullet: { level: 0 },
      spacing: { after: 80 },
    }),
  );
}

/**
 * Generate a DOCX file and return its absolute path.
 */
export async function generateDOCX(resumeData = {}) {
  const {
    personalInfo = {},
    summary = '',
    experience = [],
    education = [],
    skills = {},
  } = resumeData;

  const docChildren = [];

  // Header: Name + Contacts
  const fullName = personalInfo.fullName || 'YOUR NAME';
  const header = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({ text: fullName, bold: true, size: 36 }),
      new TextRun({
        text: '\n',
      }),
      new TextRun({
        text: [personalInfo.email, personalInfo.phone, personalInfo.location]
          .filter(Boolean)
          .join(' | '),
        size: 20,
      }),
    ],
  });
  docChildren.push(header);

  // Summary
  if (summary) {
    docChildren.push(makeHeading('Summary'));
    docChildren.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: summary, size: 22 })],
      }),
    );
  }

  // Experience
  if (Array.isArray(experience) && experience.length > 0) {
    docChildren.push(makeHeading('Experience'));
    experience.forEach((exp) => {
      const headerLine = [
        exp.position,
        exp.company && `@ ${exp.company}`,
      ]
        .filter(Boolean)
        .join(' ');
      const period = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');

      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: headerLine || 'Role', bold: true, size: 24 }),
            new TextRun({ text: period ? `  •  ${period}` : '', size: 20 }),
          ],
        }),
      );

      if (Array.isArray(exp.responsibilities) && exp.responsibilities.length) {
        docChildren.push(...makeBullets(exp.responsibilities));
      }

      docChildren.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    });
  }

  // Education
  if (Array.isArray(education) && education.length > 0) {
    docChildren.push(makeHeading('Education'));
    education.forEach((edu) => {
      const line = [
        edu.degree,
        edu.institution && `- ${edu.institution}`,
        edu.graduationDate && `(${edu.graduationDate})`,
      ]
        .filter(Boolean)
        .join(' ');
      docChildren.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: line || 'Education', size: 22 })],
        }),
      );
    });
  }

  // Skills
  const skillGroups = [
    ['Technical', skills.technical],
    ['Soft Skills', skills.soft],
    ['Languages', skills.languages],
  ].filter(([, val]) => Array.isArray(val) && val.length > 0);

  if (skillGroups.length > 0) {
    docChildren.push(makeHeading('Skills'));
    skillGroups.forEach(([label, list]) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true, size: 22 }),
            new TextRun({ text: list.join(', '), size: 22 }),
          ],
          spacing: { after: 120 },
        }),
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const tempDir = ensureTempDir();
  const fileName = `resume_${uuidv4()}.docx`;
  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

export default { generateDOCX };









