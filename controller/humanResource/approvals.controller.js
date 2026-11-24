import db from '../../models/index.js'
import { Op } from 'sequelize'
import { isHrAdmin } from '../../utils/permissionUtils.js'
import { getDirectReportIds, userHasDirectReports } from '../../service/managerService.js'

const { EmployeeLeave, EmployeeTimeSheet, User } = db

const userInclude = {
  model: User,
  as: 'employee',
  attributes: ['id', 'name', 'email'],
}

export const getApprovalsQueue = async (req, res) => {
  try {
    const hr = isHrAdmin(req.authUser)
    const scope = req.query.scope === 'team' ? 'team' : hr ? 'all' : 'team'
    const isManager = await userHasDirectReports(req.authUser.id)

    if (!hr && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Manager or HR access required',
      })
    }

    let employeeIds = null
    if (scope === 'team') {
      employeeIds = await getDirectReportIds(req.authUser.id)
      if (!employeeIds.length) {
        return res.json({
          success: true,
          data: {
            scope: 'team',
            isManager: false,
            isHrAdmin: hr,
            leave: [],
            timesheets: [],
            counts: { leave: 0, timesheets: 0, total: 0 },
          },
        })
      }
    }

    const employeeFilter = employeeIds ? { employeeId: { [Op.in]: employeeIds } } : {}

    const [leave, timesheets] = await Promise.all([
      EmployeeLeave.findAll({
        where: { status: 'pending', ...employeeFilter },
        include: [userInclude],
        order: [['createdAt', 'ASC']],
        limit: 100,
      }),
      EmployeeTimeSheet.findAll({
        where: {
          status: { [Op.in]: ['pending', 'submitted'] },
          ...employeeFilter,
        },
        include: [userInclude],
        order: [['date', 'DESC']],
        limit: 100,
      }),
    ])

    return res.json({
      success: true,
      data: {
        scope,
        isManager,
        isHrAdmin: hr,
        leave,
        timesheets,
        counts: {
          leave: leave.length,
          timesheets: timesheets.length,
          total: leave.length + timesheets.length,
        },
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
