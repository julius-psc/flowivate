/**
 * Server-safe text sanitization utility.
 * This avoids using isomorphic-dompurify which has ESM compatibility issues
 * with serverless environments (Vercel, AWS Lambda, etc.)
 *
 * For simple text fields (notes, titles, etc.), we strip HTML tags and
 * escape special characters to prevent XSS attacks.
 */

/**
 * Strips HTML tags from a string
 */
function stripHtmlTags(str: string): string {
    return str.replace(/<[^>]*>/g, '');
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(str: string): string {
    const htmlEscapes: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Sanitizes text input for safe storage and display.
 * - Strips all HTML tags
 * - Escapes special characters
 * - Trims whitespace
 *
 * Use this for plain text fields like notes, titles, descriptions, etc.
 * For rich HTML content that needs to preserve formatting, consider a
 * different approach with client-side DOMPurify.
 */
export function sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }
    // First strip HTML tags, then escape any remaining special characters
    return escapeHtml(stripHtmlTags(input)).trim();
}

/**
 * Sanitizes text but preserves some safe characters for notes/descriptions.
 * - Strips all HTML tags
 * - Preserves newlines and basic formatting
 * - Escapes potentially dangerous characters
 */
export function sanitizeNotes(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }
    // Strip HTML tags but preserve text content
    const stripped = stripHtmlTags(input);
    // Escape HTML special characters but preserve newlines
    return escapeHtml(stripped).trim();
}

/**
 * Basic validation and sanitization for simple string fields like title, author
 * - Removes HTML tags
 * - Trims whitespace
 * - Returns empty string if invalid
 */
export function sanitizeSimpleString(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }
    return stripHtmlTags(input).trim();
}
