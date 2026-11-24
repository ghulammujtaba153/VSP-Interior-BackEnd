import db from '../models/index.js'

const { User, Role, Permission, Resource } = db

export function isSuperAdmin(roleName) {
  if (!roleName) return false
  const n = String(roleName).toLowerCase().trim()
  return n === 'superadmin' || n === 'super admin' || n === 'super_admin'
}

export async function loadUserWithPermissions(userId) {
  return User.findByPk(userId, {
    include: [
      {
        model: Role,
        include: [
          {
            model: Permission,
            include: [{ model: Resource }],
          },
        ],
      },
    ],
  })
}

export function hasResourcePermission(user, resourceName, action = 'canView') {
  if (!user?.Role) return false
  if (isSuperAdmin(user.Role.name)) return true

  const target = String(resourceName).toLowerCase().trim()
  const permissions = user.Role.Permissions || []

  return permissions.some((perm) => {
    const name = perm.Resource?.name?.toLowerCase().trim()
    return name === target && Boolean(perm[action])
  })
}

export function isHrAdmin(user) {
  return hasResourcePermission(user, 'human resource', 'canView')
}

export function resolveEmployeeIdFromRequest(req) {
  const fromParams =
    req.params.employeeId ||
    req.params.userId ||
    req.params.id

  const fromBody = req.body?.employeeId || req.body?.userId
  const fromQuery = req.query?.employeeId || req.query?.userId

  const raw = fromBody || fromQuery || fromParams
  if (raw === undefined || raw === null || raw === '') return null
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? null : parsed
}
