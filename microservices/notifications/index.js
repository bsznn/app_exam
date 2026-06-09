// notifi/server.js
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APPLICATION_PASSWORD,
  },
});

app.post('/notify', async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({ message: 'to, subject et text sont requis.' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email envoyé avec succès.' });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'envoi de l'email.", error });
  }
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {});