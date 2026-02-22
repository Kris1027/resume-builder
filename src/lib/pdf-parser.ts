import type { ResumeFormValues, LanguageLevelProps } from '@/types/form-types';
import type { TemplateId } from '@/lib/template-ids';
import i18n from '@/i18n/config';

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

function getPdfjs(): Promise<typeof import('pdfjs-dist')> {
    if (!pdfjsPromise) {
        pdfjsPromise = import('pdfjs-dist').then((mod) => {
            mod.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
            return mod;
        });
    }
    return pdfjsPromise;
}

/**
 * Extract text content from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    const pdfjsLib = await getPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

/**
 * Detect which template was used to generate the PDF
 */
export function detectTemplate(text: string): TemplateId {
    // Developer template uses // prefixes
    if (text.includes('// WORK EXPERIENCE') || text.includes('// TECH STACK')) {
        return 'developer';
    }
    // Veterinary template uses Special Interests section
    if (text.includes('SPECIAL INTERESTS')) {
        return 'veterinary';
    }
    // Default template uses Professional Experience
    if (text.includes('PROFESSIONAL EXPERIENCE') || text.includes('CORE COMPETENCIES')) {
        return 'default';
    }
    // Default to developer if can't detect
    return 'developer';
}

/**
 * Parse resume data from extracted PDF text
 */
