/**
 * Servicio SMS con Vonage.
 *
 * Si VONAGE_API_KEY y VONAGE_API_SECRET están en el .env → envía SMS real.
 * Si no están configurados → imprime el código en consola (modo dev).
 *
 * Cómo obtener credenciales Vonage:
 *   1. https://ui.idp.vonage.com/ui/auth/registration  (registro)
 *   2. En el dashboard → copiar API Key y API Secret
 *   3. VONAGE_FROM puede ser tu número comprado o un nombre alfanumérico (ej: "BeeChat")
 *      Nota: los nombres alfanuméricos no funcionan en todos los países (ej. USA no los soporta)
 *   4. Pegar los 3 valores en .env
 */

const logger = require('./logger');

let vonageClient = null;

function getVonageClient() {
  if (vonageClient) return vonageClient;

  if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
    return null;
  }

  const { Vonage } = require('@vonage/server-sdk');
  vonageClient = new Vonage({
    apiKey:    process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
  });

  logger.info(`📱 SMS (Vonage) configurado → desde ${process.env.VONAGE_FROM}`);
  return vonageClient;
}

/**
 * Envía el código OTP por SMS.
 * @param {object} opts
 * @param {string} opts.to    - Número en formato E.164 ej: +50661168890
 * @param {string} opts.code  - Código de 6 dígitos
 */
async function sendSmsVerificationCode({ to, code }) {
  const client = getVonageClient();

  if (!client) {
    // Sin Vonage configurado → mostrar en consola (útil en desarrollo)
    logger.info(`📱 [SMS DEV] Para ${to}: tu código es ${code} (válido 15 min)`);
    return;
  }

  const response = await client.sms.send({
    to,
    from: process.env.VONAGE_FROM,
    text: `Tu código de verificación BeeChat es: ${code}. Válido por 15 minutos. No lo compartas.`,
  });

  const msg = response.messages[0];

  if (msg.status !== '0') {
    const err = new Error(`Vonage SMS error [${msg.status}]: ${msg['error-text']}`);
    logger.error(err.message);
    throw err;
  }

  logger.info(`📱 SMS enviado a ${to} (id: ${msg['message-id']})`);
}

module.exports = { sendSmsVerificationCode };
