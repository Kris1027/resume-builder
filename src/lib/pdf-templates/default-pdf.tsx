import '@/lib/pdf-fonts';
import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/form-types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { formatLinkedinDisplay } from '@/lib/utils';

interface DefaultPDFProps {
    data: ResumeData;
    compact?: boolean;
}

const C = {
    white: '#FFFFFF',
    slateBlue: '#1E40AF',
    gray900: '#111827',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray500: '#6B7280',
    gray200: '#E5E7EB',
    gray100: '#F3F4F6',
    gray50: '#F9FAFB',
} as const;

function createStyles(compact: boolean) {
    const c = compact;
    return StyleSheet.create({
        page: {
            fontFamily: 'Montserrat',
            backgroundColor: C.white,
            fontSize: 10,
            color: C.gray800,
            paddingTop: c ? 10 : 20,
        },
        headerBlock: {
            backgroundColor: C.gray50,
            paddingHorizontal: c ? 20 : 32,
            paddingTop: c ? 2 : 4,
            paddingBottom: c ? 8 : 16,
            borderBottomWidth: 1,
            borderBottomColor: C.gray200,
            marginBottom: c ? 4 : 8,
        },
        headerFirstName: { fontSize: c ? 18 : 22, letterSpacing: 2, color: C.gray800 },
        headerLastName: {
            fontSize: c ? 18 : 22,
            fontFamily: 'Montserrat',
            fontWeight: 700,
            letterSpacing: 2,
            color: C.gray800,
        },
        headerNameRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: c ? 2 : 4 },
        headerTitle: {
            textAlign: 'center',
            fontSize: c ? 9 : 11,
            color: C.gray500,
            marginBottom: c ? 4 : 8,
        },
        contactRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: c ? 10 : 16,
        },
        contactLink: { fontSize: 9, color: C.gray500, textDecoration: 'none' },
        body: { paddingHorizontal: c ? 20 : 32, paddingBottom: c ? 12 : 24 },
        section: { marginBottom: c ? 8 : 14 },
        sectionHeader: {
            fontSize: 9,
            fontFamily: 'Montserrat',
            fontWeight: 700,
            letterSpacing: 1.5,
            color: C.slateBlue,
            borderBottomWidth: 1.5,
            borderBottomColor: C.slateBlue,
            paddingBottom: c ? 2 : 3,
            marginBottom: c ? 5 : 8,
        },
        expBlock: { marginBottom: c ? 6 : 10 },
        expTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
        expPosition: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: c ? 9 : 10 },
        expDate: { fontSize: c ? 8 : 9, color: C.gray500 },
        expCompanyRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: c ? 2 : 3,
        },
        expCompany: {
            fontFamily: 'Montserrat',
            fontWeight: 700,
            color: C.gray700,
            fontSize: c ? 8 : 9,
        },
        expLocation: { fontSize: 8, color: C.gray500 },
        bulletRow: { flexDirection: 'row', marginBottom: c ? 1 : 1.5 },
        bulletDot: { width: 10, fontSize: c ? 8 : 9 },
        bulletText: { flex: 1, fontSize: c ? 8 : 9, color: C.gray700, lineHeight: c ? 1.3 : 1.4 },
        eduBlock: { marginBottom: c ? 5 : 8 },
        eduTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
        eduDegree: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: c ? 9 : 10 },
        eduYears: { fontSize: c ? 8 : 9, color: C.gray500 },
        eduInstitution: { fontSize: c ? 8 : 9, color: C.gray700 },
        skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: c ? 3 : 4 },
        skillTag: {
            borderWidth: 1,
            borderColor: C.gray200,
            backgroundColor: C.gray100,
            borderRadius: 10,
            paddingHorizontal: c ? 6 : 8,
            paddingVertical: c ? 1 : 2,
            fontSize: c ? 7 : 8,
            color: C.gray700,
        },
        langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: c ? 2 : 3 },
        langName: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: c ? 8 : 9 },
        langLevel: { fontSize: c ? 8 : 9, color: C.gray500 },
        interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: c ? 3 : 4 },
        interestTag: {
            borderWidth: 1,
            borderColor: C.gray200,
            backgroundColor: C.gray100,
            borderRadius: 10,
            paddingHorizontal: c ? 6 : 8,
            paddingVertical: c ? 1 : 2,
            fontSize: c ? 7 : 8,
            color: C.gray700,
        },
        gdpr: {
            fontSize: 7,
            color: '#9CA3AF',
            marginTop: c ? 8 : 12,
            borderTopWidth: 0.5,
            borderTopColor: C.gray200,
            paddingTop: 6,
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

export function DefaultPDF({ data, compact = false }: DefaultPDFProps) {
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
                <View style={styles.headerBlock}>
                    <View style={styles.headerNameRow}>
                        <Text style={styles.headerFirstName}>{p.firstName} </Text>
                        <Text style={styles.headerLastName}>{p.lastName}</Text>
                    </View>
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
                            <Text style={styles.sectionHeader}>PROFESSIONAL EXPERIENCE</Text>
                            {experiences.map((exp, i) => (
                                <View key={i} style={styles.expBlock} wrap={false}>
                                    <View style={styles.expTopRow}>
                                        <Text style={styles.expPosition}>{exp.position}</Text>
                                        <Text style={styles.expDate}>
                                            {formatPDFDateShort(exp.startDate)} -{' '}
                                            {exp.current
                                                ? 'Present'
                                                : formatPDFDateShort(exp.endDate)}
                                        </Text>
                                    </View>
                                    <View style={styles.expCompanyRow}>
                                        <Text style={styles.expCompany}>{exp.company}</Text>
                                        {exp.location ? (
                                            <Text style={styles.expLocation}>{exp.location}</Text>
                                        ) : null}
                                    </View>
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
                            <Text style={styles.sectionHeader}>EDUCATION</Text>
                            {education.map((edu, i) => (
                                <View key={i} style={styles.eduBlock} wrap={false}>
                                    <View style={styles.eduTopRow}>
                                        <Text style={styles.eduDegree}>
                                            {edu.degree}
                                            {edu.degree && edu.field ? ' in ' : ''}
                                            {edu.field}
                                        </Text>
                                        <Text style={styles.eduYears}>
                                            {formatPDFYear(edu.startDate)} -{' '}
                                            {formatPDFYear(edu.endDate)}
                                        </Text>
                                    </View>
                                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                                    {edu.description ? (
                                        <Text style={styles.bulletText}>{edu.description}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {skills.length > 0 && (
                        <View style={styles.section} wrap={false}>
                            <Text style={styles.sectionHeader}>CORE COMPETENCIES</Text>
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
                            <Text style={styles.sectionHeader}>LANGUAGES</Text>
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
                            <Text style={styles.sectionHeader}>INTERESTS</Text>
                            <View style={styles.interestsWrap}>
                                {interests.map((interest, i) => (
                                    <Text key={i} style={styles.interestTag}>
                                        {interest.name}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    )}

                    {gdprConsent?.enabled ? <Text style={styles.gdpr}>{gdprText}</Text> : null}
                </View>
            </Page>
        </Document>
    );
}
