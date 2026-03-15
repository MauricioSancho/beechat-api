/**
 * Servicio de correo electrónico con Nodemailer.
 *
 * Prioridad de configuración:
 *   1. Si SMTP_HOST está definido en .env → usa ese SMTP real (Gmail, etc.)
 *   2. Si no hay SMTP_HOST → usa Ethereal automáticamente (solo preview, no llega al buzón)
 *
 * Para Gmail: genera una "App Password" en tu cuenta Google y ponla en SMTP_PASS.
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;
let usingEthereal = false;

/**
 * Inicializa el transporter.
 * Si SMTP_HOST está configurado lo usa siempre (dev o prod).
 * Si no, cae a Ethereal como sandbox.
 */
async function initMailer() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // SMTP real configurado → usarlo independientemente del NODE_ENV
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    usingEthereal = false;
    logger.info(`📧 Mailer → SMTP real: ${process.env.SMTP_HOST} (${process.env.SMTP_USER})`);
  } else {
    // Sin SMTP configurado → Ethereal sandbox (solo preview en consola)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    usingEthereal = true;
    logger.info(`📧 Mailer → Ethereal sandbox (sin SMTP_HOST configurado): ${testAccount.user}`);
  }

  return transporter;
}

/**
 * Envía un correo.
 * @param {object} opts  - to, subject, html
 */
async function sendMail({ to, subject, html }) {
  const t = await initMailer();

  const info = await t.sendMail({
    from: process.env.SMTP_FROM || '"BeeChat 🐝" <noreply@beechat.app>',
    to,
    subject,
    html,
  });

  if (usingEthereal) {
    // Solo en modo sandbox: imprimir link de preview
    const previewUrl = nodemailer.getTestMessageUrl(info);
    logger.info(`📧 [Ethereal] Preview del email: ${previewUrl}`);
  } else {
    logger.info(`📧 Email enviado a ${to} | messageId: ${info.messageId}`);
  }

  return info;
}

/**
 * Plantilla: código de verificación de cuenta
 */
async function sendVerificationCode({ to, displayName, code }) {
  return sendMail({
    to,
    subject: '🐝 Tu código de verificación BeeChat',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #f5a623; margin-bottom: 8px;">BeeChat 🐝</h2>
        <p style="color: #333; font-size: 16px;">Hola <strong>${displayName}</strong>,</p>
        <p style="color: #555;">Tu código de verificación es:</p>
        <div style="background: #fff; border: 2px solid #f5a623; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
        </div>
        <p style="color: #888; font-size: 13px;">⏱ Válido por <strong>15 minutos</strong>. Máximo 5 intentos.</p>
        <p style="color: #888; font-size: 13px;">Si no creaste esta cuenta, ignora este correo.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #bbb; font-size: 12px; text-align: center;">BeeChat — No respondas a este correo</p>
      </div>
    `,
  });
}

module.exports = { initMailer, sendMail, sendVerificationCode };
