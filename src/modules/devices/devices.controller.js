const devicesService = require('./devices.service');
const { sendSuccess, sendCreated, sendMessage, asyncHandler } = require('../../utils/response.helper');

const listDevices = asyncHandler(async (req, res) => {
  const devices = await devicesService.listDevices(req.user.id);
  return sendSuccess(res, devices);
});

const registerDevice = asyncHandler(async (req, res) => {
  const { deviceType, deviceName, pushToken } = req.body;
  const device = await devicesService.registerDevice(req.user.id, { deviceType, deviceName, pushToken });
  return sendCreated(res, device);
});

const removeDevice = asyncHandler(async (req, res) => {
  await devicesService.removeDevice(req.user.id, parseInt(req.params.deviceId, 10));
  return sendMessage(res, 'Device removed');
});

const verifyDevice = asyncHandler(async (req, res) => {
  await devicesService.verifyDevice(req.user.id, parseInt(req.params.deviceId, 10));
  return sendMessage(res, 'Device verified');
});

module.exports = { listDevices, registerDevice, removeDevice, verifyDevice };
