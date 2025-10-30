import db from '../../models/index.js';
const { CabinetSubCategories, CabinetCategories } = db;
const { Op } = db.Sequelize;


export const createCabinetSubCategory = async (req, res) => {
    try {
        const { name, categoryId } = req.body;

        // Check if subcategory with same name and categoryId already exists
        const existingSubcategory = await CabinetSubCategories.findOne({
            where: { 
                name: name,
                categoryId: categoryId
            }
        });

        if (existingSubcategory) {
            return res.status(400).json({ 
                message: `Subcategory "${name}" already exists in this category` 
            });
        }

        const cabinetSubCategory = await CabinetSubCategories.create(req.body);
        res.status(201).json(cabinetSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const importCSV = async (req, res) => {
  console.log(req.body);
  try {
    let data = req.body.data;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    // Normalize input: trim, single-space, and Title-case as per model setter
    const formatName = (value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim().replace(/\s+/g, ' ');
      if (trimmed.length === 0) return trimmed;
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    };

    const normalized = data.map((item) => ({
      categoryId: Number(item.categoryId),
      name: formatName(item.name)
    }));

    // Deduplicate request by (categoryId, name)
    const uniqueData = [];
    const seen = new Set();
    for (const item of normalized) {
      const key = `${item.categoryId}-${item.name}`;
      if (!seen.has(key)) {
        uniqueData.push(item);
        seen.add(key);
      }
    }

    // Find all existing matching (categoryId, name)
    const existing = await CabinetSubCategories.findAll({
      attributes: ["id", "name", "categoryId"],
      where: {
        [Op.or]: uniqueData.map((i) => ({ name: i.name, categoryId: i.categoryId }))
      }
    });

    const existingKeys = new Set(
      existing.map((e) => `${Number(e.categoryId)}-${e.name}`)
    );

    // Only create those not existing
    const toCreate = uniqueData.filter(
      (i) => !existingKeys.has(`${i.categoryId}-${i.name}`)
    );

    // Create new subcategories, ignoring duplicates at DB level as a safety net
    if (toCreate.length > 0) {
      await CabinetSubCategories.bulkCreate(toCreate, {
        ignoreDuplicates: true,
        returning: true
      });
    }

    // Fetch all final records to return (covers both existing and newly created)
    const finalRecords = await CabinetSubCategories.findAll({
      attributes: ["id", "name", "categoryId"],
      where: {
        [Op.or]: uniqueData.map((i) => ({ name: i.name, categoryId: i.categoryId }))
      },
      order: [["categoryId", "ASC"], ["name", "ASC"]]
    });

    const insertedCount = Math.max(0, finalRecords.length - existing.length);

    const plainCombined = finalRecords.map((item) => ({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId
    }));

    // Respond with 201 in all success cases so client flow can continue
    return res.status(201).json({
      message:
        insertedCount === 0
          ? "Subcategories imported successfully; all already existed"
          : `Subcategories imported successfully, new records inserted: ${insertedCount}. skipped: ${uniqueData.length - insertedCount}`,
      insertedCount,
      cabinetSubCategory: plainCombined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getCabinetSubCategories = async (req, res) => {
    try {
        const cabinetSubCategories = await CabinetSubCategories.findAll({ where: { categoryId: req.params.id } });
        res.status(200).json(cabinetSubCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const updateCabinetSubCategory = async (req, res) => {
    try {
        const cabinetSubCategory = await CabinetSubCategories.update(req.body, { where: { id: req.params.id } });
        res.status(200).json(cabinetSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const deleteCabinetSubCategory = async (req, res) => {
    try {
        const cabinetSubCategory = await CabinetSubCategories.destroy({ where: { id: req.params.id } });
        res.status(200).json(cabinetSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
