// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_TOP_MARGIN_MM = 8; // Top margin for pages after the first (matches section spacing)

interface LinkInfo {
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface SectionBoundary {
    top: number;
    bottom: number;
}

export interface PDFExportOptions {
    filename?: string;
    scale?: number;
    singlePage?: boolean;
    cvData?: string; // JSON string of CV data to embed in PDF
    imageQuality?: number; // JPEG quality 0-1 (default 0.92)
    compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW'; // Image compression level (default 'MEDIUM')
}

function extractLinks(element: HTMLElement): LinkInfo[] {
    const links: LinkInfo[] = [];
    const anchorElements = element.querySelectorAll('a[href]');
    const elementRect = element.getBoundingClientRect();

    anchorElements.forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (!href) return;

        const rect = anchor.getBoundingClientRect();

        // Calculate position relative to the element
        const relativeX = rect.left - elementRect.left;
        const relativeY = rect.top - elementRect.top;

        links.push({
            url: href,
            x: relativeX,
            y: relativeY,
            width: rect.width,
            height: rect.height,
        });
    });

    return links;
}

function extractSectionBoundaries(element: HTMLElement): SectionBoundary[] {
    const sections: SectionBoundary[] = [];
    const sectionElements = element.querySelectorAll('section');
    const elementRect = element.getBoundingClientRect();

    sectionElements.forEach((section) => {
        const rect = section.getBoundingClientRect();
        sections.push({
            top: rect.top - elementRect.top,
            bottom: rect.bottom - elementRect.top,
        });
    });

    sections.sort((a, b) => a.top - b.top);
    return sections;
}

function calculatePageBreaks(
    totalHeightPx: number,
    pageHeightPx: number,
    sections: SectionBoundary[],
): number[] {
    const breaks: number[] = [];
    let currentPageEnd = pageHeightPx;

    while (currentPageEnd < totalHeightPx) {
        let bestBreak = currentPageEnd;

        for (const section of sections) {
            // If section straddles the page break
            if (section.top < currentPageEnd && section.bottom > currentPageEnd) {
                // Move break point to just before this section starts
                // Only if the section fits on a single page
                const sectionHeight = section.bottom - section.top;
                const previousBreak = breaks.length > 0 ? breaks[breaks.length - 1] : 0;
                if (sectionHeight <= pageHeightPx && section.top > previousBreak) {
                    bestBreak = section.top;
                }
                break;
            }
        }

        breaks.push(bestBreak);
        currentPageEnd = bestBreak + pageHeightPx;
    }

    return breaks;
}

function cropCanvas(
    sourceCanvas: HTMLCanvasElement,
    startY: number,
    height: number,
    quality: number = 0.92,
): string {
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = sourceCanvas.width;
    croppedCanvas.height = height;

    const ctx = croppedCanvas.getContext('2d');
    if (ctx) {
        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, croppedCanvas.width, height);
        // Draw the cropped portion
        ctx.drawImage(
            sourceCanvas,
            0,
            startY,
            sourceCanvas.width,
            height,
            0,
            0,
            sourceCanvas.width,
            height,
        );
    }

    return croppedCanvas.toDataURL('image/jpeg', quality);
}

