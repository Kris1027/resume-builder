import '@/lib/pdf-fonts';
import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/form-types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { formatLinkedinDisplay } from '@/lib/utils';

interface VeterinaryPDFProps {
    data: ResumeData;
    compact?: boolean;
}

const C = {
    white: '#FFFFFF',
    emerald600: '#059669',
    emerald700: '#047857',
    emerald800: '#065F46',
    emerald50: '#ECFDF5',
    emerald100: '#D1FAE5',
    emerald200: '#A7F3D0',
    teal600: '#0D9488',
    teal50: '#F0FDFA',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray500: '#6B7280',
    gray200: '#E5E7EB',
} as const;

function createStyles(compact: boolean) {
    const c = compact;
    return StyleSheet.create({
        page: {
            fontFamily: 'Lato',
            backgroundColor: C.white,
            fontSize: 10,
            color: C.gray800,
            paddingTop: c ? 10 : 20,
        },
        header: {
            backgroundColor: C.emerald50,
            borderBottomWidth: 2,
            borderBottomColor: C.emerald600,
            paddingHorizontal: c ? 16 : 24,
            paddingTop: 0,
            paddingBottom: c ? 8 : 16,
        },
        headerName: {
            fontFamily: 'Merriweather',
            fontWeight: 700,
            fontSize: c ? 18 : 22,
            color: C.gray800,
            textAlign: 'center',
            marginBottom: c ? 2 : 4,
        },
        headerTitle: {
            textAlign: 'center',
            fontSize: c ? 10 : 12,
            color: C.emerald700,
            marginBottom: c ? 6 : 10,
        },
        contactRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: c ? 5 : 8,
        },
        contactLink: {
            fontSize: 9,
            color: C.gray600,
            textDecoration: 'none',
            backgroundColor: C.white,
            paddingHorizontal: c ? 6 : 8,
            paddingVertical: c ? 2 : 3,
            borderRadius: 10,
        },
        body: { flexDirection: 'column', padding: c ? 12 : 20 },
        section: { marginBottom: c ? 8 : 14 },
        sectionHeader: {
            fontSize: c ? 9 : 10,
            fontFamily: 'Merriweather',
            fontWeight: 700,
            color: C.emerald700,
            borderBottomWidth: 1.5,
            borderBottomColor: C.emerald200,
            paddingBottom: c ? 2 : 3,
            marginBottom: c ? 5 : 8,
        },
        expBlock: {
            marginBottom: c ? 6 : 10,
            borderLeftWidth: 2,
            borderLeftColor: C.emerald200,
            paddingLeft: c ? 7 : 10,
        },
        expPosition: {
            fontFamily: 'Lato',
            fontWeight: 700,
            fontSize: c ? 9 : 10,
            color: C.gray800,
        },
        expMeta: { fontSize: c ? 8 : 9, color: C.gray600, marginBottom: c ? 2 : 3 },
        expCompany: { fontSize: c ? 8 : 9, color: C.emerald700 },
        bulletRow: { flexDirection: 'row', marginBottom: c ? 1 : 2 },
        bulletDot: { width: 10, fontSize: c ? 8 : 9, color: C.emerald600 },
        bulletText: { flex: 1, fontSize: c ? 8 : 9, color: C.gray700, lineHeight: c ? 1.3 : 1.4 },
        eduBlock: { marginBottom: c ? 5 : 8 },
        eduDegree: { fontFamily: 'Lato', fontWeight: 700, fontSize: c ? 9 : 10, color: C.gray800 },
        eduInstitution: { fontSize: c ? 8 : 9, color: C.emerald700 },
        eduYears: { fontSize: c ? 8 : 9, color: C.gray500 },
        card: {
            borderRadius: 6,
            padding: c ? 7 : 10,
            marginBottom: c ? 7 : 12,
        },
        cardEmerald: { backgroundColor: C.emerald50 },
        cardTeal: { backgroundColor: C.teal50 },
        cardDeep: { backgroundColor: C.emerald100 },
        cardHeader: {
            fontSize: c ? 8 : 9,
            fontFamily: 'Merriweather',
            fontWeight: 700,
            color: C.emerald700,
            borderBottomWidth: 1,
            borderBottomColor: C.emerald200,
            paddingBottom: c ? 2 : 3,
            marginBottom: c ? 4 : 6,
        },
        cardHeaderTeal: { color: C.teal600, borderBottomColor: C.emerald200 },
        cardHeaderDeep: { color: C.emerald800, borderBottomColor: C.emerald200 },
        skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
        skillTag: {
            backgroundColor: C.emerald100,
            color: C.emerald700,
            borderRadius: 3,
            paddingHorizontal: c ? 4 : 5,
            paddingVertical: c ? 1 : 2,
            fontSize: c ? 7 : 8,
        },
        langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: c ? 2 : 3 },
        langName: { fontFamily: 'Lato', fontWeight: 700, fontSize: c ? 8 : 9 },
        langLevel: { fontSize: c ? 8 : 9, color: C.teal600 },
        interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
        interestTag: {
            backgroundColor: C.emerald200,
            color: C.emerald800,
            borderRadius: 3,
            paddingHorizontal: c ? 4 : 5,
            paddingVertical: c ? 1 : 2,
            fontSize: c ? 7 : 8,
        },
        gdpr: {
            fontSize: 7,
            color: '#9CA3AF',
            marginTop: c ? 8 : 12,
            borderTopWidth: 0.5,
            borderTopColor: C.gray200,
            paddingTop: 6,
            paddingHorizontal: c ? 12 : 20,
            paddingBottom: c ? 12 : 20,
        },
    });
}

