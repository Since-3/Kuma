/**
 * E-Mail Template für Buchungs-Bestätigung
 *
 * Dieses Template wird an den Kunden gesendet, nachdem eine Kurs-Buchung
 * erfolgreich bezahlt wurde (Stripe Webhook checkout.session.completed).
 */

interface BookingConfirmationEmailParams {
  courseName: string;
  courseDate: Date;
  timeFrom: string;
  timeTo: string;
  businessName: string;
  businessAddress?: string;
  amountPaidCents: number;
  myCoursesUrl: string;
  coverImageUrl?: string | null;
  companyName?: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Generiert HTML für die Buchungs-Bestätigung
 */
export function generateBookingConfirmationEmail({
  courseName,
  courseDate,
  timeFrom,
  timeTo,
  businessName,
  businessAddress,
  amountPaidCents,
  myCoursesUrl,
  coverImageUrl,
  companyName = "Ihr Unternehmen",
}: BookingConfirmationEmailParams): { subject: string; html: string; text: string } {
  const subject = `Buchungsbestätigung – ${courseName}`;
  const formattedDate = formatDate(courseDate);
  const formattedPrice = formatPrice(amountPaidCents);

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buchungsbestätigung</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          ${
            coverImageUrl
              ? `
          <!-- Cover Image Banner -->
          <tr>
            <td style="padding: 0; line-height: 0;">
              <img src="${coverImageUrl}" alt="${courseName}" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; object-fit: cover;" />
            </td>
          </tr>
          `
              : ""
          }

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Buchung bestätigt ✓
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hallo,
              </p>

              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                vielen Dank für Ihre Buchung. Ihre Zahlung wurde erfolgreich verarbeitet.
                Hier sind die Details Ihres Kurses:
              </p>

              <!-- Course Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin: 0 0 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 4px; color: #999999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Kurs</p>
                    <p style="margin: 0 0 16px; color: #333333; font-size: 18px; font-weight: 600;">${courseName}</p>

                    <p style="margin: 0 0 4px; color: #999999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Anbieter</p>
                    <p style="margin: 0 0 16px; color: #333333; font-size: 15px;">${businessName}</p>

                    <p style="margin: 0 0 4px; color: #999999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Termin</p>
                    <p style="margin: 0 0 4px; color: #333333; font-size: 15px;">${formattedDate}</p>
                    <p style="margin: 0 0 16px; color: #333333; font-size: 15px;">${timeFrom} – ${timeTo} Uhr</p>

                    ${
                      businessAddress
                        ? `
                    <p style="margin: 0 0 4px; color: #999999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Ort</p>
                    <p style="margin: 0 0 16px; color: #333333; font-size: 15px;">${businessAddress}</p>
                    `
                        : ""
                    }

                    <div style="border-top: 1px solid #e0e0e0; padding-top: 16px; margin-top: 8px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #666666; font-size: 14px;">Bezahlt</td>
                          <td align="right" style="color: #333333; font-size: 18px; font-weight: 600;">${formattedPrice}</td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Wir wünschen Ihnen viel Spaß im Kurs!
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
                <tr>
                  <td align="center">
                    <a href="${myCoursesUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Zu meinen Kursen
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                Oder kopieren Sie diesen Link in Ihren Browser:
              </p>
              <p style="margin: 8px 0 0; color: #667eea; font-size: 14px; word-break: break-all; text-align: center;">
                ${myCoursesUrl}
              </p>

              <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                  Bei Fragen zu Ihrer Buchung wenden Sie sich bitte direkt an den Anbieter <strong>${businessName}</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                ${companyName}
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
Buchung bestätigt – ${courseName}

Hallo,

vielen Dank für Ihre Buchung. Ihre Zahlung wurde erfolgreich verarbeitet.

Kurs: ${courseName}
Anbieter: ${businessName}
Termin: ${formattedDate}, ${timeFrom} – ${timeTo} Uhr
${businessAddress ? `Ort: ${businessAddress}\n` : ""}Bezahlt: ${formattedPrice}

Wir wünschen Ihnen viel Spaß im Kurs!

Zu meinen Kursen: ${myCoursesUrl}

Bei Fragen zu Ihrer Buchung wenden Sie sich bitte direkt an den Anbieter ${businessName}.

${companyName}
Diese E-Mail wurde automatisch generiert.
  `;

  return { subject, html, text };
}
