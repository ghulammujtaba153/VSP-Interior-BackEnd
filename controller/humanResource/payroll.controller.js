import db from "../../models/index.js";
const { Payroll, User, Role } = db;

export const getAllPayroll = async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const where = {};
    if (month) where.month = month;
    if (year) where.year = year;
    if (userId) where.userId = userId;

    const payrolls = await Payroll.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "salary"],
          include: [{ model: Role, attributes: ["name"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(payrolls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPayroll = async (req, res) => {
  try {
    const {
      userId,
      month,
      year,
      baseSalary,
      overtimeSalary,
      bonus,
      deduction,
      notes,
    } = req.body;

    // Check if record already exists for this user/month/year
    const existing = await Payroll.findOne({ where: { userId, month, year } });
    if (existing) {
      return res.status(400).json({ error: "Payroll record for this month already exists" });
    }

    const netSalary = Number(baseSalary) + Number(overtimeSalary || 0) + Number(bonus || 0) - Number(deduction || 0);

    const payroll = await Payroll.create({
      userId,
      month,
      year,
      baseSalary,
      overtimeSalary,
      bonus,
      deduction,
      netSalary,
      notes,
      status: "pending",
    });

    res.status(201).json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      baseSalary,
      overtimeSalary,
      bonus,
      deduction,
      status,
      paymentDate,
      paymentMethod,
      notes,
    } = req.body;

    const payroll = await Payroll.findByPk(id);
    if (!payroll) return res.status(404).json({ error: "Payroll record not found" });

    if (baseSalary !== undefined) payroll.baseSalary = baseSalary;
    if (overtimeSalary !== undefined) payroll.overtimeSalary = overtimeSalary;
    if (bonus !== undefined) payroll.bonus = bonus;
    if (deduction !== undefined) payroll.deduction = deduction;
    
    // Recalculate net salary
    payroll.netSalary = Number(payroll.baseSalary) + Number(payroll.overtimeSalary) + Number(payroll.bonus) - Number(payroll.deduction);

    if (status) payroll.status = status;
    if (paymentDate) payroll.paymentDate = paymentDate;
    if (paymentMethod) payroll.paymentMethod = paymentMethod;
    if (notes) payroll.notes = notes;

    await payroll.save();
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    await Payroll.destroy({ where: { id } });
    res.status(200).json({ message: "Payroll deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
