import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import admin from "firebase-admin";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // OTP Sending Endpoint
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
      console.log(`[AUTH] Attempting to send OTP to ${email}`);
      
      // Check if user exists using admin auth
      // This is where the Identity Toolkit API error usually occurs
      try {
        await admin.auth().getUserByEmail(email);
      } catch (e: any) {
        console.error(`[AUTH] Error checking user ${email}:`, e);
        if (e.code === 'auth/user-not-found') {
          return res.status(404).json({ error: "No user found with this email address" });
        }
        if (e.code === 'auth/internal-error' && e.message.includes('identitytoolkit.googleapis.com')) {
          return res.status(503).json({ 
            error: "Firebase Identity Toolkit API is not enabled. Please enable it in the Google Cloud Console to use custom OTP reset.",
            link: "https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview?project=" + process.env.VITE_FIREBASE_PROJECT_ID
          });
        }
        throw e;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP in Firestore
      await db.collection("otps").doc(email).set({
        otp,
        expiresAt,
      });

      // Send Email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: `"Auth System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Password Reset OTP",
        headers: {
          "X-Priority": "1 (Highest)",
          "X-MSMail-Priority": "High",
          "Importance": "High"
        },
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; color: #0f172a;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #0f172a;">Password Reset</h1>
              <p style="color: #64748b; margin-top: 8px;">Secure verification code</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              You requested to reset your password. Use the following 6-digit code to proceed. This code will expire in <strong>10 minutes</strong>.
            </p>
            
            <div style="background-color: #f8fafc; padding: 32px; border-radius: 16px; text-align: center; margin: 32px 0; border: 1px dashed #cbd5e1;">
              <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #0f172a; font-family: monospace;">${otp}</span>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 32px;">
              If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
            </p>
            
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; 2026 Auth System. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[AUTH] OTP sent to ${email}`);
      res.json({ message: "OTP sent successfully" });
    } catch (error: any) {
      console.error("Send OTP Error:", error);
      res.status(500).json({ error: "Failed to send OTP. " + (error.message || "") });
    }
  });

  // OTP Verification Endpoint
  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    try {
      const otpDoc = await db.collection("otps").doc(email).get();
      if (!otpDoc.exists) return res.status(400).json({ error: "OTP not found or expired" });

      const data = otpDoc.data();
      if (data?.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
      if (Date.now() > data?.expiresAt) return res.status(400).json({ error: "OTP expired" });

      res.json({ message: "OTP verified successfully" });
    } catch (error: any) {
      console.error("Verify OTP Error:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Password Reset Endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: "All fields are required" });

    try {
      // Verify OTP again for security
      const otpDoc = await db.collection("otps").doc(email).get();
      if (!otpDoc.exists) return res.status(400).json({ error: "OTP not found or expired" });

      const data = otpDoc.data();
      if (data?.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
      if (Date.now() > data?.expiresAt) return res.status(400).json({ error: "OTP expired" });

      // Update password in Firebase Auth
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, {
          password: newPassword,
        });
      } catch (e: any) {
        console.error(`[AUTH] Error updating password for ${email}:`, e);
        if (e.code === 'auth/internal-error' && e.message.includes('identitytoolkit.googleapis.com')) {
          return res.status(503).json({ 
            error: "Firebase Identity Toolkit API is not enabled. Please enable it in the Google Cloud Console.",
            link: "https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview?project=" + process.env.VITE_FIREBASE_PROJECT_ID
          });
        }
        throw e;
      }

      // Delete OTP after successful reset
      await db.collection("otps").doc(email).delete();

      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[SERVER] Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
