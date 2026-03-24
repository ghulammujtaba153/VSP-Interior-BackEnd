import db from "../../models/index.js";
const { InventoryCategory } = db;

export const createInventoryCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const category = await InventoryCategory.create({ name, status });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllInventoryCategories = async (req, res) => {
  try {
    const categories = await InventoryCategory.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getInventoryCategoryById = async (req, res) => {
  try {
    const category = await InventoryCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateInventoryCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    const category = await InventoryCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    await category.update({ name, status });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteInventoryCategory = async (req, res) => {
  try {
    const category = await InventoryCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    await category.destroy();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
