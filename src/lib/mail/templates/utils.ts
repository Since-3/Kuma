/**
 * Gemeinsame Helper für E-Mail-Templates.
 * - HTML-Escaping für dynamische Werte (Defense gegen Markup-Injection in Mails)
 * - URL-Validierung für href/src (nur http/https erlauben)
 */

/**
 * Escapt HTML-Sonderzeichen in einem String, damit der Wert sicher in HTML-Content
 * und in Attribut-Werten verwendet werden kann.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Liefert die URL zurück, wenn sie http oder https ist – sonst "#".
 * Verhindert javascript:- oder data:-URLs in Mail-Links.
 */
export function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
    return "#";
  } catch {
    return "#";
  }
}

/**
 * Entfernt Zeilenumbrüche aus einem String – wichtig für E-Mail-Subjects
 * (Header-Injection-Prävention).
 */
export function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}
