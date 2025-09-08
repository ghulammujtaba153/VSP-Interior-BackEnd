import db from '../../models/index.js';
const { CabinetSubCategories, CabinetCategories } = db;


export const createCabinetSubCategory = async (req, res) => {
    try {
        const cabinetSubCategory = await CabinetSubCategories.create(req.body);
        res.status(201).json(cabinetSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const importCSV = async (req, res) => {
  try {
    let data = req.body.data;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    // Deduplicate request by subcategory name
    const uniqueData = [];
    const seen = new Set();
    for (const item of data) {
      if (!seen.has(item.name)) {
        uniqueData.push(item);
        seen.add(item.name);
      }
    }

    const uniqueNames = uniqueData.map((i) => i.name);

    // Find existing subcategories by name
    const existingMatches = await CabinetSubCategories.findAll({
      attributes: ["id", "name", "categoryId"],
      where: { name: uniqueNames }
    });

    const existingNamesSet = new Set(existingMatches.map((e) => e.name));

    // Determine which need to be created
    const newData = uniqueData.filter((item) => !existingNamesSet.has(item.name));

    // Create new ones (if any) and return created rows
    const createdRecords = newData.length
      ? await CabinetSubCategories.bulkCreate(newData, { returning: true })
      : [];

    // Combine existing and newly created, so the client gets IDs for all requested names
    const combined = [...existingMatches, ...createdRecords];

    // Respond with 201 in all success cases so client flow can continue
    return res.status(201).json({
      message: newData.length === 0
        ? "No new subcategories inserted. Returning existing records."
        : "Subcategories imported successfully",
      insertedCount: createdRecords.length,
      cabinetSubCategory: combined,
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
