import { describe, expect, it, vi } from 'vitest';

// Mock pdfjs-dist to avoid worker side-effects
vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn(),
}));

import { detectTemplate, parseResumeFromText } from './pdf-parser';

describe('detectTemplate', () => {
    it('detects developer template by // WORK EXPERIENCE', () => {
        expect(detectTemplate('Some text // WORK EXPERIENCE more text')).toBe('developer');
    });

    it('detects developer template by // TECH STACK', () => {
        expect(detectTemplate('// TECH STACK')).toBe('developer');
    });

    it('detects default template by PROFESSIONAL EXPERIENCE', () => {
        expect(detectTemplate('PROFESSIONAL EXPERIENCE section')).toBe('default');
    });

    it('detects default template by CORE COMPETENCIES', () => {
        expect(detectTemplate('CORE COMPETENCIES')).toBe('default');
    });

    it('detects veterinary template by SPECIAL INTERESTS', () => {
        expect(detectTemplate('SPECIAL INTERESTS in animals')).toBe('veterinary');
    });

    it('defaults to developer when no markers found', () => {
        expect(detectTemplate('Just some random text')).toBe('developer');
    });
});

describe('parseResumeFromText — developer template', () => {
    const developerText = [
        'John Doe',
        'Senior Developer',
        'john@example.com',
        '+48 123 456 789',
        'Warsaw, Poland',
        '// WORK EXPERIENCE',
        'ACME Corp | Frontend Developer',
        'January 2023 - Present | Warsaw',
        '• Built amazing features',
        '• Improved performance',
        '// EDUCATION',
        'Computer Science',
        '2019 - 2023 | MIT',
        '// TECH STACK',
        'TypeScript React Node.js',
        '// LANGUAGES',
        'Polish\tNATIVE',
        'English\tC2',
        '// INTERESTS',
        'Hiking  Photography',
    ].join('\n');

    it('parses personal info', () => {
        const result = parseResumeFromText(developerText, 'developer');
        expect(result.personalInfo.firstName).toBe('John');
        expect(result.personalInfo.lastName).toBe('Doe');
        expect(result.personalInfo.email).toBe('john@example.com');
    });

    it('sets templateId to developer', () => {
        const result = parseResumeFromText(developerText, 'developer');
        expect(result.templateId).toBe('developer');
    });

    it('parses experiences', () => {
        const result = parseResumeFromText(developerText, 'developer');
        expect(result.experiences.length).toBeGreaterThanOrEqual(1);
        expect(result.experiences[0].company).toBe('ACME Corp');
        expect(result.experiences[0].position).toBe('Frontend Developer');
        expect(result.experiences[0].current).toBe(true);
    });

    it('parses skills from TECH STACK', () => {
        const result = parseResumeFromText(developerText, 'developer');
        const skillNames = result.skills.map((s) => s.name);
        expect(skillNames).toContain('TypeScript');
        expect(skillNames).toContain('React');
    });

    it('parses languages with proficiency', () => {
        const result = parseResumeFromText(developerText, 'developer');
        expect(result.languages.length).toBeGreaterThanOrEqual(1);
        const polish = result.languages.find((l) => l.language === 'Polish');
        expect(polish?.proficiency).toBe('NATIVE');
    });

    it('parses interests', () => {
        const result = parseResumeFromText(developerText, 'developer');
        const interestNames = result.interests.map((i) => i.name);
        expect(interestNames).toContain('Hiking');
    });
});

describe('parseResumeFromText — default template', () => {
    const defaultText = [
        'Jane Smith',
        'Product Manager',
        'jane@company.com',
        'PROFESSIONAL EXPERIENCE',
        'BigCo | Product Lead',
        'March 2022 - December 2023',
        '• Led product strategy',
        'EDUCATION',
        'MBA in Business Administration',
        '2018 - 2020 | Harvard',
        'CORE COMPETENCIES',
        'Leadership Strategy',
        'LANGUAGES',
        'English\tNATIVE',
        'INTERESTS',
        'Reading',
    ].join('\n');

    it('parses with templateId default', () => {
        const result = parseResumeFromText(defaultText, 'default');
        expect(result.templateId).toBe('default');
    });

    it('parses personal info', () => {
        const result = parseResumeFromText(defaultText, 'default');
        expect(result.personalInfo.firstName).toBe('Jane');
        expect(result.personalInfo.lastName).toBe('Smith');
    });

    it('parses Core Competencies as skills', () => {
        const result = parseResumeFromText(defaultText, 'default');
        const skillNames = result.skills.map((s) => s.name);
        expect(skillNames).toContain('Leadership');
    });
});

describe('parseResumeFromText — veterinary template', () => {
    const vetText = [
        'Anna Kowalska',
        'Veterinarian',
        'anna@vet.com',
        'Work Experience',
        'Happy Pets Clinic | Vet Surgeon',
        'June 2021 - Present',
        '• Performed surgeries',
        'EDUCATION',
        'Veterinary Medicine',
        '2015 - 2021 | Warsaw University',
        'SKILLS',
        'Surgery Diagnostics',
        'LANGUAGES',
        'Polish\tNATIVE',
        'SPECIAL INTERESTS',
        'Animal welfare',
    ].join('\n');

    it('parses with templateId veterinary', () => {
        const result = parseResumeFromText(vetText, 'veterinary');
        expect(result.templateId).toBe('veterinary');
    });

    it('parses personal info', () => {
        const result = parseResumeFromText(vetText, 'veterinary');
        expect(result.personalInfo.firstName).toBe('Anna');
        expect(result.personalInfo.lastName).toBe('Kowalska');
    });

    it('parses skills section', () => {
        const result = parseResumeFromText(vetText, 'veterinary');
        const skillNames = result.skills.map((s) => s.name);
        expect(skillNames).toContain('Surgery');
    });
});
