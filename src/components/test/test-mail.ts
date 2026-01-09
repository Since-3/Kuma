import "dotenv/config";
import { sendMail, verifyMailConnection } from "@/src/lib/mail/nodemailer";

async function testEmail() {
  // Verbindung testen
  console.log("Teste SMTP-Verbindung...");

  const isConnected = await verifyMailConnection();

  if (!isConnected) {
    console.error("SMTP-Verbindung fehlgeschlagen!");
    return;
  }

  console.log("SMTP-Verbindung erfolgreich!");

  // Test-Mail senden
  console.log("Sende Test-Mail...");
  const result = await sendMail({
    to: process.env.SMTP_TEST_MAIL || "",
    subject: "Test-Email von S3 Kuma",
    html: "<h1>Test erfolgreich!</h1><p>Der E-Mail-Versand funktioniert.</p>",
  });

  if (result.success) {
    console.log("Test-Mail erfolgreich gesendet!");
  } else {
    console.log("Fehler beim Senden:", result.error);
  }
}

testEmail();
