/**
 * E-Mail Template für Manager-Benachrichtigung nach abgeschlossenem Onboarding
 *
 * Dieses Template wird an den Manager gesendet, wenn ein Mitarbeiter das Onboarding abgeschlossen hat.
 */

interface OnboardingCompleteEmailParams {
  managerName: string;
  employeeFirstName: string;
  employeeLastName: string;
  employeeEmail: string;
  companyName?: string;
}

/**
 * Generiert HTML für die Onboarding-Bestätigungs-E-Mail an den Manager
 */
export function generateOnboardingCompleteEmail({
  managerName,
  employeeFirstName,
  employeeLastName,
  employeeEmail,
  companyName = "Ihr Unternehmen",
}: OnboardingCompleteEmailParams): { subject: string; html: string; text: string } {
  const subject = `Onboarding abgeschlossen – ${employeeFirstName} ${employeeLastName}`;

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding abgeschlossen</title>
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
                Onboarding abgeschlossen ✓
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hallo ${managerName},
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Ihr Mitarbeiter hat das Onboarding erfolgreich abgeschlossen und ist nun im System aktiv.
              </p>

              <!-- Employee Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin: 0 0 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px; color: #999999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Mitarbeiter</p>
                    <p style="margin: 0 0 4px; color: #333333; font-size: 18px; font-weight: 600;">${employeeFirstName} ${employeeLastName}</p>
                    <p style="margin: 0; color: #667eea; font-size: 14px;">${employeeEmail}</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Der Mitarbeiter kann sich ab sofort mit seinen Zugangsdaten anmelden.
              </p>

              <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                  Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #666666; font-size: 14px;">
                ${companyName}
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
Onboarding abgeschlossen – ${employeeFirstName} ${employeeLastName}

Hallo ${managerName},

Ihr Mitarbeiter hat das Onboarding erfolgreich abgeschlossen und ist nun im System aktiv.

Mitarbeiter: ${employeeFirstName} ${employeeLastName}
E-Mail: ${employeeEmail}

Der Mitarbeiter kann sich ab sofort mit seinen Zugangsdaten anmelden.

${companyName}
Diese E-Mail wurde automatisch generiert.
  `;

  return { subject, html, text };
}