export function parseResumeFromText(text: string, templateId: TemplateId): ResumeFormValues {
    const lines = text
        .split(/\n|\s{2,}/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    if (templateId === 'developer') {
        return parseDeveloperTemplate(lines);
    } else if (templateId === 'default') {
        return parseDefaultTemplate(lines);
    } else if (templateId === 'veterinary') {
        return parseVeterinaryTemplate(lines);
    }

    return parseDeveloperTemplate(lines);
}

/**
 * Parse the Developer template format
 */
function parseDeveloperTemplate(lines: string[]): ResumeFormValues {
    const result = createEmptyResume('developer');

    // Find section markers
    const workExpIndex = lines.findIndex((l) => l.includes('// WORK EXPERIENCE'));
    const educationIndex = lines.findIndex((l) => l.includes('// EDUCATION'));
    const techStackIndex = lines.findIndex((l) => l.includes('// TECH STACK'));
    const languagesIndex = lines.findIndex((l) => l.includes('// LANGUAGES'));
    const interestsIndex = lines.findIndex((l) => l.includes('// INTERESTS'));

    // Parse header (before work experience)
    if (workExpIndex > 0) {
        const headerLines = lines.slice(0, workExpIndex);
        result.personalInfo = parseHeaderInfo(headerLines);
    }

    // Parse work experience
    if (workExpIndex >= 0) {
        const endIndex = findNextSection(
            [educationIndex, techStackIndex, languagesIndex, interestsIndex],
            workExpIndex,
            lines.length,
        );
        const expLines = lines.slice(workExpIndex + 1, endIndex);
        result.experiences = parseExperiences(expLines);
    }

    // Parse education
    if (educationIndex >= 0) {
        const endIndex = findNextSection(
            [techStackIndex, languagesIndex, interestsIndex],
            educationIndex,
            lines.length,
        );
        const eduLines = lines.slice(educationIndex + 1, endIndex);
        result.education = parseEducation(eduLines);
    }

    // Parse tech stack (skills)
    if (techStackIndex >= 0) {
        const endIndex = findNextSection(
            [languagesIndex, interestsIndex],
            techStackIndex,
            lines.length,
        );
        const skillLines = lines.slice(techStackIndex + 1, endIndex);
        result.skills = parseSkills(skillLines);
    }

    // Parse languages
    if (languagesIndex >= 0) {
        const endIndex = findNextSection([interestsIndex], languagesIndex, lines.length);
        const langLines = lines.slice(languagesIndex + 1, endIndex);
        result.languages = parseLanguages(langLines);
    }

    // Parse interests
    if (interestsIndex >= 0) {
        const interestLines = lines.slice(interestsIndex + 1);
        result.interests = parseInterests(interestLines);
    }

    return result;
}

/**
 * Parse the Default template format
 */
function parseDefaultTemplate(lines: string[]): ResumeFormValues {
    const result = createEmptyResume('default');

    // Find section markers (uppercase headers)
    const profExpIndex = lines.findIndex(
        (l) => l === 'Professional Experience' || l === 'PROFESSIONAL EXPERIENCE',
    );
    const educationIndex = lines.findIndex((l) => l === 'Education' || l === 'EDUCATION');
    const competenciesIndex = lines.findIndex(
        (l) => l === 'Core Competencies' || l === 'CORE COMPETENCIES',
    );
    const languagesIndex = lines.findIndex((l) => l === 'Languages' || l === 'LANGUAGES');
    const interestsIndex = lines.findIndex((l) => l === 'Interests' || l === 'INTERESTS');

    // Parse header
    if (profExpIndex > 0) {
        const headerLines = lines.slice(0, profExpIndex);
        result.personalInfo = parseHeaderInfo(headerLines);
    }

    // Parse work experience
    if (profExpIndex >= 0) {
        const endIndex = findNextSection(
            [educationIndex, competenciesIndex, languagesIndex, interestsIndex],
            profExpIndex,
            lines.length,
        );
        const expLines = lines.slice(profExpIndex + 1, endIndex);
        result.experiences = parseExperiences(expLines);
    }

    // Parse education
    if (educationIndex >= 0) {
        const endIndex = findNextSection(
            [competenciesIndex, languagesIndex, interestsIndex],
            educationIndex,
            lines.length,
        );
        const eduLines = lines.slice(educationIndex + 1, endIndex);
        result.education = parseEducation(eduLines);
    }

    // Parse skills (Core Competencies)
    if (competenciesIndex >= 0) {
        const endIndex = findNextSection(
            [languagesIndex, interestsIndex],
            competenciesIndex,
            lines.length,
        );
        const skillLines = lines.slice(competenciesIndex + 1, endIndex);
        result.skills = parseSkills(skillLines);
    }

    // Parse languages
    if (languagesIndex >= 0) {
        const endIndex = findNextSection([interestsIndex], languagesIndex, lines.length);
        const langLines = lines.slice(languagesIndex + 1, endIndex);
        result.languages = parseLanguages(langLines);
    }

    // Parse interests
    if (interestsIndex >= 0) {
        const interestLines = lines.slice(interestsIndex + 1);
        result.interests = parseInterests(interestLines);
    }

    return result;
}

/**
 * Parse the Veterinary template format
 */
function parseVeterinaryTemplate(lines: string[]): ResumeFormValues {
    const result = createEmptyResume('veterinary');

    // Find section markers
    const workExpIndex = lines.findIndex((l) => l.includes('Work Experience'));
    const educationIndex = lines.findIndex(
        (l) => l.includes('Education') || l.includes('EDUCATION'),
    );
    const skillsIndex = lines.findIndex((l) => l === 'Skills' || l === 'SKILLS');
    const languagesIndex = lines.findIndex((l) => l === 'Languages' || l === 'LANGUAGES');
    const interestsIndex = lines.findIndex(
        (l) => l.includes('SPECIAL INTERESTS') || l === 'Interests',
    );

    // Parse header
    if (workExpIndex > 0) {
        const headerLines = lines.slice(0, workExpIndex);
        result.personalInfo = parseHeaderInfo(headerLines);
    }

    // Parse work experience
    if (workExpIndex >= 0) {
        const endIndex = findNextSection(
            [educationIndex, skillsIndex, languagesIndex, interestsIndex],
            workExpIndex,
            lines.length,
        );
        const expLines = lines.slice(workExpIndex + 1, endIndex);
        result.experiences = parseExperiences(expLines);
    }

    // Parse education
    if (educationIndex >= 0) {
        const endIndex = findNextSection(
            [skillsIndex, languagesIndex, interestsIndex],
            educationIndex,
            lines.length,
        );
        const eduLines = lines.slice(educationIndex + 1, endIndex);
        result.education = parseEducation(eduLines);
    }

    // Parse skills
    if (skillsIndex >= 0) {
        const endIndex = findNextSection(
            [languagesIndex, interestsIndex],
            skillsIndex,
            lines.length,
        );
        const skillLines = lines.slice(skillsIndex + 1, endIndex);
        result.skills = parseSkills(skillLines);
    }

    // Parse languages
    if (languagesIndex >= 0) {
        const endIndex = findNextSection([interestsIndex], languagesIndex, lines.length);
        const langLines = lines.slice(languagesIndex + 1, endIndex);
        result.languages = parseLanguages(langLines);
    }

    // Parse interests
    if (interestsIndex >= 0) {
        const interestLines = lines.slice(interestsIndex + 1);
        result.interests = parseInterests(interestLines);
    }

    return result;
}

/**
 * Parse header/contact information
 */
function parseHeaderInfo(lines: string[]): ResumeFormValues['personalInfo'] {
    const info: ResumeFormValues['personalInfo'] = {
        firstName: '',
        lastName: '',
        location: '',
        title: '',
        phone: '',
        email: '',
        website: '',
        linkedin: '',
        github: '',
    };

    // First line is usually the name
    if (lines.length > 0) {
        const nameParts = lines[0].split(' ');
        if (nameParts.length >= 2) {
            info.firstName = nameParts[0];
            info.lastName = nameParts.slice(1).join(' ');
        } else {
            info.firstName = lines[0];
        }
    }

    // Second line is usually the title
    if (lines.length > 1 && !isContactInfo(lines[1])) {
        info.title = lines[1];
    }

    // Parse contact info from remaining lines
    for (const line of lines) {
        // Email
        const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) {
            info.email = emailMatch[0];
        }

        // Phone (international format)
        const phoneMatch = line.match(/\+?\d[\d\s()-]{8,}/);
        if (phoneMatch) {
            info.phone = phoneMatch[0].replace(/\s/g, '');
        }

        // Website (domain without protocol)
        const websiteMatch = line.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
        if (websiteMatch && !line.includes('github') && !line.includes('linkedin')) {
            info.website = websiteMatch[0].startsWith('http')
                ? websiteMatch[0]
                : `https://${websiteMatch[0]}`;
        }

        // GitHub username or URL
        if (line.toLowerCase().includes('github') || /^[A-Za-z0-9-]+$/.test(line)) {
            const githubMatch = line.match(/github\.com\/([A-Za-z0-9_-]+)/i);
            if (githubMatch) {
                info.github = `https://github.com/${githubMatch[1]}`;
            } else if (
                lines.indexOf(line) > 1 &&
                /^[A-Za-z0-9_-]+$/.test(line) &&
                line.length < 30
            ) {
                // Might be a username like "Kris1027"
                info.github = `https://github.com/${line}`;
            }
        }

        // LinkedIn
        if (line.toLowerCase().includes('linkedin')) {
            const linkedinMatch = line.match(/linkedin\.com\/in\/([A-Za-z0-9_-]+)/i);
            if (linkedinMatch) {
                info.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
            } else {
                // Just the username like "krzysztof-obarzanek"
                const usernameMatch = line.match(/[a-zA-Z]+-[a-zA-Z]+/);
                if (usernameMatch) {
                    info.linkedin = `https://linkedin.com/in/${usernameMatch[0]}`;
                }
            }
        }

        // Location (City, Country pattern)
        const locationMatch = line.match(
            /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
        );
        if (locationMatch && !info.location) {
            info.location = locationMatch[0];
        }
    }

    return info;
}

