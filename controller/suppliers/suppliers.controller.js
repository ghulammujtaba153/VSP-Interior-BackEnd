import db from '../../models/index.js';
import { Op, fn, col } from 'sequelize';
const { Suppliers, SupplierContacts, Audit, ProjectPurchase } = db;


export const createSupplier = async (req, res) => {

    try {
        console.log(req.body);
        const supplier = await Suppliers.create(req.body);
        await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'suppliers', newData: supplier.get() });
        res.status(201).json({
            message: "Supplier created successfully",
            data: supplier
        }); 
    } catch (error) {
        res.status(500).json({
            message: "Error creating supplier",
            error: error.message
        });
    }
}


export const importCSV = async (req, res) => {
    const { userId, suppliers } = req.body;

    try {
        // Get existing suppliers from DB
        const existingSuppliers = await Suppliers.findAll({ attributes: ["id", "name", "email"] });
        const existingNames = new Set(existingSuppliers.map(e => e.name));
        const existingEmails = new Set(existingSuppliers.map(e => e.email));

        // Filter out duplicates based on name or email
        const uniqueSuppliers = suppliers.filter(supplier => 
            !existingNames.has(supplier.name) && 
            !existingEmails.has(supplier.email)
        );

        let insertedSuppliers = [];
        let totalContactsInserted = 0;
        
        if (uniqueSuppliers.length > 0) {
            // Insert suppliers first
            insertedSuppliers = await Suppliers.bulkCreate(
                uniqueSuppliers.map(row => {
                    const { contacts, ...supplierData } = row;
                    return supplierData;
                })
            );

            // Now insert contacts for each supplier
            for (let i = 0; i < insertedSuppliers.length; i++) {
                const supplier = insertedSuppliers[i];
                const supplierData = uniqueSuppliers[i];
                
                if (supplierData.contacts && Array.isArray(supplierData.contacts) && supplierData.contacts.length > 0) {
                    // Add supplierId to each contact
                    const contactsWithSupplierId = supplierData.contacts.map(contact => ({
                        ...contact,
                        supplierId: supplier.id
                    }));
                    
                    // Insert contacts for this supplier
                    const insertedContacts = await SupplierContacts.bulkCreate(contactsWithSupplierId);
                    totalContactsInserted += insertedContacts.length;
                }
            }

            // Audit log only when new suppliers are added
            await Audit.create({ 
                userId, 
                action: 'import', 
                tableName: 'suppliers', 
                newData: {
                    suppliers: insertedSuppliers,
                    contactsCount: totalContactsInserted
                }
            });
        }

        res.status(201).json({
            message: `Successfully imported ${insertedSuppliers.length} suppliers with ${totalContactsInserted} contacts. Skipped ${suppliers.length - insertedSuppliers.length} duplicates.`,
            inserted: insertedSuppliers.length,
            contactsInserted: totalContactsInserted,
            skipped: suppliers.length - insertedSuppliers.length,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const getSuppliers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        // Build search conditions
        const whereConditions = {};
        if (search && search.trim() !== '') {
            whereConditions[db.Sequelize.Op.or] = [
                { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { phone: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { address: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { postCode: { [db.Sequelize.Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: suppliers } = await Suppliers.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: SupplierContacts,
                    as: 'contacts'
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: "Suppliers fetched successfully",
            data: suppliers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit),
                searchTerm: search
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching suppliers",
            error: error.message
        });
    }
}

export const getSupplierById = async (req, res) => {
    try {
        const supplier = await Suppliers.findByPk(req.params.id);
        res.status(200).json({
            message: "Supplier fetched successfully",
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching supplier",
            error: error.message
        });
    }
}


export const updateSupplier = async (req, res) => {
    try {
        // Find the existing supplier first
        const supplier = await Suppliers.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        const oldData = supplier.get(); // save old data

        // Update supplier
        await supplier.update(req.body);

        // Create audit log
        await Audit.create({
            userId: req.body.userId,
            action: 'update',
            tableName: 'suppliers',
            oldData,
            newData: req.body
        });

        res.status(200).json({
            message: "Supplier updated successfully",
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating supplier",
            error: error.message
        });
    }
};



export const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Suppliers.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        const oldData = supplier.get(); // save old data

        await supplier.destroy();

        await Audit.create({
            userId: req.body?.userId || null, 
            action: 'delete',
            tableName: 'suppliers',
            oldData
        });

        res.status(200).json({
            message: "Supplier deleted successfully",
            data: oldData
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting supplier",
            error: error.message
        });
    }
};



export const getSupplierPerformanceReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    // Build date filter if provided
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    // ==================== 1. GET ALL SUPPLIERS ====================
    const allSuppliers = await Suppliers.findAll({
      where: {
        status: 'active',
        ...dateFilter,
      },
      attributes: ['id', 'name', 'email', 'phone', 'status'],
    });

    // ==================== 2. GET ALL PURCHASES WITH SUPPLIER DATA ====================
    const supplierIds = allSuppliers.map(s => s.id);
    const allPurchases = supplierIds.length > 0 ? await ProjectPurchase.findAll({
      where: {
        supplierId: { [Op.in]: supplierIds },
        ...dateFilter,
      },
      include: [
        {
          model: Suppliers,
          as: 'suppliers',
          attributes: ['id', 'name', 'email'],
          required: true,
        },
      ],
      attributes: [
        'id',
        'supplierId',
        'status',
        'deliveryStatus',
        'expectedDelivery',
        'totalAmount',
        'createdAt',
        'updatedAt',
      ],
    }) : [];

    // ==================== 3. CALCULATE SUPPLIER STATS ====================
    const supplierStatsMap = new Map();

    allPurchases.forEach(purchase => {
      const supplierId = purchase.supplierId;
      
      if (!supplierStatsMap.has(supplierId)) {
        supplierStatsMap.set(supplierId, {
          supplierId,
          supplierName: purchase.suppliers?.name || 'Unknown',
          totalOrders: 0,
          deliveredOrders: 0,
          onTimeDeliveries: 0,
          earlyDeliveries: 0,
          lateDeliveries: 0,
          totalSpent: 0,
          lastDelivery: null,
        });
      }

      const stats = supplierStatsMap.get(supplierId);
      stats.totalOrders++;

      if (purchase.status === 'delivered') {
        stats.deliveredOrders++;
        if (purchase.deliveryStatus === 'on-time') {
          stats.onTimeDeliveries++;
        } else if (purchase.deliveryStatus === 'early') {
          stats.earlyDeliveries++;
        } else if (purchase.deliveryStatus === 'late') {
          stats.lateDeliveries++;
        }

        // Track last delivery date
        const deliveryDate = purchase.updatedAt || purchase.createdAt;
        if (!stats.lastDelivery || deliveryDate > stats.lastDelivery) {
          stats.lastDelivery = deliveryDate;
        }
      }

      // Calculate total spent from totalAmount field
      stats.totalSpent += parseFloat(purchase.totalAmount || 0);
    });

    // ==================== 4. CALCULATE SUPPLIER COUNTS (only those with purchases) ====================
    const suppliersWithPurchases = Array.from(supplierStatsMap.keys());
    const totalSuppliers = suppliersWithPurchases.length;
    const activeSuppliers = suppliersWithPurchases.length;

    // ==================== 5. CALCULATE OVERALL METRICS ====================
    let totalOnTimeDeliveries = 0;
    let totalDeliveredOrders = 0;

    supplierStatsMap.forEach(stats => {
      totalDeliveredOrders += stats.deliveredOrders;
      totalOnTimeDeliveries += stats.onTimeDeliveries;
    });

    const onTimeDelivery = totalDeliveredOrders > 0
      ? ((totalOnTimeDeliveries / totalDeliveredOrders) * 100)
      : 0;

    // ==================== 6. CALCULATE TOP PERFORMERS ====================
    // Suppliers with on-time delivery rate >= 80%
    const topPerformers = Array.from(supplierStatsMap.values()).filter(stats => {
      const onTimeRate = stats.deliveredOrders > 0
        ? ((stats.onTimeDeliveries / stats.deliveredOrders) * 100)
        : 0;
      return onTimeRate >= 80;
    }).length;

    // ==================== 7. SUPPLIER PERFORMANCE BREAKDOWN ====================
    // Only show suppliers that have purchases (already in supplierStatsMap)
    const suppliers = Array.from(supplierStatsMap.values()).map(stats => {
      const onTimeRate = stats.deliveredOrders > 0
        ? ((stats.onTimeDeliveries / stats.deliveredOrders) * 100)
        : 0;

      // Determine reliability based on on-time delivery rate
      let reliability = 'Fair';
      if (stats.deliveredOrders === 0) {
        reliability = 'No Data';
      } else if (onTimeRate >= 90) {
        reliability = 'Excellent';
      } else if (onTimeRate >= 75) {
        reliability = 'Good';
      } else if (onTimeRate >= 50) {
        reliability = 'Fair';
      } else {
        reliability = 'Poor';
      }

      // Calculate days since last delivery
      let lastDeliveryText = 'No deliveries yet';
      if (stats.lastDelivery) {
        const daysDiff = Math.floor((new Date() - new Date(stats.lastDelivery)) / (1000 * 60 * 60 * 24));
        if (daysDiff === 0) {
          lastDeliveryText = 'Today';
        } else if (daysDiff === 1) {
          lastDeliveryText = '1 day ago';
        } else if (daysDiff < 7) {
          lastDeliveryText = `${daysDiff} days ago`;
        } else if (daysDiff < 30) {
          const weeks = Math.floor(daysDiff / 7);
          lastDeliveryText = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
          const months = Math.floor(daysDiff / 30);
          lastDeliveryText = `${months} month${months > 1 ? 's' : ''} ago`;
        }
      }

      return {
        name: stats.supplierName,
        onTimeDelivery: parseFloat(onTimeRate.toFixed(2)),
        orders: stats.totalOrders,
        totalSpent: parseFloat(stats.totalSpent.toFixed(2)),
        lastDelivery: lastDeliveryText,
        reliability,
        deliveredOrders: stats.deliveredOrders,
        earlyDeliveries: stats.earlyDeliveries,
        lateDeliveries: stats.lateDeliveries,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    return res.status(200).json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        onTimeDelivery: parseFloat(onTimeDelivery.toFixed(2)),
        topPerformers,
        suppliers,
      },
    });
  } catch (error) {
    console.error('Error fetching supplier performance report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier performance report',
      error: error.message,
    });
  }
};

