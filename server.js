import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// IN-MEMORY OTP STORAGE
// ============================================
// Stores OTP with expiration time
// Format: { email: { otp: string, expires: number } }
const otpStore = new Map();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (data.expires < now) {
      otpStore.delete(email);
      console.log(`[OTP] Expired OTP removed for: ${email}`);
    }
  }
}, 5 * 60 * 1000);

// ============================================
// EMAIL TRANSPORTER CONFIGURATION
// ============================================
console.log('[EMAIL] Configuring Gmail SMTP...');
console.log('[EMAIL] EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ NOT SET');
console.log('[EMAIL] EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ NOT SET');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('[EMAIL] ✗ Transporter error:', error.message);
  } else {
    console.log('[EMAIL] ✓ Transporter ready and verified');
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a secure 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email with HTML template
 */
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: `"Auth Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
            You requested to reset your password. Use the OTP code below to proceed:
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #667eea;">
            <p style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0;">
              ${otp}
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin: 20px 0;">
            <strong>⏱️ This OTP will expire in 10 minutes.</strong>
          </p>
          
          <p style="color: #999; font-size: 12px; margin: 20px 0;">
            If you didn't request this, please ignore this email and your password will remain unchanged.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
          
          <p style="color: #999; font-size: 11px; text-align: center;">
            © 2026 Auth System. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * POST /api/auth/forgot-password
 * Generate OTP and send via email
 */
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log(`[OTP] Generating OTP for: ${email}`);

    // Generate OTP
    const otp = generateOTP();
    const expiresIn = 10 * 60 * 1000; // 10 minutes
    const expires = Date.now() + expiresIn;

    // Store OTP in memory
    otpStore.set(email, { otp, expires });
    console.log(`[OTP] OTP stored for ${email}, expires in 10 minutes`);

    // Send email
    console.log(`[EMAIL] Sending OTP email to: ${email}`);
    await sendOTPEmail(email, otp);
    console.log(`[EMAIL] ✓ OTP email sent successfully to: ${email}`);

    res.json({ 
      success: true, 
      message: 'OTP sent successfully to your email',
      expiresIn: expiresIn / 1000 // Return expiry in seconds
    });

  } catch (error) {
    console.error('[ERROR] Forgot password error:', error.message);
    res.status(500).json({ 
      error: 'Failed to send OTP email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP code
 */
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    console.log(`[OTP] Verifying OTP for: ${email}`);

    // Check if OTP exists
    const storedData = otpStore.get(email);
    if (!storedData) {
      console.log(`[OTP] ✗ No OTP found for: ${email}`);
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expires) {
      otpStore.delete(email);
      console.log(`[OTP] ✗ OTP expired for: ${email}`);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      console.log(`[OTP] ✗ Invalid OTP for: ${email}`);
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP verified successfully
    console.log(`[OTP] ✓ OTP verified for: ${email}`);
    
    // Keep OTP in store for password reset (will be cleared after password update)
    res.json({ 
      success: true, 
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('[ERROR] OTP verification error:', error.message);
    res.status(500).json({ 
      error: 'Failed to verify OTP',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/clear-otp
 * Clear OTP after successful password reset
 */
app.post('/api/auth/clear-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    otpStore.delete(email);
    console.log(`[OTP] OTP cleared for: ${email}`);

    res.json({ 
      success: true, 
      message: 'OTP cleared'
    });

  } catch (error) {
    console.error('[ERROR] Clear OTP error:', error.message);
    res.status(500).json({ error: 'Failed to clear OTP' });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    otpStoreSize: otpStore.size
  });
});

// ============================================
// SERVER STARTUP
// ============================================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[SERVER] ✓ Server running on port ${PORT}`);
  console.log(`[SERVER] ✓ API URL: http://localhost:${PORT}/api`);
  console.log(`[SERVER] ✓ Health check: http://localhost:${PORT}/api/health`);
  console.log(`${'='.repeat(50)}\n`);
});