/**
 * Parse work experience entries
 */
function parseExperiences(lines: string[]): ResumeFormValues['experiences'] {
    const experiences: ResumeFormValues['experiences'] = [];
    let currentExp: ResumeFormValues['experiences'][0] | null = null;
    let descriptionLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for "Company | Position" pattern
        const companyPositionMatch = line.match(/^(.+?)\s*\|\s*(.+)$/);
        if (companyPositionMatch && !line.match(/\d{4}/)) {
            // Save previous experience
            if (currentExp) {
                currentExp.description = descriptionLines.join('\n');
                experiences.push(currentExp);
                descriptionLines = [];
            }

            currentExp = {
                company: companyPositionMatch[1].trim(),
                position: companyPositionMatch[2].trim(),
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                description: '',
            };
            continue;
        }

        // Check for date line pattern: "Month Year - Month Year | Location"
        const dateMatch = line.match(
            /(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|Present)\s*(?:\|\s*(.+))?/,
        );
        if (dateMatch && currentExp) {
            currentExp.startDate = parseMonthYear(dateMatch[1]);
            if (dateMatch[2].toLowerCase() === 'present') {
                currentExp.current = true;
                currentExp.endDate = '';
            } else {
                currentExp.endDate = parseMonthYear(dateMatch[2]);
            }
            if (dateMatch[3]) {
                currentExp.location = dateMatch[3].trim();
            }
            continue;
        }

        // Bullet point descriptions
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            descriptionLines.push(line);
        } else if (currentExp && descriptionLines.length > 0 && !isNewEntry(line)) {
            // Continuation of previous bullet point
            descriptionLines[descriptionLines.length - 1] += ' ' + line;
        }
    }

    // Save last experience
    if (currentExp) {
        currentExp.description = descriptionLines.join('\n');
        experiences.push(currentExp);
    }

    return experiences;
}

