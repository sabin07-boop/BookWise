import "dotenv/config";
import nodemailer from "nodemailer";

const recipient = process.argv[2];
if (!recipient) {
  console.error("Usage: node test-gmail.js recipient@example.com");
  process.exit(1);
}

const sender = String(process.env.GMAIL_SMTP_USER || "").trim();
const appPassword = String(process.env.GMAIL_SMTP_APP_PASSWORD || "").replace(
  /\s/g,
  "",
);
if (!sender) throw new Error("GMAIL_SMTP_USER is missing");
if (!appPassword) throw new Error("GMAIL_SMTP_APP_PASSWORD is missing");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: sender, pass: appPassword },
});

try {
  await transporter.verify();
  console.log("Gmail SMTP authentication successful.");
  const info = await transporter.sendMail({
    from: `"BookWise" <${sender}>`,
    to: recipient,
    subject: "BookWise SMTP Test",
    text: "HI",
    html: "<p>HI</p>",
  });
  console.log("EMAIL SENT SUCCESSFULLY");
  console.log("Message ID:", info.messageId);
  console.log("Response:", info.response);
} catch (error) {
  console.error("GMAIL SMTP FAILED");
  console.error("Code:", error.code);
  console.error("Message:", error.message);
  console.error("Response:", error.response);
  process.exitCode = 1;
}
