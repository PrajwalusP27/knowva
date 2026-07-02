const express =
  require("express");

const router =
  express.Router();

const nodemailer =
  require("nodemailer");


// ==========================================
// SEND CONTACT EMAIL
// Credentials come from .env — never
// hardcoded. Uses Gmail with app password.
// ==========================================
router.post("/contact", async (req, res) => {

  const { name, email, subject, message } =
    req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  try {

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from:    `"Knowva Contact" <${process.env.EMAIL_USER}>`,
      to:      process.env.EMAIL_TO || "knowva77@gmail.com",
      replyTo: email,
      subject: `[Knowva Contact] ${subject}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully.",
    });

  } catch (error) {

    console.log("Email error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again.",
    });
  }
});


module.exports = router;
