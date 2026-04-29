import { useEffect, useState } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import type { ResumeData } from '@/types/form-types';
import { ArrowLeft, Download, Edit, Loader2, FileWarning } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { exportToPDF, generateResumeFilename } from '@/lib/pdf-export';
import type { TemplateId } from '@/lib/template-ids';
import { useTranslation } from 'react-i18next';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { safeStorage } from '@/lib/storage';
import { PDFViewer } from '@react-pdf/renderer';
import { DeveloperPDF } from '@/lib/pdf-templates/developer-pdf';
import { DefaultPDF } from '@/lib/pdf-templates/default-pdf';
import { VeterinaryPDF } from '@/lib/pdf-templates/veterinary-pdf';

export const PreviewPage = () => {
    const { t } = useTranslation();
    const search = useSearch({ from: '/preview' }) as { templateId?: string };
    const templateId = search.templateId || 'developer';

    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    useEffect(() => {
        const storedData = safeStorage.getItem('resumeData');
        if (storedData) {
            let parsedData;
            try {
                parsedData = JSON.parse(storedData);
            } catch {
                if (import.meta.env.DEV) console.warn('Failed to parse stored resume data');
                return;
            }
            const transformedData: ResumeData = {
                personalInfo: parsedData.personalInfo,
                experiences: parsedData.experiences || [],
                education: parsedData.education || [],
                skills: parsedData.skills || [],
                languages: parsedData.languages || [],
                interests: parsedData.interests || [],
                gdprConsent: parsedData.gdprConsent,
            };
            setResumeData(transformedData);
        }
    }, []);

    const handleDownloadPDF = async () => {
        if (!resumeData) return;
        setIsExporting(true);
        try {
            const filename = generateResumeFilename(
                resumeData.personalInfo?.firstName,
                resumeData.personalInfo?.lastName,
            );
            await exportToPDF(resumeData, templateId as TemplateId, { filename });
        } catch (error) {
            if (import.meta.env.DEV) console.error('Failed to export PDF:', error);
            setExportError(t('preview.exportError'));
        } finally {
            setIsExporting(false);
        }
    };

    if (!resumeData) {
        return (
            <div className='relative min-h-screen overflow-hidden'>
                <div className='animate-gradient-shift absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/80' />
                <div
                    className='absolute inset-0 opacity-[0.03] dark:opacity-[0.04]'
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className='relative z-[1] container mx-auto px-4 py-24'>
                    <div className='animate-fade-in-up mx-auto max-w-md text-center'>
                        <h1 className='font-display mb-4 text-2xl font-bold dark:text-gray-100'>
                            {t('preview.noData')}
                        </h1>
                        <p className='text-muted-foreground mb-6'>{t('preview.noDataHint')}</p>
                        <Button
                            asChild
                            className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl'
                        >
                            <Link to='/templates'>
                                <ArrowLeft className='mr-2 h-4 w-4' />
                                {t('preview.startBuilding')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const pdfDocument =
        templateId === 'developer' ? (
            <DeveloperPDF data={resumeData} />
        ) : templateId === 'default' ? (
            <DefaultPDF data={resumeData} />
        ) : (
            <VeterinaryPDF data={resumeData} />
        );

    return (
        <div className='flex h-screen flex-col overflow-hidden'>
            {/* Navbar */}
            <div className='shrink-0 border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80'>
                <div className='container mx-auto px-4 py-4'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <Button asChild variant='outline' size='sm'>
                                <Link to='/builder' search={{ templateId, edit: true }}>
                                    <ArrowLeft className='mr-2 h-4 w-4' />
                                    {t('nav.backToEditor')}
                                </Link>
                            </Button>
                            <h1 className='font-display bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400'>
                                {t('preview.title')}
                            </h1>
                        </div>

                        <div className='flex items-center gap-3'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={handleDownloadPDF}
                                disabled={isExporting}
                                className='transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400'
                            >
                                {isExporting ? (
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                ) : (
                                    <Download className='mr-2 h-4 w-4' />
                                )}
                                {isExporting ? t('preview.exporting') : t('preview.downloadPdf')}
                            </Button>
                            <Button
                                asChild
                                size='sm'
                                className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-md'
                            >
                                <Link to='/builder' search={{ templateId, edit: true }}>
                                    <Edit className='mr-2 h-4 w-4' />
                                    {t('preview.editCv')}
                                </Link>
                            </Button>
                            <LanguageToggle />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Preview */}
            <div className='min-h-0 flex-1'>
                <PDFViewer width='100%' height='100%' showToolbar={false}>
                    {pdfDocument}
                </PDFViewer>
            </div>

            {/* Export Error Dialog */}
            <AlertDialog
                open={!!exportError}
                onOpenChange={(open) => !open && setExportError(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30'>
                                <FileWarning className='h-5 w-5 text-orange-600 dark:text-orange-400' />
                            </div>
                            <AlertDialogTitle>{t('preview.exportErrorTitle')}</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className='pt-2'>
                            {exportError}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setExportError(null)}>
                            {t('dialogs.pdfError.ok')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
