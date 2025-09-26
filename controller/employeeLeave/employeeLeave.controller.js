import db from '../../models/index.js';
import { Sequelize, Op } from "sequelize";
const {EmployeeLeave, Audit, User} = db;

export const createEmployeeLeave = async (req, res) => {
    try {
        const employeeLeave = await EmployeeLeave.create(req.body);
        console.log(employeeLeave);
        await Audit.create({ userId: req.body.employeeId, action: 'create', tableName: 'employee_leaves', newData: employeeLeave.get() });
        res.status(201).json({
            message: "Employee leave created successfully",
            employeeLeave
        });
    } catch (error) {
        res.status(500).json({              
            message: "Error creating employee leave",
            error: error.message
        });
    }
}


export const getEmployeeLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    if (search) {
      whereClause = {
        [Op.or]: [
            
            { "$employee.name$": { [Op.like]: `%${search}%` } },
          { leaveType: { [Op.like]: `%${search}%` } },
          { status: { [Op.like]: `%${search}%` } },
          { reason: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    // Main paginated fetch
    const { count, rows } = await EmployeeLeave.findAndCountAll({
      include: [
        {
          model: User,
          as: "employee",
          attributes: ["id", "name", "email"], // only what you need
        },
      ],
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [["createdAt", "DESC"]],
    });

    // Employees on leave today
    const today = new Date().toISOString().split("T")[0];
    const leavesToday = await EmployeeLeave.findAll({
      where: {
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
        status: "approved",
      },
      include: [
        {
          model: User,
          as: "employee",
          attributes: ["id", "name", "email"],
        },
      ],
    });


    const totalUsers = await User.count();

    // Deduplicate employees
    const uniqueEmployeesOnLeaveToday = [
      ...new Map(
        leavesToday.map((leave) => [leave.employeeId, leave.employee])
      ).values(),
    ];

    res.status(200).json({
      message: "Employee leaves fetched successfully",
      employeeLeaves: rows,
      total: count,
      availableStaff: totalUsers-uniqueEmployeesOnLeaveToday.length,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      totalEmployeesOnLeaveToday: uniqueEmployeesOnLeaveToday.length,
      employeesOnLeaveToday: uniqueEmployeesOnLeaveToday,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching employee leaves",
      error: error.message,
    });
  }
};



export const getEmployeeLeaveByEmployeeId = async (req, res) => {
    try {
        const employeeLeave = await EmployeeLeave.findAll({ where: { employeeId: req.params.id } });
        res.status(200).json({
            message: "Employee leaves fetched successfully",
            employeeLeave
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching employee leaves",
            error: error.message
        });
    }
}



export const updateEmployeeLeave = async (req, res) => {
    try{
        const employeeLeave = await EmployeeLeave.findByPk(req.params.id);

        if (!employeeLeave) {
            return res.status(404).json({
                message: "Employee leave not found",
            });
        }

        await employeeLeave.update(req.body);
        await Audit.create({ userId: req.body.employeeId, action: 'update', tableName: 'employee_leaves', oldData: employeeLeave.get(), newData: req.body });
        res.status(200).json({
            message: "Employee leave updated successfully",
            employeeLeave
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating employee leave",
            error: error.message
        });
    }
}


export const deleteEmployeeLeave = async (req, res) => {
    try{
        const employeeLeave = await EmployeeLeave.findByPk(req.body.id);

        if (!employeeLeave) {
            return res.status(404).json({
                message: "Employee leave not found",
            });
        }

        await employeeLeave.destroy();
        await Audit.create({ userId: req.body.userId, action: 'delete', tableName: 'employee_leaves', oldData: employeeLeave.get() });
        res.status(200).json({
            message: "Employee leave deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting employee leave",
            error: error.message
        });
    }
}

