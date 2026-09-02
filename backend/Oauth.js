import "dotenv/config";
import nodemailer from "nodemailer";

const recipient = process.argv[2];

if (!recipient) {
  console.error("Usage:");
  console.error("node test-gmail.js recipient@example.com");
  process.exit(1);
}

const sender = process.env.GMAIL_SMTP_USER;
const appPassword = process.env.GMAIL_SMTP_APP_PASSWORD;

if (!sender) {
  throw new Error("GMAIL_SMTP_USER is missing");
}

if (!appPassword) {
  throw new Error("GMAIL_SMTP_APP_PASSWORD is missing");
}

console.log("================================");
console.log("BOOKWISE GMAIL SMTP TEST");
console.log("================================");
console.log("Sender:", sender);
console.log("Recipient:", recipient);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: sender,
    pass: appPassword,
  },
});

try {
  await transporter.verify();

  console.log("\n✅ Gmail SMTP authentication successful.");

  const info = await transporter.sendMail({
    from: `"BookWise" <${sender}>`,
    to: recipient,
    subject: "BookWise SMTP Test",
    text: "HI",
    html: "<p>HI</p>",
  });

  console.log("\n================================");
  console.log("✅ EMAIL SENT SUCCESSFULLY");
  console.log("================================");
  console.log("Message ID:", info.messageId);
  console.log("Response:", info.response);
} catch (error) {
  console.error("\n================================");
  console.error("❌ GMAIL SMTP FAILED");
  console.error("================================");
  console.error("Code:", error.code);
  console.error("Message:", error.message);
  console.error("Response:", error.response);
}
