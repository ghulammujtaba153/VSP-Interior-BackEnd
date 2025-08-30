import db from '../../models/index.js';
const { CabinetQuote, CabinetMaterial, CabinetCategories, CabinetSubCategories, Cabinet } = db;

/**
 * CREATE Cabinet Quote
 */
export const createCabinetQuote = async (req, res) => {
  const { title, description, cabinetIds } = req.body;

  try {
    const cabinetQuote = await CabinetQuote.create({ title, description });

    // Bulk insert related CabinetMaterials
    const cabinetMaterials = await CabinetMaterial.bulkCreate(
      cabinetIds.map((cabinetId) => ({
        cabinetQuoteId: cabinetQuote.id,
        cabinetId,
      }))
    );

    res.status(201).json({
      message: 'Cabinet quote created successfully',
      cabinetQuote,
      cabinetMaterials,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * GET ALL Cabinet Quotes
 */
export const getCabinetQuotes = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClause = {};
    if (search) {
      whereClause = {
        [db.Sequelize.Op.or]: [
          { title: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          { description: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const { count, rows: cabinetQuotes } = await CabinetQuote.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: CabinetMaterial,
          as: 'cabinetMaterials',
          include: [
            { 
              model: Cabinet, 
              as: 'cabinet',
              include: [
                { model: db.CabinetCategories, as: 'cabinetCategory' },
                { model: db.CabinetSubCategories, as: 'cabinetSubCategory' }
              ]
            }
          ],
        },
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      data: cabinetQuotes,
      pagination: {
        totalItems: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * UPDATE Cabinet Quote
 */
export const updateCabinetQuote = async (req, res) => {
  const { id } = req.params;
  const { title, description, cabinetIds } = req.body;

  try {
    const cabinetQuote = await CabinetQuote.findByPk(id, {
      include: [{ model: CabinetMaterial, as: 'cabinetMaterials' }],
    });

    if (!cabinetQuote) {
      return res.status(404).json({ message: 'Cabinet quote not found' });
    }

    // Update quote details
    await cabinetQuote.update({ title, description });

    // Get existing cabinetIds
    const existingIds = cabinetQuote.cabinetMaterials.map((cm) => cm.cabinetId);

    // Find IDs to add and remove
    const toAdd = cabinetIds.filter((id) => !existingIds.includes(id));
    const toRemove = existingIds.filter((id) => !cabinetIds.includes(id));

    // Remove old ones
    if (toRemove.length > 0) {
      await CabinetMaterial.destroy({
        where: {
          cabinetQuoteId: cabinetQuote.id,
          cabinetId: toRemove,
        },
      });
    }

    // Add new ones
    if (toAdd.length > 0) {
      await CabinetMaterial.bulkCreate(
        toAdd.map((cabinetId) => ({
          cabinetQuoteId: cabinetQuote.id,
          cabinetId,
        }))
      );
    }

    res.status(200).json({
      message: 'Cabinet quote updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * DELETE Cabinet Quote
 */
export const deleteCabinetQuote = async (req, res) => {
  const { id } = req.params;

  try {
    const cabinetQuote = await CabinetQuote.findByPk(id);

    if (!cabinetQuote) {
      return res.status(404).json({ message: 'Cabinet quote not found' });
    }

    // Delete related materials first
    await CabinetMaterial.destroy({ where: { cabinetQuoteId: id } });

    // Delete the quote itself
    await cabinetQuote.destroy();

    res.status(200).json({
      message: 'Cabinet quote deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};
