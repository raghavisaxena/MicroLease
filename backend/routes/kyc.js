const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Kyc, User } = require('../models');
const bcrypt = require('bcrypt');

// Get current user's KYC
router.get('/', auth, async (req, res) => {
  try {
    let kyc = await Kyc.findOne({ where: { UserId: req.user.id } });
    if (!kyc) return res.json({ kyc: null });
    // do not send otp hash
    const obj = kyc.toJSON();
    delete obj.otpHash;
    res.json({ kyc: obj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create / request OTP
router.post('/', auth, async (req, res) => {
  try {
    const { nameOnId, aadharNumber, aadharMobile } = req.body;
    if (!nameOnId || !aadharNumber || !aadharMobile) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let kyc = await Kyc.findOne({ where: { UserId: req.user.id } });
    if (!kyc) {
      kyc = await Kyc.create({ UserId: req.user.id, nameOnId, aadharNumber, aadharMobile });
    } else {
      kyc.nameOnId = nameOnId;
      kyc.aadharNumber = aadharNumber;
      kyc.aadharMobile = aadharMobile;
      kyc.verified = false;
      await kyc.save();
    }

    // generate OTP (6 digits) and store hashed with expiry
    const otp = Math.floor(100000 + Math.random() * 900000);
    await kyc.setOtp(String(otp), 10); // ttl 10 mins

    // Try to send OTP via configured SMS provider (fast2sms supported) or fall back to console
    // Try SMS first; on failure attempt email to user's registered email; otherwise fallback to console
    try {
      const { sendSms } = require('../lib/sms');
      await sendSms(aadharMobile, `Your MicroLease OTP is ${otp}`);
      return res.json({ message: 'OTP generated and sent to registered mobile', otpSentTo: aadharMobile });
    } catch (smsErr) {
      console.error('SMS send error:', smsErr);
      // try email fallback if user has email
      try {
        const { sendEmail } = require('../lib/email');
        const to = req.user.email;
        if (to) {
          await sendEmail(to, 'MicroLease KYC OTP', `Your OTP is ${otp}`);
          return res.json({ message: 'OTP generated and sent via email (fallback)', otpSentTo: to });
        }
      } catch (emailErr) {
        console.error('Email fallback failed:', emailErr);
      }

      // final fallback to console
      console.log(`KYC OTP for user ${req.user.id} -> ${otp} (send to ${aadharMobile})`);
      return res.json({ message: 'OTP generated and (mock) sent to registered mobile', otpSentTo: aadharMobile });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
router.post('/verify', auth, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP required' });

    const kyc = await Kyc.findOne({ where: { UserId: req.user.id } });
    if (!kyc) return res.status(404).json({ message: 'KYC not found' });

    const ok = await kyc.verifyOtp(String(otp));
    if (!ok) return res.status(400).json({ message: 'Invalid or expired OTP' });

    kyc.verified = true;
    kyc.verifiedAt = new Date();
    // clear OTP fields
    kyc.otpHash = null;
    kyc.otpExpires = null;
    await kyc.save();

    res.json({ message: 'KYC verified', kyc: { verified: true, verifiedAt: kyc.verifiedAt } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
