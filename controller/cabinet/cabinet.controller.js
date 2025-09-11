import db from "../../models/index.js";
import { Sequelize } from "sequelize";
const { Cabinet, Audit, CabinetCategories, CabinetSubCategories } = db;

export const createCabinet = async (req, res) => {
  try {
    console.log(req.body);
    const cabinet = await Cabinet.create(req.body);
    await Audit.create({
      userId: req.body.userId,
      action: "create",
      tableName: "cabinet",
      newData: cabinet.get(),
    });
    res.status(201).json({
      message: "Cabinet created successfully",
      cabinet,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const insertCabinet = async (req, res) => {
  try {
    let cabinets = req.body.data;

    if (!Array.isArray(cabinets) || cabinets.length === 0) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    // remove duplicate cabinets from request (based on 'code')
    const uniqueCabinets = [];
    const requestCodes = new Set();
    for (const cabinet of cabinets) {
      if (!requestCodes.has(cabinet.code)) {
        uniqueCabinets.push(cabinet);
        requestCodes.add(cabinet.code);
      }
    }

    // fetch existing cabinet codes from DB
    const cabinetFromDB = await Cabinet.findAll({
      attributes: ["code"],
    });
    const existingCodes = new Set(cabinetFromDB.map((c) => c.code));

    // filter out cabinets that already exist in DB
    const newCabinets = uniqueCabinets.filter(
      (cabinet) => !existingCodes.has(cabinet.code)
    );

    // insert only new cabinets (if any)
    const createdCabinets =
      newCabinets.length > 0 ? await Cabinet.bulkCreate(newCabinets) : [];

    const duplicateCount = uniqueCabinets.length - newCabinets.length;

    res.status(201).json({
      message:
        newCabinets.length > 0
          ? `Cabinets processed: inserted ${createdCabinets.length}, removed ${duplicateCount} duplicates.`
          : `Cabinets processed: inserted 0, removed ${duplicateCount} duplicates (all existed).`,
      insertedCount: createdCabinets.length,
      duplicateCount,
      cabinets: createdCabinets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// export const getCabinet = async (req, res) => {
//   const { page = 1, limit = 10, search = "", subCode = "" } = req.query;
//   const offset = (page - 1) * limit;
//   const whereConditions = {};
//   const { id } = req.params;
//   whereConditions.cabinetCategoryId = id; // Filter by category ID

//   if (search && search.trim() !== "") {
//     whereConditions[db.Sequelize.Op.or] = [
//       { code: { [db.Sequelize.Op.iLike]: `%${search}%` } },

//       { description: { [db.Sequelize.Op.iLike]: `%${search}%` } },
//     ];
//   }

//   try {
//     const { count, rows: cabinets } = await Cabinet.findAndCountAll({
//       where: whereConditions,
//       offset,
//       limit,
//       include: [
//         {
//           model: CabinetCategories,
//           as: "cabinetCategory",
//         },
//         {
//           model: CabinetSubCategories,
//           as: "cabinetSubCategory",
//         },
//       ],
//       distinct: true, // ✅ makes sure count isn’t inflated
//     });

//     res.status(200).json({
//       message: "Cabinets fetched successfully",
//       cabinets, // ✅ array of cabinets
//       total: count, // ✅ correct count
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };


export const getCabinet = async (req, res) => {
  const { page = 1, limit = 10, search = "", subCode = "" } = req.query;
  const offset = (page - 1) * limit;
  const whereConditions = {};
  const { id } = req.params;
  whereConditions.cabinetCategoryId = id; // Filter by category ID

  // Add subcategory code filter if provided
  if (subCode && subCode.trim() !== "") {
    whereConditions['$cabinetSubCategory.name$'] = { 
      [db.Sequelize.Op.iLike]: `%${subCode}%` 
    };
  }

  if (search && search.trim() !== "") {
    whereConditions[db.Sequelize.Op.or] = [
      { code: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      { description: { [db.Sequelize.Op.iLike]: `%${search}%` } },
    ];
  }

  try {
    const { count, rows: cabinets } = await Cabinet.findAndCountAll({
      where: whereConditions,
      offset,
      limit,
      include: [
        {
          model: CabinetCategories,
          as: "cabinetCategory",
        },
        {
          model: CabinetSubCategories,
          as: "cabinetSubCategory",
        },
      ],
      distinct: true,
    });

    res.status(200).json({
      message: "Cabinets fetched successfully",
      cabinets,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateCabinet = async (req, res) => {
  try {
    const cabinet = await Cabinet.findByPk(req.params.id);
    if (!cabinet) {
      return res.status(404).json({ message: "Cabinet not found" });
    }
    await cabinet.update(req.body);
    await Audit.create({
      userId: req.body.userId,
      action: "update",
      tableName: "cabinet",
      oldData: cabinet.get(),
      newData: req.body,
    });
    res.status(200).json({ message: "Cabinet updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const deleteCabinet = async (req, res) => {
  try {
    const cabinet = await Cabinet.findByPk(req.params.id);
    if (!cabinet) {
      return res.status(404).json({ message: "Cabinet not found" });
    }
    await cabinet.destroy();
    await Audit.create({
      userId: req.body.userId,
      action: "delete",
      tableName: "cabinet",
      oldData: cabinet.get(),
    });
    res.status(200).json({ message: "Cabinet deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
