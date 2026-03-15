const bcrypt = require('bcryptjs');
const adminRepo = require('./admin.repository');
const { generateAdminToken } = require('../../utils/token.helper');
const { ERRORS } = require('../../shared/constants');
const { parsePagination } = require('../../utils/pagination.helper');

async function login({ email, password }) {
  const admin = await adminRepo.findAdminByEmail(email);
  if (!admin) throw ERRORS.UNAUTHORIZED('Invalid credentials');
  if (!admin.is_active) throw ERRORS.FORBIDDEN('Admin account is deactivated');

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) throw ERRORS.UNAUTHORIZED('Invalid credentials');

  const token = generateAdminToken({ id: admin.id, email: admin.email, role: admin.role });

  return {
    admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role },
    token,
    expiresIn: 28800, // 8h en segundos
  };
}

async function getDashboard() {
  return adminRepo.getDashboardStats();
}

async function listUsers(queryParams) {
  const { page, limit, offset } = parsePagination(queryParams);
  const search = queryParams.search || null;
  const { rows, total } = await adminRepo.findUsers({ offset, limit, search });
  return { users: rows, total, page, limit };
}

async function toggleUserStatus(userId, isActive) {
  await adminRepo.toggleUserStatus(userId, isActive);
  // Log de auditoría
  adminRepo.logAction({
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: userId,
  }).catch(() => {});
}

async function getActivity() {
  return adminRepo.getRecentActivity(50);
}

module.exports = { login, getDashboard, listUsers, toggleUserStatus, getActivity };
