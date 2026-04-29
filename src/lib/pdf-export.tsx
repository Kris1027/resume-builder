import type { ResumeData } from '@/types/form-types';
import type { TemplateId } from '@/lib/template-ids';

export interface PDFExportOptions {
    filename?: string;
    singlePage?: boolean;
}

export async function exportToPDF(
    resumeData: ResumeData,
    templateId: TemplateId,
    options: PDFExportOptions = {},
): Promise<void> {
    const { filename = 'resume.pdf' } = options;

    const [{ pdf }, { DeveloperPDF }, { DefaultPDF }, { VeterinaryPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/lib/pdf-templates/developer-pdf'),
        import('@/lib/pdf-templates/default-pdf'),
        import('@/lib/pdf-templates/veterinary-pdf'),
    ]);

    const element =
        templateId === 'developer' ? (
            <DeveloperPDF data={resumeData} />
        ) : templateId === 'default' ? (
            <DefaultPDF data={resumeData} />
        ) : (
            <VeterinaryPDF data={resumeData} />
        );

    const blob = await pdf(element).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function generateResumeFilename(firstName?: string, lastName?: string): string {
    const nameParts = [firstName, lastName].filter(Boolean);
    const name = nameParts.length > 0 ? nameParts.join('-') : 'my';
    return `${name}-Resume.pdf`;
}
