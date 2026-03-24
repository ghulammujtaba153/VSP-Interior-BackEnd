import db from '../../models/index.js';
import { Op } from "sequelize";

const { PriceBook, Suppliers } = db;



export const createPriceBook = async (req, res) => {
  try {
    const { name, version, supplierId } = req.body;

    // Validate required fields
    if (!supplierId) {
      return res.status(400).json({ error: "supplierId is required" });
    }

    // Verify supplier exists
    const supplier = await Suppliers.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const targetVersion = version || "v1";

    // Check for duplicate
    const existingItem = await PriceBook.findOne({
      where: {
        name,
        version: targetVersion,
      },
    });

    if (existingItem) {
      return res.status(400).json({
        error: `Item "${name}" already exists in version ${targetVersion}`,
      });
    }

    // ✅ Close previous versions
    if (version) {
      const now = new Date();
      await PriceBook.update(
        { versionEndDate: now, status: "inactive" },
        {
          where: {
            name,
            version: { [Op.ne]: version }, // mark all previous versions as ended
          },
        }
      );
    }

    // Create new version with supplierId
    const priceBook = await PriceBook.create({
      ...req.body,
      supplierId,
      version: targetVersion,
    });

    res.status(201).json(priceBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const importPriceBook = async (req, res) => {
    try {
        const { userId, supplierId, items, version } = req.body;
        if (!Array.isArray(items) || items.length === 0 || !supplierId) {
            return res.status(400).json({ message: 'Invalid data format. supplierId and items array are required.' });
        }

        const targetVersion = version || 'v1';

        // Verify supplier exists
        const supplier = await Suppliers.findByPk(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // 2) Deduplicate items by name within the request
        const uniqueItems = [];
        const seenNames = new Set();
        for (const item of items) {
            const name = (item.name || '').trim();
            if (name && !seenNames.has(name)) {
                uniqueItems.push(item);
                seenNames.add(name);
            }
        }

        // 3) Fetch existing price book item names for these categories and version
        const existingItems = await PriceBook.findAll({
            where: { version: targetVersion },
            attributes: ['name', 'version']
        });
        const existsKey = new Set(existingItems.map(i => `${i.name}::${i.version}`));

        const rowsToInsert = uniqueItems
            .map(i => ({
                supplierId, // Add supplierId to each pricebook item
                name: i.name,
                variant: i.variant || i.description || null,
                dynamic: i.dynamic || i.unit || false,
                status: i.status === 'inactive' ? 'inactive' : 'active',
                version: targetVersion
            }))
            .filter(r => !existsKey.has(`${r.name}::${r.version}`));

        const created = rowsToInsert.length > 0
            ? await PriceBook.bulkCreate(rowsToInsert, { returning: true })
            : [];

        return res.status(201).json({
            message: `PriceBook processed: inserted ${created.length} items in ${targetVersion}, skipped ${uniqueItems.length - created.length} duplicate(s).`,
            insertedCount: created.length,
            duplicateCount: uniqueItems.length - created.length,
            version: targetVersion,
            items: created
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}




export const getPriceBook = async (req, res) => {
    try {
        const whereClause = {};
        if (req.params.id) {
            // Check if it's a numeric ID (could be supplierId or categoryId legacy)
            // Given the new context, we can treat it as a filter by supplier if needed
            // But for now, let's treat it as "fetch all" if no specific identifier is standard
            whereClause.supplierId = req.params.id;
        }

        const priceBook = await PriceBook.findAll({
            where: whereClause,
            include: [
                {
                    model: Suppliers,
                    attributes: ["id", "name", "email", "phone"],
                }
            ]
        });
        res.status(200).json(priceBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updatePriceBook = async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, version, supplierId } = req.body;

        // Validate supplier exists if supplierId is provided
        if (supplierId) {
            const supplier = await Suppliers.findByPk(supplierId);
            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
        }

        if (name || version) {
            // Get current item
            const currentItem = await PriceBook.findByPk(itemId);
            
            if (!currentItem) {
                return res.status(404).json({ error: 'Item not found' });
            }

            // Build where clause for duplicate check
            const checkName = name || currentItem.name;
            const checkVersion = version || currentItem.version;


            // Check if another item exists with same name + version
            const existingItem = await PriceBook.findOne({
                where: {
                    name: checkName,
                    version: checkVersion
                }
            });



            // If exists and it's not the current item being updated
            if (existingItem && existingItem.id !== parseInt(itemId)) {
                return res.status(400).json({ 
                    error: `Item "${checkName}" already exists in version ${checkVersion}` 
                });
            }
        }

        

        const priceBook = await PriceBook.update(req.body, {
            where: { id: itemId }
        });
        res.status(200).json(priceBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const getPriceBookHistory = async (req, res) => {
  const { name } = req.query;
  console.log('Fetching history for:', name);

  try {
    const whereClause = {};

    if (name) whereClause.name = name;

    const priceBooks = await PriceBook.findAll({
      where: whereClause,
      order: [['version', 'DESC']],
    });

    res.status(200).json(priceBooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





export const deletePriceBook = async (req, res) => {
    try {
        const itemId = req.params.id;

        // Get the item being deleted
        const itemToDelete = await PriceBook.findByPk(itemId);
        if (!itemToDelete) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const { name, version } = itemToDelete;

        // Find all other versions of this item (same name, different version)
        const allVersions = await PriceBook.findAll({
            where: {
                name,
                id: { [Op.ne]: itemId } // Exclude current item
            },
            attributes: ['id', 'version', 'status'],
            order: [['version', 'DESC']]
        });

        // Find the previous version (highest version before the deleted one)
        if (allVersions.length > 0) {
            // Get the version number of the item being deleted
            const deletedVersionNum = parseInt(version.replace('v', '')) || 0;
            
            // Find previous version (highest version number less than deleted)
            const previousVersion = allVersions.find(v => {
                const vNum = parseInt(v.version.replace('v', '')) || 0;
                return vNum < deletedVersionNum;
            });

            // If previous version exists, set it to active
            if (previousVersion) {
                await PriceBook.update(
                    { status: 'active', versionEndDate: null },
                    { where: { id: previousVersion.id } }
                );
            }
        }

        // Delete the current item
        await PriceBook.destroy({
            where: { id: itemId }
        });

        res.status(200).json({ message: 'Item deleted successfully and previous version activated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}