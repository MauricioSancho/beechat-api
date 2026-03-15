const devicesRepo = require('./devices.repository');
const { ERRORS } = require('../../shared/constants');

async function listDevices(userId) {
  return devicesRepo.findByUserId(userId);
}

async function registerDevice(userId, { deviceType, deviceName, pushToken }) {
  return devicesRepo.create({ userId, deviceType, deviceName, pushToken });
}

async function removeDevice(userId, deviceId) {
  const device = await devicesRepo.findById(deviceId, userId);
  if (!device) throw ERRORS.NOT_FOUND('Device');
  await devicesRepo.deactivate(deviceId, userId);
}

async function verifyDevice(userId, deviceId) {
  const device = await devicesRepo.findById(deviceId, userId);
  if (!device) throw ERRORS.NOT_FOUND('Device');
  await devicesRepo.verify(deviceId, userId);
}

module.exports = { listDevices, registerDevice, removeDevice, verifyDevice };
