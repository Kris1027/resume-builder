import { useParams, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { DeveloperTemplate } from '@/components/templates/developer-template';
import { DefaultTemplate } from '@/components/templates/default-template';
import { VeterinaryTemplate } from '@/components/templates/veterinary-template';
import {
    sampleResumeData,
    sampleDefaultResumeData,
    sampleVeterinaryResumeData,
} from '@/data/sample-resume-data';
import {
    sampleResumeDataPl,
    sampleDefaultResumeDataPl,
    sampleVeterinaryResumeDataPl,
} from '@/data/sample-resume-data-pl';
import { ArrowLeft, Edit } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { useParallax } from '@/hooks/use-parallax';
import { GeometricShapes } from '@/components/geometric-shapes';
import { fadeInScale } from '@/lib/animation-variants';

export function TemplatePage() {
    const { t, i18n } = useTranslation();
    const { templateId } = useParams({ from: '/templates_/$templateId' });
    const isPolish = i18n.language === 'pl';
    const shouldReduceMotion = useReducedMotion();

    const bgGradient = useParallax({ yRange: 30 });
    const bgDots = useParallax({ yRange: 15 });
    const bgShapes = useParallax({ yRange: 40 });

    const getTemplateName = () => {
        switch (templateId) {
            case 'developer':
                return t('templates.developer.name');
            case 'default':
                return t('templates.default.name');
            case 'veterinary':
                return t('templates.veterinary.name');
            default:
                return 'Template';
        }
    };

    const renderTemplate = () => {
        switch (templateId) {
            case 'developer':
                return (
                    <DeveloperTemplate data={isPolish ? sampleResumeDataPl : sampleResumeData} />
                );
            case 'default':
                return (
                    <DefaultTemplate
                        data={isPolish ? sampleDefaultResumeDataPl : sampleDefaultResumeData}
                    />
                );
            case 'veterinary':
                return (
                    <VeterinaryTemplate
                        data={isPolish ? sampleVeterinaryResumeDataPl : sampleVeterinaryResumeData}
                    />
                );
            default:
                return (
                    <div className='relative z-[1] container mx-auto px-4 py-24'>
                        <div className='animate-fade-in-up mx-auto max-w-md text-center'>
                            <h1 className='font-display mb-4 text-2xl font-bold dark:text-gray-100'>
                                {t('templates.notFound')}
                            </h1>
                            <Button
                                asChild
                                className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl'
                            >
                                <Link to='/templates'>
                                    <ArrowLeft className='mr-2 h-4 w-4' />
                                    {t('nav.backToTemplates')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                );
        }
    };

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

            <motion.div ref={bgShapes.ref} style={{ y: bgShapes.y }}>
                <GeometricShapes />
            </motion.div>

            {/* Navigation Bar */}
            <div className='sticky top-0 z-10 border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80'>
                <div className='container mx-auto px-4 py-4'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <Button asChild variant='outline' size='sm'>
                                <Link to='/templates'>
                                    <ArrowLeft className='mr-2 h-4 w-4' />
                                    {t('nav.backToTemplates')}
                                </Link>
                            </Button>
                            <h1 className='font-display bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400'>
                                {getTemplateName()} {t('templates.preview')}
                            </h1>
                        </div>

                        <div className='flex items-center gap-3'>
                            <Button
                                asChild
                                size='sm'
                                className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-md'
                            >
                                <Link to='/builder' search={{ templateId }}>
                                    <Edit className='mr-2 h-4 w-4' />
                                    {t('templates.useTemplate')}
                                </Link>
                            </Button>
                            <LanguageToggle />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Preview */}
            <div className='relative z-[1]'>
                <div className='py-8'>
                    <motion.div
                        className='mx-auto max-w-[210mm] overflow-hidden bg-white text-gray-900 shadow-xl'
                        {...fadeInScale(0.1, shouldReduceMotion)}
                    >
                        {renderTemplate()}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
