import { describe, expect, it } from 'vitest';

import { generateResumeFilename } from './pdf-export';

describe('generateResumeFilename', () => {
    it('builds filename from first and last name', () => {
        expect(generateResumeFilename('John', 'Doe')).toBe('John-Doe-Resume.pdf');
    });

    it('uses only first name when last name is missing', () => {
        expect(generateResumeFilename('John')).toBe('John-Resume.pdf');
    });

    it('uses only last name when first name is missing', () => {
        expect(generateResumeFilename(undefined, 'Doe')).toBe('Doe-Resume.pdf');
    });

    it('falls back to "my" when no names provided', () => {
        expect(generateResumeFilename()).toBe('my-Resume.pdf');
    });

    it('falls back to "my" when names are empty strings', () => {
        expect(generateResumeFilename('', '')).toBe('my-Resume.pdf');
    });
});
