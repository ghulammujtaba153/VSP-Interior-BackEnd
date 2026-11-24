import {
  loadUserWithPermissions,
  isHrAdmin,
  resolveEmployeeIdFromRequest,
} from '../utils/permissionUtils.js'

export const attachAuthUser = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const user = await loadUserWithPermissions(req.user.userId)
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    req.authUser = user
    next()
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const requireHrAdmin = (action = 'canView') => {
  return (req, res, next) => {
    if (!req.authUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const allowed =
      isHrAdmin(req.authUser) ||
      req.authUser.Role?.Permissions?.some(
        (p) =>
          p.Resource?.name?.toLowerCase() === 'human resource' && p[action]
      )

    if (!allowed) {
      return res.status(403).json({ success: false, message: 'HR admin access required' })
    }

    next()
  }
}

export const requireSelfOrHr = (options = {}) => {
  const { paramKey = 'employeeId', bodyKey = 'employeeId' } = options

  return (req, res, next) => {
    if (!req.authUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    if (isHrAdmin(req.authUser)) {
      return next()
    }

    const targetId =
      Number(req.params[paramKey]) ||
      Number(req.body?.[bodyKey]) ||
      Number(req.query?.[bodyKey]) ||
      resolveEmployeeIdFromRequest(req)

    if (targetId && targetId === req.authUser.id) {
      return next()
    }

    // List endpoints without id: allow authenticated users (filtered in controller)
    if (!targetId && req.method === 'GET') {
      return next()
    }

    return res.status(403).json({ success: false, message: 'Access denied' })
  }
}

/** HR admin or user with direct reports (line manager). */
export const requireManagerOrHr = () => {
  return async (req, res, next) => {
    if (!req.authUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    if (isHrAdmin(req.authUser)) {
      req.isHrAdmin = true
      return next()
    }

    const { userHasDirectReports } = await import('../service/managerService.js')
    const isManager = await userHasDirectReports(req.authUser.id)
    if (isManager) {
      req.isManager = true
      return next()
    }

    return res.status(403).json({ success: false, message: 'Manager or HR access required' })
  }
}
