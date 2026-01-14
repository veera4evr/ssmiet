const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Use memory storage to handle the PDF file in RAM
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
    origin: '*', 
    methods: ['POST', 'GET']
}));
app.use(express.json());

// --- CONFIGURATION ---
const ADMIN_EMAIL = 'ssmietadmissionportal@gmail.com'; 

// *** THE FIX: POOLING + EXTENDED TIMEOUTS ***
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,              // Using 465 (SSL) with pooling is widely considered the most stable
  secure: true,           // True for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // POOLING: Keeps the connection open so it doesn't have to reconnect for every email
  pool: true, 
  maxConnections: 1,      // Keep it simple for free tier
  rateLimit: 5,           // Prevent spamming
  
  // NETWORK SETTINGS
  family: 4,              // FORCE IPv4 (Critical for Render)
  
  // TIMEOUTS: Increased to 60 seconds (10s was killing the connection)
  connectionTimeout: 60000, 
  greetingTimeout: 30000,
  socketTimeout: 60000,
  
  tls: {
    rejectUnauthorized: false
  },
  logger: true,
  debug: true
});

// Verify connection on startup so you know it works immediately
transporter.verify(function (error, success) {
  if (error) {
    console.log("⚠️ SMTP Connection Error:", error);
  } else {
    console.log("✅ Server is ready to take our messages");
  }
});

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

    // ==========================================
    // EMAIL 1: TO ADMIN (Professional Report)
    // ==========================================
    const adminMailOptions = {
      from: `"SSMIET Portal Bot" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL, 
      subject: `[New App] ${name} - ${course}`, 
      html: `
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
      `,
      attachments: [{ filename: pdfFile.originalname, content: pdfFile.buffer }]
    };

    // ==========================================
    // EMAIL 2: TO STUDENT (Professional Receipt)
    // ==========================================
    const studentMailOptions = {
      from: `"SSMIET Admissions" <${process.env.EMAIL_USER}>`,
      to: email, 
      subject: `Application Receipt - ${course}`,
      html: `
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
      `,
      attachments: [{ filename: pdfFile.originalname, content: pdfFile.buffer }]
    };

    // Send Sequentially with the Pooled Connection
    console.log("Sending Admin Email...");
    await transporter.sendMail(adminMailOptions);
    console.log("Admin Email Sent.");

    console.log("Sending Student Email...");
    await transporter.sendMail(studentMailOptions);
    console.log("Student Email Sent.");

    console.log('Success: Professional emails sent to both Admin and Student.');
    res.status(200).json({ message: 'Emails sent successfully' });

  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});