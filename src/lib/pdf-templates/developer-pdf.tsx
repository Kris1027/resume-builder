import '@/lib/pdf-fonts';
import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/form-types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { formatWebsiteDisplay, formatGithubDisplay, formatLinkedinDisplay } from '@/lib/utils';

interface DeveloperPDFProps {
    data: ResumeData;
}

const C = {
    purple: '#7C3AED',
    white: '#FFFFFF',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray900: '#111827',
    green400: '#4ADE80',
    cyan500: '#06B6D4',
} as const;

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Fira Code',
        backgroundColor: C.white,
        fontSize: 10,
        color: C.gray800,
        paddingTop: 20,
    },
    header: {
        backgroundColor: C.purple,
        paddingTop: 4,
        paddingHorizontal: 24,
        paddingBottom: 24,
        color: C.white,
    },
    headerName: { fontSize: 24, fontFamily: 'Fira Code', fontWeight: 700, marginBottom: 4 },
    headerTitle: { fontSize: 13, marginBottom: 10 },
    headerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4 },
    headerLink: { color: C.white, fontSize: 9, textDecoration: 'none' },
    body: { flexDirection: 'column', padding: 20 },
    section: { marginBottom: 16 },
    sectionHeader: {
        fontSize: 11,
        fontFamily: 'Fira Code',
        fontWeight: 700,
        color: C.purple,
        borderBottomWidth: 1.5,
        borderBottomColor: C.purple,
        paddingBottom: 3,
        marginBottom: 8,
    },
    expBlock: { marginBottom: 10 },
    expTitle: { fontSize: 11, fontFamily: 'Fira Code', fontWeight: 700 },
    expPurple: { color: C.purple },
    expMeta: { fontSize: 9, color: C.gray600, marginBottom: 3 },
    bulletRow: { flexDirection: 'row', marginBottom: 2 },
    bulletDot: { width: 10, fontSize: 9, color: C.gray700 },
    bulletText: { flex: 1, fontSize: 9, color: C.gray700, lineHeight: 1.4 },
    eduBlock: { marginBottom: 8 },
    eduField: { fontSize: 10, fontFamily: 'Fira Code', fontWeight: 700, color: C.purple },
    eduMeta: { fontSize: 9, color: C.gray700 },
    skillsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    skillTag: {
        backgroundColor: C.gray900,
        color: C.green400,
        borderWidth: 1,
        borderColor: C.gray700,
        borderRadius: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 8,
        marginRight: 4,
        marginBottom: 4,
    },
    langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    langName: { fontFamily: 'Fira Code', fontWeight: 700, fontSize: 9 },
    langLevel: { color: C.purple, fontSize: 9 },
    interestsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    interestTag: {
        backgroundColor: C.cyan500,
        color: C.white,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        fontSize: 8,
        marginRight: 4,
        marginBottom: 4,
    },
    gdpr: {
        fontSize: 7,
        color: '#9CA3AF',
        marginTop: 12,
        borderTopWidth: 0.5,
        borderTopColor: '#E5E7EB',
        paddingTop: 6,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
});

function formatPDFDate(dateString: string): string {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'LLLL yyyy', { locale: enUS });
}

function formatPDFYear(dateString: string): string {
    if (!dateString) return '';
    return dateString.split('-')[0];
}

function parseDescriptionLines(description: string): string[] {
    return description
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => l.replace(/^[-*•‣◦⁃∙]\s*/, ''));
}

