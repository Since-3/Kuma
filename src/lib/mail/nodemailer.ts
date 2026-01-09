/**
 * Nodemailer Configuration
 *
 * Diese Datei konfiguriert Nodemailer für den E-Mail-Versand.
 * Unterstützt verschiedene SMTP-Anbieter wie Gmail, Outlook, SendGrid, etc.
 */

import nodemailer from "nodemailer";

/**
 * Erstellt einen Nodemailer Transporter
 *
 * Konfiguration über Umgebungsvariablen:
 * - SMTP_HOST: SMTP Server Host (z.B. smtp.gmail.com)
 * - SMTP_PORT: SMTP Server Port (z.B. 587)
 * - SMTP_USER: SMTP Benutzername/E-Mail
 * - SMTP_PASSWORD: SMTP Passwort/App-Passwort
 * - SMTP_FROM: Absender E-Mail-Adresse
 */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465, // true für Port 465, false für andere Ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Sendet eine E-Mail
 *
 * @param to - Empfänger E-Mail-Adresse
 * @param subject - E-Mail Betreff
 * @param html - HTML-Inhalt der E-Mail
 * @param text - Plain-Text Alternative (optional)
 * @returns Promise mit dem Ergebnis des Versands
 */
export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || stripHtml(html), // Fallback: HTML zu Text konvertieren
    });

    console.log("E-Mail erfolgreich gesendet:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Fehler beim E-Mail-Versand:", error);
    return { success: false, error };
  }
}

/**
 * Einfache Funktion zum Entfernen von HTML-Tags (für Text-Alternative)
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Verifiziert die SMTP-Verbindung
 * Nützlich zum Testen der Konfiguration
 */
export async function verifyMailConnection() {
  try {
    await transporter.verify();
    console.log("SMTP-Verbindung erfolgreich verifiziert");
    return true;
  } catch (error) {
    console.error("SMTP-Verbindung fehlgeschlagen:", error);
    return false;
  }
}