function formatPDFDateShort(dateString: string): string {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'LLL yyyy', { locale: enUS });
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

export function VeterinaryPDF({ data, compact = false }: VeterinaryPDFProps) {
    const styles = createStyles(compact);
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
                    <View style={styles.contactRow}>
                        {p.location ? <Text style={styles.contactLink}>{p.location}</Text> : null}
                        {p.email ? (
                            <Link src={`mailto:${p.email}`} style={styles.contactLink}>
                                {p.email}
                            </Link>
                        ) : null}
                        {p.phone ? (
                            <Link src={`tel:${p.phone}`} style={styles.contactLink}>
                                {p.phone}
                            </Link>
                        ) : null}
                        {p.linkedin ? (
                            <Link src={p.linkedin} style={styles.contactLink}>
                                {formatLinkedinDisplay(p.linkedin)}
                            </Link>
                        ) : null}
                        {p.website ? (
                            <Link src={p.website} style={styles.contactLink}>
                                {p.website}
                            </Link>
                        ) : null}
                    </View>
                </View>

                {/* Body */}
                <View style={styles.body}>
                    {experiences.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Work Experience</Text>
                            {experiences.map((exp, i) => (
                                <View key={i} style={styles.expBlock} wrap={false}>
                                    <Text style={styles.expPosition}>{exp.position}</Text>
                                    <Text style={styles.expCompany}>{exp.company}</Text>
                                    <Text style={styles.expMeta}>
                                        {formatPDFDateShort(exp.startDate)} -{' '}
                                        {exp.current ? 'Present' : formatPDFDateShort(exp.endDate)}
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
                            <Text style={styles.sectionHeader}>Education</Text>
                            {education.map((edu, i) => (
                                <View key={i} style={styles.eduBlock} wrap={false}>
                                    <Text style={styles.eduDegree}>
                                        {edu.degree}
                                        {edu.degree && edu.field ? ' in ' : ''}
                                        {edu.field}
                                    </Text>
                                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                                    <Text style={styles.eduYears}>
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
                        <View style={[styles.card, styles.cardEmerald]} wrap={false}>
                            <Text style={styles.cardHeader}>Skills</Text>
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
                        <View style={[styles.card, styles.cardTeal]} wrap={false}>
                            <Text style={[styles.cardHeader, styles.cardHeaderTeal]}>
                                Languages
                            </Text>
                            {languages.map((l, i) => (
                                <View key={i} style={styles.langRow}>
                                    <Text style={styles.langName}>{l.language}</Text>
                                    <Text style={styles.langLevel}>{l.proficiency}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {interests.length > 0 && (
                        <View style={[styles.card, styles.cardDeep]} wrap={false}>
                            <Text style={[styles.cardHeader, styles.cardHeaderDeep]}>
                                SPECIAL INTERESTS
                            </Text>
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
