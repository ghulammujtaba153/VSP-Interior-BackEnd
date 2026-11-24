import { authMiddleware } from '../middleware/authMiddleware.js'
import { attachAuthUser, requireHrAdmin, requireSelfOrHr } from '../middleware/hrPermissionMiddleware.js'

/** Standard HR route guards: authenticated + user loaded */
export const hrAuth = [authMiddleware, attachAuthUser]

/** HR admin only */
export const hrAdmin = [...hrAuth, requireHrAdmin()]

/** HR admin for mutations */
export const hrAdminEdit = [...hrAuth, requireHrAdmin('canEdit')]

/** Self or HR admin (employeeId param) */
export const hrSelfOrAdmin = [...hrAuth, requireSelfOrHr()]

/** Self or HR admin (:id param) */
export const hrSelfOrAdminById = [...hrAuth, requireSelfOrHr({ paramKey: 'id' })]

/** Self or HR admin (:userId param) */
export const hrSelfOrAdminByUserId = [...hrAuth, requireSelfOrHr({ paramKey: 'userId' })]