/**
 * Parse education entries
 */
function parseEducation(lines: string[]): ResumeFormValues['education'] {
    const education: ResumeFormValues['education'] = [];
    let currentEdu: ResumeFormValues['education'][0] | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for "Degree in Field" pattern (business template)
        const degreeFieldMatch = line.match(/^(.+?)\s+in\s+(.+)$/i);
        if (degreeFieldMatch) {
            if (currentEdu) education.push(currentEdu);
            currentEdu = {
                institution: '',
                degree: degreeFieldMatch[1].trim(),
                field: degreeFieldMatch[2].trim(),
                startDate: '',
                endDate: '',
                description: '',
            };
            continue;
        }

        // Check for field name only (modern template - field is emphasized)
        if (!currentEdu && line.length > 0 && !line.match(/^\d{4}/) && !line.includes('|')) {
            currentEdu = {
                institution: '',
                degree: '',
                field: line,
                startDate: '',
                endDate: '',
                description: '',
            };
            continue;
        }

        // Check for "YYYY - YYYY | Institution" pattern
        const yearInstMatch = line.match(/(\d{4})\s*[-–]\s*(\d{4})\s*\|\s*(.+)/);
        if (yearInstMatch && currentEdu) {
            currentEdu.startDate = `${yearInstMatch[1]}-01`;
            currentEdu.endDate = `${yearInstMatch[2]}-01`;
            currentEdu.institution = yearInstMatch[3].trim();
            education.push(currentEdu);
            currentEdu = null;
            continue;
        }

        // Alternative: "YYYY – YYYY" on one line, institution on next
        const yearOnlyMatch = line.match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
        if (yearOnlyMatch && currentEdu) {
            currentEdu.startDate = `${yearOnlyMatch[1]}-01`;
            currentEdu.endDate = `${yearOnlyMatch[2]}-01`;
            // Check if next line is institution
            if (i + 1 < lines.length && !lines[i + 1].match(/^\d{4}/)) {
                currentEdu.institution = lines[i + 1];
                i++; // Skip next line
            }
            education.push(currentEdu);
            currentEdu = null;
            continue;
        }
    }

    // Don't forget the last one
    if (currentEdu) {
        education.push(currentEdu);
    }

    return education;
}

/**
 * Parse skills from skill tags/list
 */
function parseSkills(lines: string[]): ResumeFormValues['skills'] {
    const skills: ResumeFormValues['skills'] = [];
    const seenSkills = new Set<string>();

    for (const line of lines) {
        // Skills might be on same line separated by spaces or on separate lines
        // Common tech skills have specific patterns
        const words = line.split(/\s+/);

        for (const word of words) {
            const cleanWord = word.trim();
            if (cleanWord.length > 0 && !seenSkills.has(cleanWord.toLowerCase())) {
                // Filter out common non-skill words
                if (!isCommonWord(cleanWord)) {
                    seenSkills.add(cleanWord.toLowerCase());
                    skills.push({ name: cleanWord });
                }
            }
        }
    }

    return skills;
}

/**
 * Parse language entries with proficiency
 */
