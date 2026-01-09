/**
 * E-Mail Template für Mitarbeiter-Onboarding
 *
 * Dieses Template wird an neue Mitarbeiter gesendet, um ihnen den Onboarding-Link zu schicken.
 */

interface OnboardingEmailParams {
  email: string;
  onboardingUrl: string;
  companyName?: string;
}

/**
 * Generiert HTML für die Onboarding-E-Mail
 */
export function generateOnboardingEmail({
  email,
  onboardingUrl,
  companyName = "Ihr Unternehmen",
}: OnboardingEmailParams): { subject: string; html: string; text: string } {
  const subject = `Willkommen bei ${companyName} - Vervollständigen Sie Ihr Profil`;

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Willkommen</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Willkommen bei ${companyName}!
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
                Sie wurden als Mitarbeiter bei <strong>${companyName}</strong> registriert. Um Ihr Profil zu vervollständigen und Zugang zum System zu erhalten, klicken Sie bitte auf den Button unten.
              </p>

              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Ihre registrierte E-Mail-Adresse: <strong>${email}</strong>
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${onboardingUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Profil vervollständigen
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 20px; color: #666666; font-size: 14px; line-height: 1.6;">
                Oder kopieren Sie diesen Link in Ihren Browser:
              </p>

              <p style="margin: 0 0 30px; color: #667eea; font-size: 14px; word-break: break-all;">
                ${onboardingUrl}
              </p>

              <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                <p style="margin: 0 0 10px; color: #999999; font-size: 13px; line-height: 1.6;">
                  <strong>Wichtig:</strong> Dieser Link ist 7 Tage gültig.
                </p>
                <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                  Falls Sie diese E-Mail nicht erwartet haben, ignorieren Sie sie bitte.
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
Willkommen bei ${companyName}!

Hallo,

Sie wurden als Mitarbeiter bei ${companyName} registriert. Um Ihr Profil zu vervollständigen und Zugang zum System zu erhalten, öffnen Sie bitte den folgenden Link:

${onboardingUrl}

Ihre registrierte E-Mail-Adresse: ${email}

Wichtig: Dieser Link ist 7 Tage gültig.

Falls Sie diese E-Mail nicht erwartet haben, ignorieren Sie sie bitte.

${companyName}
Diese E-Mail wurde automatisch generiert.
  `;

  return { subject, html, text };
}
