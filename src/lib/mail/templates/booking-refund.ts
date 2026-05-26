/**
 * E-Mail Template für automatische Rückerstattung
 *
 * Dieses Template wird an den Kunden gesendet, wenn ein Kurs während des
 * Bezahlvorgangs voll wurde und die Zahlung automatisch erstattet wird
 * (Stripe Webhook: capacity_exceeded → refund).
 */

import { escapeHtml, singleLine } from "./utils";

interface BookingRefundEmailParams {
  courseName: string;
  businessName: string;
  amountRefundedCents: number;
  companyName?: string;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Generiert HTML für die Rückerstattungs-Mail
 */
export function generateBookingRefundEmail({
  courseName,
  businessName,
  amountRefundedCents,
  companyName = "Ihr Unternehmen",
}: BookingRefundEmailParams): { subject: string; html: string; text: string } {
  // Defense gegen Markup-Injection in der Mail.
  const safeCourseName = escapeHtml(courseName);
  const safeBusinessName = escapeHtml(businessName);
  const safeCompanyName = escapeHtml(companyName);

  const subject = singleLine(`Rückerstattung – ${courseName}`);
  const formattedPrice = formatPrice(amountRefundedCents);

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rückerstattung</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f6a86b 0%, #ee5a52 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Rückerstattung wurde veranlasst
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hallo,
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                leider war der Kurs <strong>${safeCourseName}</strong> von <strong>${safeBusinessName}</strong>
                bereits ausgebucht, als Ihre Zahlung bei uns eingegangen ist.
              </p>

              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Ihre Zahlung wurde daher <strong>automatisch erstattet</strong>. Der Betrag wird
                Ihrer ursprünglichen Zahlungsmethode in der Regel innerhalb von 5–10 Werktagen
                wieder gutgeschrieben.
              </p>

              <!-- Refund Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px; margin: 0 0 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666666; font-size: 14px;">Erstatteter Betrag</td>
                        <td align="right" style="color: #c53030; font-size: 18px; font-weight: 600;">${formattedPrice}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Es tut uns leid für die Unannehmlichkeiten. Sie können gerne einen anderen
                freien Kurs bei <strong>${safeBusinessName}</strong> buchen.
              </p>

              <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                  Bei Fragen zur Rückerstattung antworten Sie nicht auf diese E-Mail, sondern
                  wenden Sie sich an Ihre Bank oder Ihren Karten-Anbieter.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                ${safeCompanyName}
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Rückerstattung – ${courseName}

Hallo,

leider war der Kurs "${courseName}" von ${businessName} bereits ausgebucht, als Ihre Zahlung bei uns eingegangen ist.

Ihre Zahlung wurde daher automatisch erstattet. Der Betrag wird Ihrer ursprünglichen Zahlungsmethode in der Regel innerhalb von 5–10 Werktagen wieder gutgeschrieben.

Erstatteter Betrag: ${formattedPrice}

Es tut uns leid für die Unannehmlichkeiten. Sie können gerne einen anderen freien Kurs bei ${businessName} buchen.

Bei Fragen zur Rückerstattung wenden Sie sich an Ihre Bank oder Ihren Karten-Anbieter.

${companyName}
Diese E-Mail wurde automatisch generiert.
  `;

  return { subject, html, text };
}