export function DeveloperPDF({ data }: DeveloperPDFProps) {
    const {
        personalInfo: p,
        experiences,
        education,
        skills,
        languages,
        interests,
        gdprConsent,
    } = data;

    const gdprText = gdprConsent?.companyName?.trim()
        ? `I hereby give my consent for my personal data included in my CV to be processed for the purposes of the recruitment process conducted by ${gdprConsent.companyName} in accordance with Regulation (EU) 2016/679 (GDPR).`
        : 'I hereby give my consent for my personal data included in my CV to be processed for the purposes of the recruitment process in accordance with Regulation (EU) 2016/679 (GDPR).';

    return (
        <Document
            title={`${p.firstName} ${p.lastName} - Resume`}
            author={`${p.firstName} ${p.lastName}`}
            subject='Professional Resume'
            keywords={skills.map((s) => s.name).join(', ')}
            language='en'
        >
            <Page size='A4' style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerName}>
                        {p.firstName} {p.lastName}
                    </Text>
                    {p.title ? <Text style={styles.headerTitle}>{p.title}</Text> : null}
                    <View style={styles.headerRow}>
                        {p.website ? (
                            <Link src={p.website} style={styles.headerLink}>
                                {formatWebsiteDisplay(p.website)}
                            </Link>
                        ) : null}
                        {p.github ? (
                            <Link src={p.github} style={styles.headerLink}>
                                {formatGithubDisplay(p.github)}
                            </Link>
                        ) : null}
                        {p.linkedin ? (
                            <Link src={p.linkedin} style={styles.headerLink}>
                                {formatLinkedinDisplay(p.linkedin)}
                            </Link>
                        ) : null}
                    </View>
                    <View style={styles.headerRow}>
                        {p.location ? <Text style={styles.headerLink}>{p.location}</Text> : null}
                        {p.email ? (
                            <Link src={`mailto:${p.email}`} style={styles.headerLink}>
                                {p.email}
                            </Link>
                        ) : null}
                        {p.phone ? (
                            <Link src={`tel:${p.phone}`} style={styles.headerLink}>
                                {p.phone}
                            </Link>
                        ) : null}
                    </View>
                </View>

                {/* Body */}
                <View style={styles.body}>
                    {experiences.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>{'// WORK EXPERIENCE'}</Text>
                            {experiences.map((exp, i) => (
                                <View key={i} style={styles.expBlock} wrap={false}>
                                    <Text style={styles.expTitle}>
                                        {exp.company}
                                        <Text style={styles.expPurple}>
                                            {' | '}
                                            {exp.position}
                                        </Text>
                                    </Text>
                                    <Text style={styles.expMeta}>
                                        {formatPDFDate(exp.startDate)} -{' '}
                                        {exp.current ? 'Present' : formatPDFDate(exp.endDate)}
                                        {exp.location ? ` | ${exp.location}` : ''}
                                    </Text>
                                    {parseDescriptionLines(exp.description).map((line, j) => (
                                        <View key={j} style={styles.bulletRow}>
                                            <Text style={styles.bulletDot}>{'• '}</Text>
                                            <Text style={styles.bulletText}>{line}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    )}

                    {education.length > 0 && (
                        <View style={styles.section} wrap={false}>
                            <Text style={styles.sectionHeader}>{'// EDUCATION'}</Text>
                            {education.map((edu, i) => (
                                <View key={i} style={styles.eduBlock} wrap={false}>
                                    <Text style={styles.eduField}>{edu.field}</Text>
                                    <Text style={styles.eduMeta}>
                                        {edu.degree}
                                        {edu.degree && edu.institution ? ' — ' : ''}
                                        {edu.institution}
                                    </Text>
                                    <Text style={styles.eduMeta}>
                                        {formatPDFYear(edu.startDate)} -{' '}
                                        {formatPDFYear(edu.endDate)}
                                    </Text>
                                    {edu.description ? (
                                        <Text style={styles.bulletText}>{edu.description}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {skills.length > 0 && (
                        <View style={styles.section} wrap={false}>
                            <Text style={styles.sectionHeader}>{'// TECH STACK'}</Text>
                            <View style={styles.skillsWrap}>
                                {skills.map((s, i) => (
                                    <Text key={i} style={styles.skillTag}>
                                        {s.name}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    )}

                    {languages.length > 0 && (
                        <View style={styles.section} wrap={false}>
                            <Text style={styles.sectionHeader}>{'// LANGUAGES'}</Text>
                            {languages.map((l, i) => (
                                <View key={i} style={styles.langRow}>
                                    <Text style={styles.langName}>{l.language}</Text>
                                    <Text style={styles.langLevel}>{l.proficiency}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {interests.length > 0 && (
                        <View style={styles.section} wrap={false}>
                            <Text style={styles.sectionHeader}>{'// INTERESTS'}</Text>
                            <View style={styles.interestsWrap}>
                                {interests.map((interest, i) => (
                                    <Text key={i} style={styles.interestTag}>
                                        {interest.name}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {gdprConsent?.enabled ? <Text style={styles.gdpr}>{gdprText}</Text> : null}
            </Page>
        </Document>
    );
}
