import db from '../models/index.js'
import { isHrAdmin } from '../utils/permissionUtils.js'

const { EmploymentProfile } = db

export async function getDirectReportIds(managerUserId) {
  const profiles = await EmploymentProfile.findAll({
    where: { managerId: managerUserId },
    attributes: ['userId'],
  })
  return profiles.map((p) => p.userId)
}

export async function isManagerOf(managerUserId, employeeId) {
  const profile = await EmploymentProfile.findOne({
    where: { userId: employeeId },
    attributes: ['managerId'],
  })
  return Boolean(profile && Number(profile.managerId) === Number(managerUserId))
}

export async function canApproveForEmployee(authUser, employeeId) {
  if (isHrAdmin(authUser)) return true
  return isManagerOf(authUser.id, employeeId)
}

export async function userHasDirectReports(userId) {
  const count = await EmploymentProfile.count({ where: { managerId: userId } })
  return count > 0
}
