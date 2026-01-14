const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
    origin: '*', 
    methods: ['POST', 'GET']
}));
app.use(express.json());

// --- CONFIGURATION ---
const ADMIN_EMAIL = 'ssmietadmissionportal@gmail.com'; 

// *** THE FIX: FRESH CONNECTION FUNCTION ***
// Instead of one global transporter, we create a fresh one for every email.
// This bypasses the "Idle Connection" blocks from Google.
async function sendMailWithFreshConnection(to, subject, html, attachment) {
  const transporter = nodemailer.createTransport({
    // TRICK: Use googlemail.com instead of gmail.com
    host: "smtp.googlemail.com", 
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Network Settings
    tls: { rejectUnauthorized: false },
    family: 4, // Force IPv4
  });

  const mailOptions = {
    from: `"SSMIET Admission Portal" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: html,
    attachments: [attachment]
  };

  return transporter.sendMail(mailOptions);
}

app.get('/', (req, res) => {
    res.send('SSMIET Backend is Running! 🚀');
});

app.post('/send-email', upload.single('pdf'), async (req, res) => {
  try {
    const { email, name, course, cutoff } = req.body;
    const pdfFile = req.file;

    if (!email || !pdfFile) {
      return res.status(400).json({ error: 'Missing email or PDF file' });
    }

    // Get Current Date & Time
    const now = new Date();
    const appDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const appTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    console.log(`Processing Application for: ${name}`);

    // PDF Attachment Object
    const attachment = { filename: pdfFile.originalname, content: pdfFile.buffer };

    // ==========================================
    // EMAIL 1: TO ADMIN (Your Exact Template)
    // ==========================================
    const adminHtml = `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d1d5db; background-color: #ffffff;">
          
          <div style="background-color: #dc2626; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; text-transform: uppercase; font-size: 18px; letter-spacing: 1px;">New Application Alert</h2>
          </div>

          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px;"><strong>Hello Admin,</strong></p>
            <p style="color: #4b5563;">A new student admission application has been received via the portal.</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; width: 35%;">Student Name</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Selected Course</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${course}</td>
              </tr>
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Calculated Cut-off</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${cutoff} / 200</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Student Email</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${email}</td>
              </tr>
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Submitted On</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${appDate} at ${appTime}</td>
              </tr>
            </table>

            <div style="margin-top: 25px; padding: 15px; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; color: #9f1239;">
              <strong>⚠️ Action Required:</strong> Please review the attached PDF document for validity.
            </div>
          </div>
        </div>
    `;

    // ==========================================
    // EMAIL 2: TO STUDENT (Your Exact Template)
    // ==========================================
    const studentHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
          
          <div style="background-color: #004d71; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Application Receipt</h1>
            <p style="color: #8bbdda; margin: 5px 0 0;">SSM Institute of Engineering and Technology</p>
          </div>

          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>
            <p style="color: #555555; line-height: 1.5;">Your application has been successfully submitted to our admissions portal. Please keep this receipt for your records.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 12px 0; color: #888888; width: 40%;">Course Applied</td>
                <td style="padding: 12px 0; color: #333333; font-weight: bold; text-align: right;">${course}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 12px 0; color: #888888;">Submission Date</td>
                <td style="padding: 12px 0; color: #333333; font-weight: bold; text-align: right;">${appDate}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 12px 0; color: #888888;">Submission Time</td>
                <td style="padding: 12px 0; color: #333333; font-weight: bold; text-align: right;">${appTime}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888888;">Cut-off Marks</td>
                <td style="padding: 12px 0; color: #004d71; font-weight: bold; font-size: 16px; text-align: right;">${cutoff} / 200</td>
              </tr>
            </table>

            <div style="background-color: #f8f9fa; border-radius: 4px; padding: 15px; text-align: center; margin-top: 20px;">
              <p style="margin: 0; color: #555555; font-size: 14px;">
                📎 <strong>Reference Copy:</strong> Your official application PDF is attached to this email.
              </p>
            </div>
          </div>

          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0;">&copy; ${now.getFullYear()} SSMIET Admission Portal</p>
            <p style="margin: 5px 0 0;">This is an automated message. Please do not reply.</p>
          </div>
        </div>
    `;

    // --- SENDING LOGIC (Using the Helper Function) ---
    
    // 1. Send Admin Email
    console.log("Creating fresh connection for Admin email...");
    await sendMailWithFreshConnection(
      ADMIN_EMAIL, 
      `[New App] ${name} - ${course}`, 
      adminHtml, 
      attachment
    );
    console.log("✅ Admin Email Sent.");

    // 2. Send Student Email
    console.log("Creating fresh connection for Student email...");
    await sendMailWithFreshConnection(
      email, 
      `Application Receipt - ${course}`, 
      studentHtml, 
      attachment
    );
    console.log("✅ Student Email Sent.");

    res.status(200).json({ message: 'Emails sent successfully' });

  } catch (error) {
    console.error('❌ Error sending emails:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});