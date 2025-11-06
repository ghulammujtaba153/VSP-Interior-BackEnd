import db from "../../models/index.js"
import { Op, fn, col, literal, Sequelize } from "sequelize"

const { Worker, Audit, ProjectSetupJobWorker, ProjectSetupJob, ProjectSetup, EmployeeTimeSheet, EmployeeLeave, User } = db

export const createWorker = async (req, res) => {
    try {
        const worker = await Worker.create(req.body)
        res.status(201).json(worker)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}



export const importCSV = async (req, res) => {
    const { userId, workers } = req.body;

    try {
        // Get existing workers from DB
        const existingWorkers = await Worker.findAll({ attributes: ["email"] });
        const existingEmails = new Set(existingWorkers.map(e => e.email));

        // Filter out duplicates by email
        const uniqueWorkers = workers.filter(worker => !existingEmails.has(worker.email));

        let insertedWorkers = [];
        if (uniqueWorkers.length > 0) {
            insertedWorkers = await Worker.bulkCreate(uniqueWorkers.map(row => ({ ...row })));

            // Audit log only when new workers are added
            await Audit.create({ 
                userId, 
                action: 'import', 
                tableName: 'workers', 
                newData: insertedWorkers 
            });
        }

        res.status(201).json({
            message: `Processed successfully, added: ${insertedWorkers.length}, skipped: ${workers.length - insertedWorkers.length}`,
            inserted: insertedWorkers.length,
            skipped: workers.length - insertedWorkers.length,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




export const getAllWorkers = async (req, res) => {
    let { page = 1, limit = 10, search = "", status = "", jobTitle = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    // Build search conditions
    const whereConditions = {};
    if (search.trim() !== "") {
        whereConditions[db.Sequelize.Op.or] = [
            { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { phone: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        ];
    }
    if (status && status !== "") {
        whereConditions.status = status;
    }
    if (jobTitle && jobTitle !== "") {
        whereConditions.jobTitle = jobTitle;
    }

    try {
        const workers = await Worker.findAndCountAll({
            where: whereConditions,
            offset,
            limit,
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
            total: workers.count,
            workers: workers.rows,
            page,
            limit,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



export const getWorkerById = async (req, res) => {
    try {
        const worker = await Worker.findByPk(req.params.id)
        if (!worker) {
            return res.status(404).json({ message: "Worker not found" })
        }
        res.status(200).json(worker)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}



export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;

    // Update the worker
    const [updated] = await Worker.update(req.body, {
      where: { id },
    });

    if (updated) {
      const updatedWorker = await Worker.findByPk(id);
      return res.status(200).json(updatedWorker);
    }

    return res.status(404).json({ message: "Worker not found" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const deleteWorker = async (req, res) => {
    try {
        const worker = await Worker.destroy({ where: { id: req.params.id } })
        res.status(200).json({ message: "Worker deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


export const getWorkerStats = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    // Standard working hours: 5 days/week * 8 hours/day = 40 hours/week
    const HOURS_PER_DAY = 8;
    const DAYS_PER_WEEK = 5;
    const HOURS_PER_WEEK = HOURS_PER_DAY * DAYS_PER_WEEK; // 40 hours

    // Build date filter if provided
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    // ==================== 1. TOTAL WORKERS ====================
    const totalWorkers = await Worker.count({
      where: {
        status: 'active',
        ...dateFilter,
      },
    });

    // ==================== 2. ACTIVE WORKERS (will be calculated from workerAssignments below) ====================

    // ==================== 3. GET ALL WORKER ASSIGNMENTS WITH HOURS ====================
    const workerAssignments = await ProjectSetupJobWorker.findAll({
      attributes: [
        'workerId',
        'hoursAssigned',
        'role',
        'projectSetupJobId',
      ],
      include: [
        {
          model: Worker,
          as: 'worker',
          attributes: ['id', 'name', 'jobTitle', 'weeklyHours', 'status'],
          required: true,
          where: {
            status: 'active',
          },
        },
        {
          model: ProjectSetupJob,
          as: 'projectSetup',
          attributes: ['id', 'projectSetupId', 'startDate', 'endDate', 'status'],
          where: {
            status: { [Op.in]: ['scheduled', 'in-progress'] },
          },
          include: [
            {
              model: ProjectSetup,
              as: 'projectSetup',
              attributes: ['id', 'projectName'],
              required: false,
            },
          ],
          required: true,
        },
      ],
    });

    // ==================== 4. CALCULATE TOTAL AVAILABLE HOURS ====================
    // Sum of all active workers' weekly hours (standard: 40 hours/week)
    const allWorkers = await Worker.findAll({
      where: { status: 'active' },
      attributes: ['id', 'weeklyHours'],
    });

    // Calculate available hours for current period (assuming 4 weeks per month)
    const WEEKS_PER_MONTH = 4;
    const totalAvailableHours = allWorkers.reduce((sum, worker) => {
      const weeklyHours = worker.weeklyHours || HOURS_PER_WEEK;
      return sum + (weeklyHours * WEEKS_PER_MONTH);
    }, 0);

    // ==================== 5. CALCULATE ALLOCATED HOURS ====================
    const totalAllocatedHours = workerAssignments.reduce((sum, assignment) => {
      return sum + (parseInt(assignment.hoursAssigned) || 0);
    }, 0);

    // ==================== 6. CALCULATE ACTIVE WORKERS ====================
    // Count distinct workers from assignments
    const activeWorkerSet = new Set();
    workerAssignments.forEach(assignment => {
      if (assignment.workerId) {
        activeWorkerSet.add(assignment.workerId);
      }
    });
    const activeWorkers = activeWorkerSet.size;

    // ==================== 7. CALCULATE UTILIZATION RATE ====================
    const utilizationRate = totalAvailableHours > 0
      ? ((totalAllocatedHours / totalAvailableHours) * 100)
      : 0;

    // ==================== 8. GET ACTUAL TIME SHEETS AND LEAVES DATA ====================
    // Match workers with users by email to get employee records
    const workerEmails = allWorkers.map(w => w.email);
    const matchingUsers = await User.findAll({
      where: { email: { [Op.in]: workerEmails } },
      attributes: ['id', 'email', 'name'],
    });

    // Create email to user ID map
    const emailToUserIdMap = new Map();
    matchingUsers.forEach(user => {
      emailToUserIdMap.set(user.email, user.id);
    });

    // Create worker email to worker map
    const workerEmailMap = new Map();
    allWorkers.forEach(worker => {
      workerEmailMap.set(worker.email, worker);
    });

    // Get date range for queries (if provided, use it; otherwise use current month)
    const now = new Date();
    const queryStartDate = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const queryEndDate = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all time sheets for matching employees in the date range
    const userIds = Array.from(emailToUserIdMap.values());
    const timeSheets = userIds.length > 0 ? await EmployeeTimeSheet.findAll({
      where: {
        employeeId: { [Op.in]: userIds },
        date: {
          [Op.between]: [queryStartDate, queryEndDate],
        },
        status: 'approved', // Only count approved time sheets
      },
      attributes: ['employeeId', 'date', 'startTime', 'endTime', 'breakTime', 'overWork'],
    }) : [];

    // Get all leaves for matching employees in the date range
    const activeLeaves = userIds.length > 0 ? await EmployeeLeave.findAll({
      where: {
        employeeId: { [Op.in]: userIds },
        status: 'approved',
        [Op.and]: [
          {
            startDate: { [Op.lte]: queryEndDate },
          },
          {
            endDate: { [Op.gte]: queryStartDate },
          },
        ],
      },
      attributes: ['employeeId', 'startDate', 'endDate', 'leaveType', 'status'],
    }) : [];

    // Helper function to convert TIME to hours (decimal)
    const timeToHours = (timeString) => {
      if (!timeString) return 0;
      const parts = timeString.split(':');
      if (parts.length < 2) return 0;
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      return hours + (minutes / 60);
    };

    // Helper function to calculate hours worked from startTime, endTime, breakTime
    const calculateHoursWorked = (startTime, endTime, breakTime) => {
      const start = timeToHours(startTime);
      const end = timeToHours(endTime);
      const breakHours = timeToHours(breakTime);
      return Math.max(0, end - start - breakHours);
    };

    // ==================== 9. CALCULATE ACTUAL OVERTIME AND WORKED HOURS ====================
    const workerStatsMap = new Map();
    let totalOvertimeHours = 0;

    // Initialize worker stats from assignments
    workerAssignments.forEach(assignment => {
      const workerId = assignment.workerId;
      const hoursAssigned = parseInt(assignment.hoursAssigned) || 0;
      const worker = assignment.worker;
      const weeklyHours = worker?.weeklyHours || HOURS_PER_WEEK;

      if (!workerStatsMap.has(workerId)) {
        workerStatsMap.set(workerId, {
          workerId,
          name: worker?.name || 'Unknown',
          jobTitle: worker?.jobTitle || 'Worker',
          email: worker?.email || '',
          weeklyHours,
          totalHours: 0,
          overtimeHours: 0,
          regularHours: 0,
          actualHoursWorked: 0,
          actualOvertimeHours: 0,
          isOnLeave: false,
          leaveDays: 0,
          assignments: [],
        });
      }

      const workerStats = workerStatsMap.get(workerId);
      workerStats.totalHours += hoursAssigned;
      workerStats.assignments.push({
        projectName: assignment.projectSetup?.projectSetup?.projectName || 'Unknown',
        hoursAssigned,
        role: assignment.role || 'Worker',
        jobStatus: assignment.projectSetup?.status || 'scheduled',
      });
    });

    // Add actual time sheet data
    timeSheets.forEach(timeSheet => {
      const userId = timeSheet.employeeId;
      // Find worker by matching user email
      const user = matchingUsers.find(u => u.id === userId);
      if (!user) return;

      const worker = workerEmailMap.get(user.email);
      if (!worker) return;

      const workerId = worker.id;
      if (!workerStatsMap.has(workerId)) {
        workerStatsMap.set(workerId, {
          workerId,
          name: worker.name,
          jobTitle: worker.jobTitle,
          email: worker.email,
          weeklyHours: worker.weeklyHours || HOURS_PER_WEEK,
          totalHours: 0,
          overtimeHours: 0,
          regularHours: 0,
          actualHoursWorked: 0,
          actualOvertimeHours: 0,
          isOnLeave: false,
          leaveDays: 0,
          assignments: [],
        });
      }

      const workerStats = workerStatsMap.get(workerId);
      const hoursWorked = calculateHoursWorked(timeSheet.startTime, timeSheet.endTime, timeSheet.breakTime);
      const overtime = timeToHours(timeSheet.overWork);

      workerStats.actualHoursWorked += hoursWorked;
      workerStats.actualOvertimeHours += overtime;
    });

    // Add leave data
    activeLeaves.forEach(leave => {
      const userId = leave.employeeId;
      const user = matchingUsers.find(u => u.id === userId);
      if (!user) return;

      const worker = workerEmailMap.get(user.email);
      if (!worker) return;

      const workerId = worker.id;
      if (workerStatsMap.has(workerId)) {
        const workerStats = workerStatsMap.get(workerId);
        workerStats.isOnLeave = true;
        
        // Calculate leave days
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        const days = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;
        workerStats.leaveDays += days;
      }
    });

    // Calculate total overtime from actual time sheets
    totalOvertimeHours = Array.from(workerStatsMap.values()).reduce((sum, stats) => {
      return sum + stats.actualOvertimeHours;
    }, 0);

    // ==================== 10. INDIVIDUAL WORKER STATS ====================
    const individualWorkerStats = Array.from(workerStatsMap.values()).map(stats => {
      // Use actual hours worked if available, otherwise use assigned hours
      const hoursUsed = stats.actualHoursWorked > 0 ? stats.actualHoursWorked : stats.totalHours;
      const utilization = stats.weeklyHours * WEEKS_PER_MONTH > 0
        ? ((hoursUsed / (stats.weeklyHours * WEEKS_PER_MONTH)) * 100)
        : 0;

      return {
        name: stats.name,
        role: stats.jobTitle,
        utilization: parseFloat(utilization.toFixed(2)),
        hours: Math.round(hoursUsed),
        overtime: Math.round(stats.actualOvertimeHours),
        regularHours: Math.round(hoursUsed - stats.actualOvertimeHours),
        isOnLeave: stats.isOnLeave,
        leaveDays: stats.leaveDays,
      };
    }).sort((a, b) => b.utilization - a.utilization);

    // ==================== 11. RESOURCE ALLOCATION BY PROJECT ====================
    const projectAllocationMap = new Map();

    workerAssignments.forEach(assignment => {
      const projectId = assignment.projectSetup?.projectSetupId;
      const projectName = assignment.projectSetup?.projectSetup?.projectName || 'Unknown';
      const hoursAssigned = parseInt(assignment.hoursAssigned) || 0;

      if (!projectAllocationMap.has(projectId)) {
        projectAllocationMap.set(projectId, {
          projectId,
          projectName,
          workers: new Set(),
          totalHours: 0,
        });
      }

      const projectStats = projectAllocationMap.get(projectId);
      projectStats.workers.add(assignment.workerId);
      projectStats.totalHours += hoursAssigned;
    });

    const resourceAllocationByProject = Array.from(projectAllocationMap.values()).map(stats => {
      const workers = stats.workers.size;
      const availableHours = workers * (HOURS_PER_WEEK * WEEKS_PER_MONTH);
      const utilization = availableHours > 0
        ? ((stats.totalHours / availableHours) * 100)
        : 0;

      return {
        project: stats.projectName,
        workers,
        hours: stats.totalHours,
        utilization: parseFloat(utilization.toFixed(2)),
      };
    }).sort((a, b) => b.utilization - a.utilization);

    return res.status(200).json({
      success: true,
      data: {
        totalWorkers,
        activeWorkers,
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
        overtimeHours: Math.round(totalOvertimeHours),
        availableHours: Math.round(totalAvailableHours),
        allocatedHours: totalAllocatedHours,
        workers: individualWorkerStats,
        resourceAllocationByProject,
      },
    });
  } catch (error) {
    console.error('Error fetching worker stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch worker stats',
      error: error.message,
    });
  }
};