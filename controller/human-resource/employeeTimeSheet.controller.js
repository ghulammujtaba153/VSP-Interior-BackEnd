import db from '../../models/index.js';
import { Sequelize, Op } from "sequelize";
const {EmployeeTimeSheet, Audit, User} = db;

export const createEmployeeTimeSheet = async (req, res) => {
    try {
        const employeeTimeSheet = await EmployeeTimeSheet.create(req.body);
        res.status(200).send(employeeTimeSheet);
    } catch (error) {
        res.status(500).send(error);
    }
}


export const getEmployeeTimeSheet = async (req, res) => {
  try {
    let { page = 1, limit = 10, Search, startDate, endDate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    const whereConditions = {};

    if (Search && Search.trim() !== "") {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${Search}%` } },
        { email: { [Op.iLike]: `%${Search}%` } },
        { phone: { [Op.iLike]: `%${Search}%` } },
      ];
    }

    if (startDate && startDate.trim() !== "") {
      whereConditions.date = { [Op.gte]: startDate };
    }
    if (endDate && endDate.trim() !== "") {
      whereConditions.date = {
        ...(whereConditions.date || {}),
        [Op.lte]: endDate,
      };
    }

    const employeeTimeSheet = await EmployeeTimeSheet.findAndCountAll({
      where: whereConditions,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "employee",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.status(200).json({
      total: employeeTimeSheet.count,
      page,
      limit,
      data: employeeTimeSheet.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};


export const getEmployeeTimeSheetById = async (req, res) => {
    try {
        const employeeTimeSheet = await EmployeeTimeSheet.findByPk(req.params.id, {
            include: [
                {
                model: User,
                as: "employee",
                attributes: ["id", "name", "email"], 
                },
            ],
        });
        res.status(200).send(employeeTimeSheet);
    } catch (error) {
        res.status(500).send(error);
    }
}


export const employeeTimeSheetByEmployeeId = async (req, res) => {
    const {id} = req.params;
    try {
        const employeeTimeSheet = await EmployeeTimeSheet.findAll({
            where: { employeeId: id },
            
        });
        res.status(200).send(employeeTimeSheet);
    } catch (error) {
        res.status(500).send(error);
    }
}



export const updateEmployeeTimeSheet = async (req, res) => {
    try {
        const employeeTimeSheet = await EmployeeTimeSheet.update(req.body, {
            where: { id: req.params.id },
        });
        res.status(200).send(employeeTimeSheet);
    } catch (error) {
        res.status(500).send(error);
    }
}



export const deleteEmployeeTimeSheet = async (req, res) => {
    try {
        const employeeTimeSheet = await EmployeeTimeSheet.destroy({
            where: { id: req.params.id}
        })
        res.status(200).send(employeeTimeSheet);
    } catch (error) {
        res.status(500).send(error);
    }
}