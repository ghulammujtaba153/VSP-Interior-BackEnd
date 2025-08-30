import db from '../../models/index.js';

const { CabinetCategories, CabinetSubCategories } = db;


export const createCabinetCategory = async (req, res) => {
    try {
        const cabinetCategory = await CabinetCategories.create(req.body);
        res.status(201).json(cabinetCategory);
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: error.message });
    }
};



export const getCabinetCategories = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereConditions = {};
    if (search && search.trim() !== '') {
        whereConditions[db.Sequelize.Op.or] = [
            { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        ];
    }

    try {
        const cabinetCategories = await CabinetCategories.findAll({
            include: [{
                model: CabinetSubCategories,
                as: 'subCategories',
            }],
            offset,
            limit,
            where: whereConditions
        });
        res.status(200).json(cabinetCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



export const updateCabinetCategory = async (req, res) => {
    try {
    const cabinetCategory = await CabinetCategories.update(req.body, { where: { id: req.params.id } });
  
      res.status(200).json({ message: "Category updated successfully", cabinetCategory });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  };
  
  


export const deleteCabinetCategory = async (req, res) => {
    try {
        const cabinetCategory = await CabinetCategories.destroy({ where: { id: req.params.id } });
        res.status(200).json(cabinetCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