function parseLanguages(lines: string[]): ResumeFormValues['languages'] {
    const languages: ResumeFormValues['languages'] = [];
    const validProficiencies: LanguageLevelProps[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE'];

    for (const line of lines) {
        // Pattern: "Language    Proficiency" or "Language - Proficiency"
        const parts = line.split(/\s{2,}|\s*[-–]\s*|\t/);

        if (parts.length >= 2) {
            const language = parts[0].trim();
            let proficiency = parts[parts.length - 1].trim().toUpperCase();

            // Handle "Native" -> "NATIVE"
            if (proficiency === 'NATIVE' || proficiency.toLowerCase() === 'native') {
                proficiency = 'NATIVE';
            }

            if (validProficiencies.includes(proficiency as LanguageLevelProps)) {
                languages.push({
                    language,
                    proficiency: proficiency as LanguageLevelProps,
                });
            }
        } else if (line.includes('Native') || line.includes('NATIVE')) {
            // Handle "Polish Native" pattern
            const langMatch = line.match(/^(\w+)\s+(?:Native|NATIVE)/);
            if (langMatch) {
                languages.push({
                    language: langMatch[1],
                    proficiency: 'NATIVE',
                });
            }
        }
    }

    return languages;
}

/**
 * Parse interests from tags/list
 */
function parseInterests(lines: string[]): ResumeFormValues['interests'] {
    const interests: ResumeFormValues['interests'] = [];
    const seenInterests = new Set<string>();

    for (const line of lines) {
        // Interests might be separated by bullets, spaces, or on separate lines
        const parts = line.split(/[•·,]|\s{2,}/);

        for (const part of parts) {
            const cleanPart = part.trim();
            if (cleanPart.length > 1 && !seenInterests.has(cleanPart.toLowerCase())) {
                // Multi-word interests like "PC Building" or "Nature Trekking"
                if (!isCommonWord(cleanPart)) {
                    seenInterests.add(cleanPart.toLowerCase());
                    interests.push({ name: cleanPart });
                }
            }
        }
    }

    return interests;
}

// Helper functions

function createEmptyResume(templateId: TemplateId): ResumeFormValues {
    return {
        templateId,
        personalInfo: {
            firstName: '',
            lastName: '',
            location: '',
            title: '',
            phone: '',
            email: '',
            website: '',
            linkedin: '',
            github: '',
        },
        experiences: [],
        education: [],
        skills: [],
        languages: [],
        interests: [],
        gdprConsent: { enabled: false, companyName: '' },
    };
}

function findNextSection(indices: number[], currentIndex: number, defaultEnd: number): number {
    const validIndices = indices.filter((i) => i > currentIndex);
    return validIndices.length > 0 ? Math.min(...validIndices) : defaultEnd;
}

function parseMonthYear(dateStr: string): string {
    const months: Record<string, string> = {
        january: '01',
        february: '02',
        march: '03',
        april: '04',
        may: '05',
        june: '06',
        july: '07',
        august: '08',
        september: '09',
        october: '10',
        november: '11',
        december: '12',
        jan: '01',
        feb: '02',
        mar: '03',
        apr: '04',
        jun: '06',
        jul: '07',
        aug: '08',
        sep: '09',
        oct: '10',
        nov: '11',
        dec: '12',
    };

    const parts = dateStr.toLowerCase().split(/\s+/);
    const month = months[parts[0]] || '01';
    const year = parts[1] || new Date().getFullYear().toString();

    return `${year}-${month}`;
}

function isContactInfo(line: string): boolean {
    return (
        line.includes('@') ||
        line.includes('+') ||
        line.match(/\d{3,}/) !== null ||
        line.includes('.com') ||
        line.includes('.eu') ||
        line.includes('linkedin') ||
        line.includes('github')
    );
}

function isNewEntry(line: string): boolean {
    return (
        line.includes('|') || line.match(/^\w+\s+\d{4}/) !== null || line.match(/^[A-Z]/) !== null
    );
}

function isCommonWord(word: string): boolean {
    const common = [
        'the',
        'and',
        'or',
        'a',
        'an',
        'in',
        'on',
        'at',
        'to',
        'for',
        'of',
        'with',
        '|',
        '-',
        '–',
    ];
    return common.includes(word.toLowerCase()) || word.length < 2;
}

/**
 * Extract resume data from PDF metadata (keywords field)
 */
export async function extractResumeDataFromMetadata(file: File): Promise<ResumeFormValues | null> {
    const pdfjsLib = await getPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const metadata = await pdf.getMetadata();

    // Check if resume data is stored in keywords
    const info = metadata?.info as Record<string, unknown> | undefined;
    if (info?.Keywords && typeof info.Keywords === 'string') {
        try {
            const resumeData = JSON.parse(info.Keywords);
            return resumeData as ResumeFormValues;
        } catch {
            // Keywords is not valid JSON
        }
    }

    return null;
}

/**
 * Main function to load resume from PDF file
 * Only works with PDFs created by this app (with embedded metadata)
 */
export async function loadResumeFromPDF(file: File): Promise<ResumeFormValues> {
    const metadataResult = await extractResumeDataFromMetadata(file);
    if (metadataResult) {
        return metadataResult;
    }

    // PDF doesn't have embedded resume data - not created by this app
    throw new Error(i18n.t('dialogs.pdfError.notFromApp'));
}