export async function exportToPDF(
    element: HTMLElement,
    options: PDFExportOptions = {},
): Promise<void> {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
    ]);

    const {
        filename = 'cv.pdf',
        scale = 2,
        singlePage = false,
        cvData,
        imageQuality = 0.92, // High quality JPEG (significantly reduces file size compared to PNG)
        compression = 'MEDIUM', // jsPDF compression level
    } = options;

    // Extract links and section boundaries before rendering to canvas
    const links = extractLinks(element);
    const sections = extractSectionBoundaries(element);

    // Get element dimensions for scaling calculations
    const elementWidth = element.scrollWidth;
    const elementHeight = element.scrollHeight;

    // Capture the element as a canvas with high quality
    const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: elementWidth,
        height: elementHeight,
    });

    // Calculate dimensions to fit A4 width
    const imgWidth = A4_WIDTH_MM;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF document
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageHeight = A4_HEIGHT_MM;

    // Convert canvas to JPEG image data (much smaller than PNG)
    const imgData = canvas.toDataURL('image/jpeg', imageQuality);

    // Calculate scale factors for link positioning
    let scaleX = imgWidth / elementWidth;
    let scaleY = imgHeight / elementHeight;
    let linkXOffset = 0;

    // Calculate page height in canvas pixels and scale section boundaries
    const pageHeightPx = (pageHeight / imgHeight) * canvas.height;
    const scaledSections = sections.map((s) => ({
        top: s.top * scale,
        bottom: s.bottom * scale,
    }));

    if (singlePage && imgHeight > A4_HEIGHT_MM) {
        // Single page: scale to fit within A4 maintaining aspect ratio
        const fitScale = A4_HEIGHT_MM / imgHeight;
        const finalWidth = imgWidth * fitScale;
        const finalHeight = A4_HEIGHT_MM;

        // Center horizontally
        linkXOffset = (A4_WIDTH_MM - finalWidth) / 2;

        pdf.addImage(
            imgData,
            'JPEG',
            linkXOffset,
            0,
            finalWidth,
            finalHeight,
            undefined,
            compression,
        );

        // Update scale factors for links
        scaleX = finalWidth / elementWidth;
        scaleY = finalHeight / elementHeight;
    } else if (singlePage) {
        // Single page but content fits - just add it
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, compression);
    } else {
        // Multi page: split across pages with section-aware breaks
        // Calculate optimal page breaks that don't split sections
        const pageBreaks = calculatePageBreaks(canvas.height, pageHeightPx, scaledSections);

        // Add all break points including start (0) for easier iteration
        const allBreaks = [0, ...pageBreaks, canvas.height];

        // Render each page with cropped content
        for (let i = 0; i < allBreaks.length - 1; i++) {
            const startY = allBreaks[i];
            const endY = allBreaks[i + 1];
            const cropHeight = endY - startY;

            // Create cropped JPEG image for this page
            const croppedImgData = cropCanvas(canvas, startY, cropHeight, imageQuality);

            // Calculate the height this crop takes in mm
            const cropHeightMm = (cropHeight / canvas.height) * imgHeight;

            if (i > 0) {
                pdf.addPage();
            }

            // Add the cropped image - with top margin on subsequent pages
            const topMargin = i > 0 ? PAGE_TOP_MARGIN_MM : 0;
            pdf.addImage(
                croppedImgData,
                'JPEG',
                0,
                topMargin,
                imgWidth,
                cropHeightMm,
                undefined,
                compression,
            );
        }
    }

    // Add clickable links to the PDF
    const linkPageBreaks = singlePage
        ? []
        : calculatePageBreaks(canvas.height, pageHeightPx, scaledSections);
    const linkAllBreaks = [0, ...linkPageBreaks];

    links.forEach((link) => {
        // Convert pixel coordinates to mm
        const linkX = link.x * scaleX + linkXOffset;
        const linkWidth = link.width * scaleX;
        const linkHeight = link.height * scaleY;

        // For single page, all links are on page 1
        if (singlePage) {
            const linkY = link.y * scaleY;
            pdf.setPage(1);
            pdf.link(linkX, linkY, linkWidth, linkHeight, { url: link.url });
        } else {
            // Determine which page this link is on using the calculated page breaks
            const linkYPx = link.y * scale; // Position in canvas pixels
            let pageNumber = 1;
            let pageStartPx = 0;

            for (let i = 0; i < linkAllBreaks.length; i++) {
                if (linkYPx >= linkAllBreaks[i]) {
                    pageNumber = i + 1;
                    pageStartPx = linkAllBreaks[i];
                }
            }

            // Calculate Y position relative to page start, converted to mm
            const yOnPagePx = linkYPx - pageStartPx;
            const yOnPage = (yOnPagePx / canvas.height) * imgHeight;
            // Add top margin offset for pages after the first
            const topMarginOffset = pageNumber > 1 ? PAGE_TOP_MARGIN_MM : 0;
            const finalY = yOnPage + topMarginOffset;

            // Only add link if it's on a valid page
            if (pageNumber <= pdf.getNumberOfPages()) {
                pdf.setPage(pageNumber);
                pdf.link(linkX, finalY, linkWidth, linkHeight, { url: link.url });
            }
        }
    });

    // Embed CV data as custom metadata if provided
    if (cvData) {
        pdf.setProperties({
            title: filename.replace('.pdf', ''),
            subject: 'CV/Resume',
            creator: 'Resume Builder App',
            keywords: cvData, // Store JSON data in keywords field
        });
    }

    // Save the PDF
    pdf.save(filename);
}

export function generateCVFilename(firstName?: string, lastName?: string): string {
    const nameParts = [firstName, lastName].filter(Boolean);
    const name = nameParts.length > 0 ? nameParts.join('-') : 'my';
    return `${name}-CV.pdf`;
}
