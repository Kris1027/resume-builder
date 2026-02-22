import { useEffect, useState, useCallback } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { DeveloperTemplate } from '@/components/templates/developer-template';
import { DefaultTemplate } from '@/components/templates/default-template';
import { VeterinaryTemplate } from '@/components/templates/veterinary-template';
import { ScaleToFitContainer } from '@/components/scale-to-fit-container';
import type { ResumeData } from '@/types/form-types';
import {
    ArrowLeft,
    Download,
    Edit,
    Loader2,
    FileDown,
    Files,
    CheckCircle2,
    AlertTriangle,
    FileWarning,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { exportToPDF, generateResumeFilename } from '@/lib/pdf-export';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { useParallax } from '@/hooks/use-parallax';
import { fadeInUp, fadeInScale } from '@/lib/animation-variants';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { safeStorage } from '@/lib/storage';

export const PreviewPage = () => {
    const { t } = useTranslation();
    const search = useSearch({ from: '/preview' }) as { templateId?: string };
    const templateId = search.templateId || 'developer';
    const shouldReduceMotion = useReducedMotion();

    const bgGradient = useParallax({ yRange: 30 });
    const bgDots = useParallax({ yRange: 15 });
    const bgShapes = useParallax({ yRange: 40 });

    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [singlePageMode, setSinglePageMode] = useState(false);
    const [scaleInfo, setScaleInfo] = useState({ scale: 1, isScaled: false, atMinScale: false });

    const handleScaleChange = useCallback(
        (scale: number, isScaled: boolean, atMinScale: boolean) => {
            setScaleInfo({ scale, isScaled, atMinScale });
        },
        [],
    );

    useEffect(() => {
        // Get data from localStorage
        const storedData = safeStorage.getItem('resumeData');
        if (storedData) {
            let parsedData;
            try {
                parsedData = JSON.parse(storedData);
            } catch {
                if (import.meta.env.DEV) console.warn('Failed to parse stored resume data');
                return;
            }
            // Ensure all arrays have default values
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
        const element = document.getElementById('resume-content');
        if (!element || !resumeData) return;

        setIsExporting(true);

        // Store original styles for restoration
        const scaledParent = element.parentElement;
        const originalStyles = scaledParent
            ? {
                  transform: scaledParent.style.transform,
                  width: scaledParent.style.width,
              }
            : null;

        const disableScaling = () => {
            if (scaledParent && singlePageMode) {
                scaledParent.style.transform = 'none';
                scaledParent.style.width = '';
            }
        };

        const restoreScaling = () => {
            if (scaledParent && singlePageMode && originalStyles) {
                scaledParent.style.transform = originalStyles.transform;
                scaledParent.style.width = originalStyles.width;
            }
        };

        try {
            // Temporarily disable CSS transform scaling for accurate capture
            disableScaling();

            const filename = generateResumeFilename(
                resumeData.personalInfo?.firstName,
                resumeData.personalInfo?.lastName,
            );
            await exportToPDF(element, {
                filename,
                singlePage: singlePageMode,
                resumeData: JSON.stringify(resumeData),
            });
        } catch (error) {
            if (import.meta.env.DEV) console.error('Failed to export PDF:', error);
            setExportError(t('preview.exportError'));
        } finally {
            restoreScaling();
            setIsExporting(false);
        }
    };

    if (!resumeData) {
        return (
            <div className='relative min-h-screen overflow-hidden'>
                {/* Background gradient mesh */}
                <div className='animate-gradient-shift absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/80' />

                {/* Dot grid pattern */}
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

    return (
        <div className='relative min-h-screen overflow-hidden'>
            {/* Background gradient mesh */}
            <motion.div
                ref={bgGradient.ref}
                style={{ y: bgGradient.y }}
                className='animate-gradient-shift absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/80'
            />

            {/* Dot grid pattern */}
            <motion.div
                ref={bgDots.ref}
                style={{
                    y: bgDots.y,
                    backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
                className='absolute inset-0 opacity-[0.03] dark:opacity-[0.04]'
                aria-hidden='true'
            />

            {/* Geometric shapes */}
            <motion.div
                ref={bgShapes.ref}
                style={{ y: bgShapes.y }}
                className='pointer-events-none absolute inset-0 overflow-hidden print:hidden'
                aria-hidden='true'
            >
                <div className='animate-float-reverse absolute top-20 left-[8%] h-16 w-16 rotate-12 border-2 border-indigo-500/15 dark:border-indigo-400/10' />
                <div className='animate-float absolute top-32 right-[12%] h-20 w-20 rounded-full border-2 border-violet-500/10 dark:border-violet-400/10' />
                <div className='absolute bottom-40 left-[15%] grid grid-cols-3 gap-1.5 opacity-20 dark:opacity-10'>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className='h-1.5 w-1.5 rounded-full bg-indigo-500' />
                    ))}
                </div>
                <div className='animate-float absolute top-1/2 right-[5%] h-px w-24 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent' />
                <div className='animate-float-reverse absolute right-[18%] bottom-24 h-12 w-12 rotate-45 rounded-sm border-2 border-indigo-500/10 dark:border-indigo-400/10' />
            </motion.div>

            {/* Actions Bar */}
            <div className='sticky top-0 z-10 border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80 print:hidden'>
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
                            {/* Page Mode Toggle */}
                            <div className='flex items-center overflow-hidden rounded-lg border border-white/20 backdrop-blur-sm dark:border-white/10'>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => setSinglePageMode(false)}
                                    className={`rounded-none border-0 ${!singlePageMode ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 hover:text-white' : ''}`}
                                >
                                    <Files className='mr-1 h-4 w-4' />
                                    {t('preview.multiPage')}
                                </Button>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => setSinglePageMode(true)}
                                    className={`rounded-none border-0 ${singlePageMode ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 hover:text-white' : ''}`}
                                >
                                    <FileDown className='mr-1 h-4 w-4' />
                                    {t('preview.singlePage')}
                                </Button>
                            </div>

                            {/* Scale indicator */}
                            {singlePageMode && scaleInfo.isScaled && (
                                <span className='rounded-full border border-indigo-200/60 bg-indigo-50/80 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'>
                                    {Math.round(scaleInfo.scale * 100)}%
                                </span>
                            )}

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

            <div className='relative z-[1]'>
                {/* Success Message */}
                <div className='container mx-auto px-4 py-4 print:hidden'>
                    <motion.div
                        className='rounded-2xl border border-white/20 bg-white/60 p-4 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.03]'
                        {...fadeInUp(0, shouldReduceMotion)}
                    >
                        <div className='flex items-center gap-3'>
                            <div
                                className='inline-flex rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 text-white shadow-lg'
                                aria-hidden='true'
                            >
                                <CheckCircle2 className='h-5 w-5' />
                            </div>
                            <div>
                                <p className='font-medium dark:text-gray-100'>
                                    {t('preview.success.title')}
                                </p>
                                <p className='text-muted-foreground text-sm'>
                                    {t('preview.success.subtitle')}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Warning for minimum scale */}
                {singlePageMode && scaleInfo.atMinScale && (
                    <div className='container mx-auto px-4 print:hidden'>
                        <motion.div
                            className='mb-4 rounded-2xl border border-white/20 bg-white/60 p-4 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.03]'
                            {...fadeInUp(0, shouldReduceMotion)}
                        >
                            <div className='flex items-center gap-3'>
                                <div
                                    className='inline-flex rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 text-white shadow-lg'
                                    aria-hidden='true'
                                >
                                    <AlertTriangle className='h-5 w-5' />
                                </div>
                                <div>
                                    <p className='font-medium dark:text-gray-100'>
                                        {t('preview.contentWarning.title')}
                                    </p>
                                    <p className='text-muted-foreground text-sm'>
                                        {t('preview.contentWarning.subtitle')}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Template Preview */}
                <div className='py-8' id='print-container'>
                    <ErrorBoundary>
                        <ScaleToFitContainer
                            enabled={singlePageMode}
                            onScaleChange={handleScaleChange}
                            className='mx-auto max-w-[210mm]'
                        >
                            <motion.div
                                id='resume-content'
                                className='overflow-hidden bg-white text-gray-900 shadow-xl'
                                {...fadeInScale(0.1, shouldReduceMotion)}
                            >
                                {templateId === 'developer' && (
                                    <DeveloperTemplate data={resumeData} />
                                )}
                                {templateId === 'default' && <DefaultTemplate data={resumeData} />}
                                {templateId === 'veterinary' && (
                                    <VeterinaryTemplate data={resumeData} />
                                )}
                            </motion.div>
                        </ScaleToFitContainer>
                    </ErrorBoundary>
                </div>
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

            {/* Print Styles */}
            <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          /* Hide navigation and UI elements during print */
          .print\\:hidden {
            display: none !important;
          }

          /* Reset container styles for print */
          #print-container {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }

          /* Clean CV content for print */
          #resume-content {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
        }
      `}</style>
        </div>
    );
};
