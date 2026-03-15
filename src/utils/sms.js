/**
 * Servicio SMS con Twilio.
 *
 * Si TWILIO_ACCOUNT_SID está en el .env → envía SMS real.
 * Si no está configurado    → imprime el código en consola (modo dev).
 *
 * Para obtener credenciales Twilio (gratis):
 *   1. https://www.twilio.com/try-twilio  (solo requiere email)
 *   2. Verificar tu número de teléfono
 *   3. Copiar Account SID + Auth Token del dashboard
 *   4. El número trial asignado (ej. +15005550006) → TWILIO_PHONE_FROM
 *   5. Pegar los 3 valores en .env
 */

const logger = require('./logger');

let twilioClient = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }

  const twilio = require('twilio');
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  logger.info(`📱 SMS (Twilio) configurado → desde ${process.env.TWILIO_PHONE_FROM}`);
  return twilioClient;
}

/**
 * Envía el código OTP por SMS.
 * @param {object} opts
 * @param {string} opts.to    - Número en formato E.164 ej: +50661168890
 * @param {string} opts.code  - Código de 6 dígitos
 */
async function sendSmsVerificationCode({ to, code }) {
  const client = getTwilioClient();

  if (!client) {
    // Sin Twilio configurado → mostrar en consola (útil en desarrollo)
    logger.info(`📱 [SMS DEV] Para ${to}: tu código es ${code} (válido 15 min)`);
    return;
  }

  try {
    await client.messages.create({
      body: `Tu código de verificación BeeChat es: ${code}. Válido por 15 minutos. No lo compartas.`,
      from: process.env.TWILIO_PHONE_FROM,
      to,
    });
    logger.info(`📱 SMS enviado a ${to}`);
  } catch (err) {
    logger.error(`📱 SMS error [${err.code}]: ${err.message}`);
    throw err;
  }
}

module.exports = { sendSmsVerificationCode };
