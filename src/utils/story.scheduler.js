/**
 * Scheduler de limpieza de stories expiradas.
 *
 * Ejecuta cada hora y desactiva las stories cuyo expires_at ya pasó.
 * También corre una vez al arrancar el servidor.
 */

const storiesRepo = require('../modules/stories/stories.repository');
const logger = require('./logger');

const INTERVAL_MS = 60 * 60 * 1000; // 1 hora
let _timer = null;

async function runCleanup() {
  try {
    const count = await storiesRepo.deactivateExpired();
    if (count > 0) {
      logger.info(`🗑️  Stories expiradas eliminadas: ${count}`);
    }
  } catch (err) {
    logger.error('Error en limpieza de stories:', err.message);
  }
}

function startStoryScheduler() {
  // Ejecutar inmediatamente al arrancar
  runCleanup();

  // Luego cada hora
  _timer = setInterval(runCleanup, INTERVAL_MS);

  // Evitar que el timer bloquee el cierre del proceso
  if (_timer.unref) _timer.unref();

  logger.info('⏰ Story scheduler iniciado (limpieza cada 1 hora)');
}

function stopStoryScheduler() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

module.exports = { startStoryScheduler, stopStoryScheduler };
