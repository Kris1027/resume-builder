import type { ResumeData } from '@/types/form-types';
import type { TemplateId } from '@/lib/template-ids';

export interface PDFExportOptions {
    filename?: string;
    compactScale?: number;
}

export async function exportToPDF(
    resumeData: ResumeData,
    templateId: TemplateId,
    options: PDFExportOptions = {},
): Promise<void> {
    const { filename = 'resume.pdf', compactScale = 0 } = options;

    const [{ pdf }, { DeveloperPDF }, { DefaultPDF }, { VeterinaryPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/lib/pdf-templates/developer-pdf'),
        import('@/lib/pdf-templates/default-pdf'),
        import('@/lib/pdf-templates/veterinary-pdf'),
    ]);

    const element =
        templateId === 'developer' ? (
            <DeveloperPDF data={resumeData} compactScale={compactScale} />
        ) : templateId === 'default' ? (
            <DefaultPDF data={resumeData} compactScale={compactScale} />
        ) : (
            <VeterinaryPDF data={resumeData} compactScale={compactScale} />
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

export async function countPdfPages(blob: Blob): Promise<number> {
    const buf = await blob.arrayBuffer();
    const text = new TextDecoder('latin1').decode(new Uint8Array(buf));
    const match = text.match(/\/Count\s+(\d+)/);
    if (match) return parseInt(match[1], 10);
    return 1;
}

export function generateResumeFilename(firstName?: string, lastName?: string): string {
    const nameParts = [firstName, lastName].filter(Boolean);
    const name = nameParts.length > 0 ? nameParts.join('-') : 'my';
    return `${name}-Resume.pdf`;
}
