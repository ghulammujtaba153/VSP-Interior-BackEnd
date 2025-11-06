import db from "../../models/index.js";
import { Op, fn, col, literal, Sequelize } from "sequelize";

const { 
  ProjectSetup, 
  ProjectRate, 
  ProjectMaterial, 
  Clients, 
  ProjectAmend, 
  Suppliers, 
  ProjectCostSheet, 
  ProjectSetupJob,
  ProjectSetupJobWorker,
  ProjectKanban,
  Worker,
  ProjectPurchase,
  PurchaseLineItem,
  Inventory,
  User,
  EmployeeTimeSheet,
  EmployeeLeave
} = db;

// Helper function to convert empty strings to null for integer fields
const sanitizeData = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert empty strings to null for fields that might be integers
      if (value === "" && (key.toLowerCase().includes('id') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('rate'))) {
        sanitized[key] = null;
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
};

// Helper function to check if an object has any non-empty values
const hasValidData = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  return Object.values(obj).some(value => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'object' && !Array.isArray(value)) return hasValidData(value);
    return true;
  });
};

export const createProjectSetup = async (req, res) => {
  const t = await db.sequelize.transaction(); // Start transaction
  try {
    const { project, rates = [], materials = [], costingSheet = {} } = req.body;

    // Sanitize project data - handle labourCost, totalCost, totalSell, totalProfit conversion
    const sanitizedProject = {
      ...project,
      labourCost: project.labourCost !== undefined && project.labourCost !== null && project.labourCost !== '' 
        ? parseFloat(project.labourCost) || 0 
        : 0,
      totalCost: project.totalCost !== undefined && project.totalCost !== null && project.totalCost !== '' 
        ? parseFloat(project.totalCost) || 0 
        : 0,
      totalSell: project.totalSell !== undefined && project.totalSell !== null && project.totalSell !== '' 
        ? parseFloat(project.totalSell) || 0 
        : 0,
      totalProfit: project.totalProfit !== undefined && project.totalProfit !== null && project.totalProfit !== '' 
        ? parseFloat(project.totalProfit) || 0 
        : 0,
    };

    // 1. Create ProjectSetup
    const newProject = await ProjectSetup.create(sanitizedProject, { transaction: t });

    const projectId = newProject.id;

    // 2. Create ProjectRates (sanitize data and filter empty records)
    if (rates.length > 0) {
      const validRates = sanitizeData(rates).filter(rate => hasValidData(rate));
      if (validRates.length > 0) {
        const ratesData = validRates.map((rate) => ({ ...rate, projectId }));
        await ProjectRate.bulkCreate(ratesData, { transaction: t });
      }
    }

    // 3. Create ProjectMaterials (sanitize data and filter empty records)
    if (materials.length > 0) {
      const validMaterials = sanitizeData(materials).filter(mat => hasValidData(mat));
      if (validMaterials.length > 0) {
        const materialsData = validMaterials.map((mat) => ({ ...mat, projectId }));
        await ProjectMaterial.bulkCreate(materialsData, { transaction: t });
      }
    }

    // 4. Create ProjectCostSheet (sanitize data)
    if (costingSheet && Object.keys(costingSheet).length > 0) {
      const sanitizedCostingSheet = sanitizeData(costingSheet);
      await ProjectCostSheet.create(
        { ...sanitizedCostingSheet, projectId },
        { transaction: t }
      );
    }

    // Commit transaction
    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Project setup created successfully",
      data: {
        project: newProject,
        rates,
        materials,
        costingSheet,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create project setup",
      error: error.message,
    });
  }
};

export const getAllProjectSetups = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  const whereConditions = {};
  if (search.trim() !== "") {
    whereConditions[db.Sequelize.Op.or] = [
      { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      { description: { [db.Sequelize.Op.iLike]: `%${search}%` } },
    ];
  }

  try {
    const { count, rows } = await ProjectSetup.findAndCountAll({
      include: [
        { model: Clients, as: "client" },
        { model: ProjectRate, as: "rates" },
        { model: ProjectMaterial, as: "materials" },
        { model: ProjectCostSheet, as: "costingSheet" },
      ],
      where: whereConditions,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalRecords: rows.length, // only current page count
        currentPage: parseInt(page),
        totalPages: Math.ceil(rows.length / limit), // based only on current page size
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project setups",
      error: error.message,
    });
  }
};

export const getProjectSetupById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await ProjectSetup.findByPk(id, {
      include: [
        { model: Clients, as: "client" },
        { model: ProjectRate, as: "rates" },
        { model: ProjectMaterial, as: "materials" },
        { model: ProjectCostSheet, as: "costingSheet" },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project setup not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: project, // ✅ this is the project object
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project setup",
      error: error.message,
    });
  }
};




// export const updateProjectSetup = async (req, res) => {
//   const t = await db.sequelize.transaction();
//   try {
//     const { id } = req.params;
//     const { project, rates = [], materials = [], amend } = req.body;

//     const existingProject = await ProjectSetup.findByPk(id, {
//       include: [
//         { model: Clients, as: 'client' },
//     { model: ProjectRate, as: 'rates' },
//     { model: ProjectMaterial, as: 'materials', include: [{ model: Suppliers, as: 'supplier' }] },
//   ],
//     });

//     if (!existingProject) {
//       return res.status(404).json({
//         success: false,
//         message: "Project setup not found",
//       });
//     }

//     // Create snapshot of previous data
//     const previousData = {
//       project: existingProject.toJSON(),
//       rates: await ProjectRate.findAll({ where: { projectId: id }, raw: true }),
//       materials: await ProjectMaterial.findAll({ where: { projectId: id }, include: [{ model: Suppliers, as: 'supplier' }], raw: false }),
//     };

//     // Update main project
//     project.revision = (existingProject.revision || 0) + 1;
//     await existingProject.update(project, { transaction: t });

//     // Refresh rates
//     await ProjectRate.destroy({ where: { projectId: id }, transaction: t });
//     if (rates.length > 0) {
//       const ratesData = rates.map((rate) => ({ ...rate, projectId: id }));
//       await ProjectRate.bulkCreate(ratesData, { transaction: t });
//     }

//     // Refresh materials
//     await ProjectMaterial.destroy({ where: { projectId: id }, transaction: t });
//     if (materials.length > 0) {
//       const materialsData = materials.map((mat) => ({ ...mat, projectId: id }));
//       await ProjectMaterial.bulkCreate(materialsData, { transaction: t });
//     }

//     // Create snapshot of updated data
//     const updatedData = {
//       project,
//       rates,
//       materials,
//     };

//     // If amend is requested, store amendments
//     if (amend) {
//       await ProjectAmend.create(
//         {
//           projectId: id,
//           previousData,
//           updatedData,
//         },
//         { transaction: t }
//       );
//     }

//     await t.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Project setup updated successfully",
//     });
//   } catch (error) {
//     await t.rollback();
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update project setup",
//       error: error.message,
//     });
//   }
// };


// Helper function to take a snapshot of project data (with associations)
async function getProjectSnapshot(id, transaction) {
  const project = await ProjectSetup.findByPk(id, {
    include: [
      { model: Clients, as: "client" },
      { model: ProjectRate, as: "rates" },
      {
        model: ProjectMaterial,
        as: "materials",
        include: [{ model: Suppliers, as: "supplier" }],
      },
      { model: ProjectCostSheet, as: "costingSheet" },
    ],
    transaction,
  });

  const costingSheet = await ProjectCostSheet.findOne({
    where: { projectId: id },
    raw: true,
    transaction,
  });

  return {
    project: project ? project.toJSON() : null,
    rates: await ProjectRate.findAll({
      where: { projectId: id },
      raw: true,
      transaction,
    }),
    materials: await ProjectMaterial.findAll({
      where: { projectId: id },
      include: [{ model: Suppliers, as: "supplier" }],
      raw: false,
      transaction,
    }),
    costingSheet: costingSheet || null,
  };
}

export const updateProjectSetup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { project, rates = [], materials = [], costingSheet = {}, amend } = req.body;

    const existingProject = await ProjectSetup.findByPk(id, {
      include: [
        { model: Clients, as: "client" },
        { model: ProjectRate, as: "rates" },
        {
          model: ProjectMaterial,
          as: "materials",
          include: [{ model: Suppliers, as: "supplier" }],
        },
        { model: ProjectCostSheet, as: "costingSheet" },
      ],
      transaction: t,
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project setup not found",
      });
    }

    // 1️⃣ Create snapshot of previous data
    const previousData = await getProjectSnapshot(id, t);

    // 2️⃣ Update main project (increment revision)
    // Sanitize project data - handle labourCost, totalCost, totalSell, totalProfit conversion
    const sanitizedProject = {
      ...project,
      revision: (existingProject.revision || 0) + 1,
      labourCost: project.labourCost !== undefined && project.labourCost !== null && project.labourCost !== '' 
        ? parseFloat(project.labourCost) || 0 
        : 0,
      totalCost: project.totalCost !== undefined && project.totalCost !== null && project.totalCost !== '' 
        ? parseFloat(project.totalCost) || 0 
        : 0,
      totalSell: project.totalSell !== undefined && project.totalSell !== null && project.totalSell !== '' 
        ? parseFloat(project.totalSell) || 0 
        : 0,
      totalProfit: project.totalProfit !== undefined && project.totalProfit !== null && project.totalProfit !== '' 
        ? parseFloat(project.totalProfit) || 0 
        : 0,
    };
    await existingProject.update(sanitizedProject, { transaction: t });

    // 3️⃣ Refresh rates (sanitize data and filter empty records)
    await ProjectRate.destroy({ where: { projectId: id }, transaction: t });
    if (rates.length > 0) {
      const validRates = sanitizeData(rates).filter(rate => hasValidData(rate));
      if (validRates.length > 0) {
        const ratesData = validRates.map((rate) => ({ ...rate, projectId: id }));
        await ProjectRate.bulkCreate(ratesData, { transaction: t });
      }
    }

    // 4️⃣ Refresh materials (sanitize data and filter empty records)
    await ProjectMaterial.destroy({ where: { projectId: id }, transaction: t });
    if (materials.length > 0) {
      const validMaterials = sanitizeData(materials).filter(mat => hasValidData(mat));
      if (validMaterials.length > 0) {
        const materialsData = validMaterials.map((mat) => ({ ...mat, projectId: id }));
        await ProjectMaterial.bulkCreate(materialsData, { transaction: t });
      }
    }

    // 5️⃣ Refresh costing sheet (sanitize data)
    await ProjectCostSheet.destroy({ where: { projectId: id }, transaction: t });
    if (costingSheet && Object.keys(costingSheet).length > 0) {
      const sanitizedCostingSheet = sanitizeData(costingSheet);
      await ProjectCostSheet.create(
        { ...sanitizedCostingSheet, projectId: id },
        { transaction: t }
      );
    }

    // 6️⃣ Create snapshot of updated data
    const updatedData = await getProjectSnapshot(id, t);

    // 7️⃣ If amend flag is true, store amendments
    if (amend) {
      await ProjectAmend.create(
        {
          projectId: id,
          previousData,
          updatedData,
        },
        { transaction: t }
      );
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Project setup updated successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project setup",
      error: error.message,
    });
  }
};


export const getProjectAmend = async (req, res) => {
  const { id } = req.params;

  try {
    const projectAmend = await ProjectAmend.findAll({
  where: { projectId: id },
  include: [
    { model: ProjectSetup, as: 'project' },
  ],
});

    if (!projectAmend) {
      return res.status(404).json({
        success: false,
        message: "Project amendment not found",
      })
    }

    return res.status(200).json({
      success: true,
      data: projectAmend
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get project amendment",
      error: error.message,
    })
  }
}


export const deleteProjectSetup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const project = await ProjectSetup.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project setup not found",
      });
    }

    // Deleting will also cascade to rates & materials (if foreign keys are set with onDelete: "CASCADE")
    await ProjectSetup.destroy({ where: { id }, transaction: t });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Project setup deleted successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project setup",
      error: error.message,
    });
  }
};



export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const projectSetup = await ProjectSetup.findByPk(id);
    if (!projectSetup) {
      return res.status(404).json({
        success: false,
        message: "Project setup not found",
      });
    }
    projectSetup.status = status;
    await projectSetup.save();
    return res.status(200).json({
      success: true,
      message: "Project setup status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update project setup status",
      error: error.message,
    })
  }
}



export const getSalesStats = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    // Rate types from ProjectRate model
    const rateTypes = ['Material', 'Hardware', 'BuyIn', 'Freight', 'ShopDrawing', 'Machining', 'Assembly', 'Installation'];

    // ==================== 1. TOTAL PROJECTS & COST ====================
    const totalProjects = await ProjectSetup.count();
    
    // Get totals from ProjectSetup (totalCost = SELL + GST, totalSell = sell price, totalProfit = margin)
    const projectTotalsData = await ProjectSetup.findAll({
      attributes: [
        [fn('SUM', col('totalCost')), 'totalCost'], // SELL + GST
        [fn('SUM', col('totalSell')), 'totalSell'], // Sell price
        [fn('SUM', col('totalProfit')), 'totalProfit'], // Margin amount
      ],
      raw: true,
    });
    
    const totalCost = parseFloat(projectTotalsData[0]?.totalCost || 0); // This is SELL + GST
    const totalSell = parseFloat(projectTotalsData[0]?.totalSell || 0); // This is sell price
    const totalProfit = parseFloat(projectTotalsData[0]?.totalProfit || 0); // This is margin amount
    const profitMargin = totalSell > 0 ? ((totalProfit / totalSell) * 100) : 0;

    // ==================== 2. STATS BY RATE TYPE ====================
    const rateTypeStats = await Promise.all(
      rateTypes.map(async (type) => {
        const typeStats = await ProjectRate.findAll({
          attributes: [
            [fn('SUM', col('cost')), 'totalCost'],
            [fn('SUM', col('sell')), 'totalSell'],
            [fn('COUNT', col('id')), 'count'],
          ],
          where: { type },
          raw: true,
        });

        const stats = typeStats[0] || {};
        return {
          type,
          totalCost: parseFloat(stats.totalCost || 0),
          totalSell: parseFloat(stats.totalSell || 0),
          count: parseInt(stats.count || 0),
          profit: parseFloat(stats.totalSell || 0) - parseFloat(stats.totalCost || 0),
        };
      })
    );

    // ==================== 3. STATUS-BASED STATS ====================
    const statusStats = await ProjectSetup.findAll({
      attributes: [
        [col('status'), 'status'],
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('totalCost')), 'totalCost'], // SELL + GST
      ],
      group: ['status'],
      raw: true,
    });

    const statusCounts = statusStats.map(stat => ({
      status: stat.status || 'draft',
      count: parseInt(stat.count || 0),
      totalCost: parseFloat(stat.totalCost || 0), // SELL + GST
    }));

    // ==================== 4. RECENT ACTIVITY (Last 10 projects) ====================
    const recentProjects = await ProjectSetup.findAll({
      attributes: ['id', 'projectName', 'status', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Clients,
          as: 'client',
          attributes: ['id', 'companyName'],
          required: false,
        },
      ],
      order: [['updatedAt', 'DESC']],
      limit: 10,
    });

    const recentActivity = recentProjects.map(project => ({
      id: project.id,
      projectName: project.projectName,
      status: project.status,
      clientName: project.client?.companyName || 'N/A',
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    // ==================== 5. CONVERSION RATE ====================
    // Calculate projects that moved from draft to approved/pending/completed
    const draftProjects = await ProjectSetup.count({ where: { status: 'draft' } });
    const approvedProjects = await ProjectSetup.count({ 
      where: { 
        status: { [Op.in]: ['pending', 'approved', 'completed'] } 
      } 
    });
    const conversionRate = totalProjects > 0 ? ((approvedProjects / totalProjects) * 100) : 0;

    // ==================== 6. INCREASING RATE (Growth Rate) ====================
    // Compare current month vs previous month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthProjects = await ProjectSetup.count({
      where: {
        createdAt: {
          [Op.gte]: currentMonthStart,
        },
      },
    });

    const previousMonthProjects = await ProjectSetup.count({
      where: {
        createdAt: {
          [Op.gte]: previousMonthStart,
          [Op.lte]: previousMonthEnd,
        },
      },
    });

    const increasingRate = previousMonthProjects > 0 
      ? (((currentMonthProjects - previousMonthProjects) / previousMonthProjects) * 100) 
      : (currentMonthProjects > 0 ? 100 : 0);

    // Current month cost vs previous month cost
    // Get project IDs for current month
    const currentMonthProjectIds = await ProjectSetup.findAll({
      attributes: ['id'],
      where: {
        createdAt: {
          [Op.gte]: currentMonthStart,
        },
      },
      raw: true,
    });

    const previousMonthProjectIds = await ProjectSetup.findAll({
      attributes: ['id'],
      where: {
        createdAt: {
          [Op.gte]: previousMonthStart,
          [Op.lte]: previousMonthEnd,
        },
      },
      raw: true,
    });

    const currentMonthProjectIdList = currentMonthProjectIds.map(p => p.id);
    const previousMonthProjectIdList = previousMonthProjectIds.map(p => p.id);

    // Use totalCost (SELL + GST) from ProjectSetup
    const currentMonthCost = currentMonthProjectIdList.length > 0
      ? await ProjectSetup.findAll({
          attributes: [
            [fn('SUM', col('totalCost')), 'totalCost'], // SELL + GST
          ],
          where: {
            id: {
              [Op.in]: currentMonthProjectIdList,
            },
          },
          raw: true,
        })
      : [{ totalCost: 0 }];

    const previousMonthCost = previousMonthProjectIdList.length > 0
      ? await ProjectSetup.findAll({
          attributes: [
            [fn('SUM', col('totalCost')), 'totalCost'], // SELL + GST
          ],
          where: {
            id: {
              [Op.in]: previousMonthProjectIdList,
            },
          },
          raw: true,
        })
      : [{ totalCost: 0 }];

    const currentMonthCostValue = parseFloat(currentMonthCost[0]?.totalCost || 0);
    const previousMonthCostValue = parseFloat(previousMonthCost[0]?.totalCost || 0);
    const costIncreasingRate = previousMonthCostValue > 0
      ? (((currentMonthCostValue - previousMonthCostValue) / previousMonthCostValue) * 100)
      : (currentMonthCostValue > 0 ? 100 : 0);

    // ==================== 7. PROJECTS WITH JOBS ====================
    const projectsWithJobs = await ProjectSetup.count({
      include: [
        {
          model: ProjectSetupJob,
          as: 'jobs',
          required: true,
        },
      ],
      distinct: true,
    });

    // ==================== 8. TOP PROJECTS BY COST ====================
    // Use totalCost (SELL + GST) from ProjectSetup
    const topProjectsByCost = await ProjectSetup.findAll({
      attributes: [
        'id',
        'projectName',
        'totalCost', // SELL + GST
        'totalSell', // Sell price
        'totalProfit', // Margin amount
      ],
      order: [['totalCost', 'DESC']],
      limit: 5,
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProjects,
          totalCost,
          totalSell,
          totalProfit,
          profitMargin: parseFloat(profitMargin.toFixed(2)),
          projectsWithJobs,
        },
        rateTypeStats,
        statusCounts,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        increasingRate: {
          projects: parseFloat(increasingRate.toFixed(2)),
          cost: parseFloat(costIncreasingRate.toFixed(2)),
          currentMonthProjects,
          previousMonthProjects,
          currentMonthCost: currentMonthCostValue,
          previousMonthCost: previousMonthCostValue,
        },
        recentActivity,
        topProjectsByCost: (topProjectsByCost || []).map(project => ({
          projectId: project.id,
          projectName: project.projectName || 'Unknown',
          totalCost: parseFloat(project.totalCost || 0), // SELL + GST
          totalSell: parseFloat(project.totalSell || 0), // Sell price
          profit: parseFloat(project.totalProfit || 0), // Margin amount
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sales stats',
      error: error.message,
    });
  }
};


export const getFinancialReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    // Define active project statuses (in progress or completed)
    const activeStatuses = ['pending', 'approved', 'completed', 'revised'];
    
    // Build date filter if provided
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    // ==================== 1. GET ACTIVE PROJECTS (pending, approved, completed, revised) ====================
    const activeProjects = await ProjectSetup.findAll({
      where: {
        status: { [Op.in]: activeStatuses },
        ...dateFilter,
      },
      include: [
        {
          model: ProjectRate,
          as: 'rates',
          required: false,
        },
        {
          model: ProjectMaterial,
          as: 'materials',
          required: false,
        },
      ],
    });

    const activeProjectIds = activeProjects.map(p => p.id);

    // ==================== 2. CALCULATE TOTAL REVENUE (Use saved totalSell from ProjectSetup) ====================
    // Get total revenue from saved totalSell field (sum of all active projects' totalSell)
    const revenueData = await ProjectSetup.findAll({
      where: {
        id: { [Op.in]: activeProjectIds },
      },
      attributes: [
        [fn('SUM', col('totalSell')), 'totalRevenue'],
      ],
      raw: true,
    });
    
    const totalRevenue = parseFloat(revenueData[0]?.totalRevenue || 0);
    
    // Get total cash in (totalCost = SELL + GST) from saved field
    const cashInData = await ProjectSetup.findAll({
      where: {
        id: { [Op.in]: activeProjectIds },
      },
      attributes: [
        [fn('SUM', col('totalCost')), 'totalCashIn'], // totalCost = SELL + GST
      ],
      raw: true,
    });
    
    const totalCashIn = parseFloat(cashInData[0]?.totalCashIn || 0);

    // ==================== 3. CALCULATE TOTAL EXPENSES (Material Costs + Rate Costs + Labour Cost) ====================
    // Total material costs (materialCost + edgingCost)
    const materialCostsData = await ProjectMaterial.findAll({
      where: {
        projectId: { [Op.in]: activeProjectIds },
      },
      attributes: [
        [fn('SUM', col('materialCost')), 'totalMaterialCost'],
        [fn('SUM', col('edgingCost')), 'totalEdgingCost'],
      ],
      raw: true,
    });

    const totalMaterialCost = parseFloat(materialCostsData[0]?.totalMaterialCost || 0);
    const totalEdgingCost = parseFloat(materialCostsData[0]?.totalEdgingCost || 0);
    const totalMaterialsExpense = totalMaterialCost + totalEdgingCost;

    // Total rate costs (actual costs from rates - line items)
    const rateCostsData = await ProjectRate.findAll({
      where: {
        projectId: { [Op.in]: activeProjectIds },
      },
      attributes: [
        [fn('SUM', col('cost')), 'totalRateCost'],
      ],
      raw: true,
    });

    const totalRateCost = parseFloat(rateCostsData[0]?.totalRateCost || 0);

    // Total labour cost
    const labourCostsData = await ProjectSetup.findAll({
      where: {
        id: { [Op.in]: activeProjectIds },
      },
      attributes: [
        [fn('SUM', col('labourCost')), 'totalLabourCost'],
      ],
      raw: true,
    });

    const totalLabourCost = parseFloat(labourCostsData[0]?.totalLabourCost || 0);

    // Total expenses = material costs + rate costs + labour costs
    const totalExpenses = totalMaterialsExpense + totalRateCost + totalLabourCost;

    // ==================== 4. CALCULATE NET PROFIT ====================
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    // ==================== 5. CALCULATE CASH FLOWS ====================
    // Cash In = Total Cost (SELL + GST) from saved field - this is what clients pay
    const cashIn = totalCashIn;

    // Cash Out = Total Expenses (what we're paying - material costs + rate costs + labour costs)
    const cashOut = totalExpenses;

    // Cash Flow = Cash In - Cash Out
    const cashFlow = cashIn - cashOut;

    // ==================== 6. PROJECT PROFITABILITY ====================
    // Use saved values from ProjectSetup for profitability
    const projectProfitability = activeProjects.map((project) => {
      // Use saved values from project
      const revenue = parseFloat(project.totalSell || 0);
      const profit = parseFloat(project.totalProfit || 0); // This is margin amount
      
      // Calculate costs from revenue - profit
      const costs = revenue - profit;
      const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;
      
      return {
        id: project.id,
        name: project.projectName,
        revenue: parseFloat(revenue.toFixed(2)),
        costs: parseFloat(costs.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        margin: parseFloat(margin.toFixed(2)),
      };
    });

    // ==================== 7. CASH FLOW BREAKDOWN ====================
    // Cash Inflows breakdown
    const cashInflows = {
      projectPayments: totalCashIn, // Total Cost (SELL + GST) - what clients pay
    };

    // Cash Outflows breakdown
    const cashOutflows = {
      materialsAndSupplies: totalMaterialsExpense,
      lineItems: totalRateCost, // Rate costs
      labourCosts: totalLabourCost,
    };

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        cashFlow: parseFloat(cashFlow.toFixed(2)),
        cashIn: parseFloat(cashIn.toFixed(2)),
        cashOut: parseFloat(cashOut.toFixed(2)),
        breakdown: {
          expenses: {
            materials: parseFloat(totalMaterialsExpense.toFixed(2)),
            lineItems: parseFloat(totalRateCost.toFixed(2)),
            labour: parseFloat(totalLabourCost.toFixed(2)),
          },
          inflows: {
            projectPayments: parseFloat(cashInflows.projectPayments.toFixed(2)),
          },
          outflows: {
            materialsAndSupplies: parseFloat(cashOutflows.materialsAndSupplies.toFixed(2)),
            lineItems: parseFloat(cashOutflows.lineItems.toFixed(2)),
            labourCosts: parseFloat(cashOutflows.labourCosts.toFixed(2)),
          },
        },
        projectProfitability: projectProfitability.sort((a, b) => b.revenue - a.revenue),
        activeProjectsCount: activeProjects.length,
      },
    });
  } catch (error) {
    console.error('Error fetching financial report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch financial report',
      error: error.message,
    });
  }
};


export const getJobPerformanceStats = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    // Build date filter if provided
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    // ==================== 1. GET ALL PROJECTS ====================
    const allProjects = await ProjectSetup.findAll({
      where: {
        ...dateFilter,
      },
      include: [
        {
          model: ProjectSetupJob,
          as: 'jobs',
          required: false,
        },
      ],
    });

    const totalProjects = allProjects.length;
    const completedProjects = allProjects.filter(p => p.status === 'completed').length;

    // ==================== 2. CALCULATE AVERAGE EFFICIENCY ====================
    // Efficiency will be calculated per project based on time performance
    // Will calculate after getting project performance data
    let averageEfficiency = 0;

    // ==================== 3. CALCULATE ON-TIME DELIVERY ====================
    // Projects completed on time (completed before or on the latest job endDate)
    let onTimeProjects = 0;
    const now = new Date();

    allProjects.forEach(project => {
      if (project.status === 'completed' && project.jobs && project.jobs.length > 0) {
        // Get the latest job end date
        const latestJobEndDate = project.jobs.reduce((latest, job) => {
          const jobEndDate = new Date(job.endDate);
          return jobEndDate > latest ? jobEndDate : latest;
        }, new Date(0));

        // Check if project was completed on or before the latest job end date
        const completedDate = project.updatedAt || now;
        if (completedDate <= latestJobEndDate) {
          onTimeProjects++;
        }
      }
    });

    // Calculate on-time delivery percentage based on completed projects only
    const onTimeDelivery = completedProjects > 0 
      ? ((onTimeProjects / completedProjects) * 100) 
      : 0;

    // ==================== 4. PROJECTS AT RISK ====================
    // Projects with delayed jobs or jobs past their end date
    let projectsAtRisk = 0;
    const riskProjects = [];

    allProjects.forEach(project => {
      if (project.jobs && project.jobs.length > 0) {
        const hasDelayedJobs = project.jobs.some(job => {
          const jobEndDate = new Date(job.endDate);
          return job.status === 'delayed' || (job.status !== 'completed' && jobEndDate < now);
        });

        if (hasDelayedJobs) {
          projectsAtRisk++;
          riskProjects.push(project.id);
        }
      }
    });

    // ==================== 5. PROJECT PERFORMANCE ANALYSIS ====================
    const projectPerformance = allProjects.map(project => {
      // Calculate estimated time (from job dates)
      let estimatedTime = 0;
      let actualTime = 0;
      
      if (project.jobs && project.jobs.length > 0) {
        project.jobs.forEach(job => {
          const startDate = new Date(job.startDate);
          const endDate = new Date(job.endDate);
          const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          estimatedTime += days * 8; // Convert days to hours (8 hours per day)

          // Actual time: if completed, use actual duration; otherwise use estimated
          if (job.status === 'completed') {
            const completedDate = job.updatedAt || endDate;
            const actualDays = Math.ceil((completedDate - startDate) / (1000 * 60 * 60 * 24));
            actualTime += actualDays * 8;
          } else {
            actualTime += days * 8; // Use estimated if not completed
          }
        });
      }

      // Estimated cost = totalCost (from ProjectSetup)
      const estimatedCost = parseFloat(project.totalCost) || 0;
      
      // Actual cost = totalCost (since we don't have separate tracking, use same value)
      // In a real scenario, this would be tracked separately
      const actualCost = estimatedCost; // For now, use same as estimated

      // Efficiency = (estimatedTime / actualTime) * 100
      // Higher efficiency = completed faster than estimated
      const efficiency = actualTime > 0 
        ? ((estimatedTime / actualTime) * 100) 
        : (estimatedTime > 0 ? 100 : 0);

      return {
        id: project.id,
        name: project.projectName,
        estimatedTime: Math.round(estimatedTime),
        actualTime: Math.round(actualTime),
        estimatedCost: estimatedCost,
        actualCost: actualCost,
        efficiency: parseFloat(efficiency.toFixed(2)),
        status: project.status,
      };
    });

    // Calculate average efficiency from project performances
    const projectsWithTime = projectPerformance.filter(p => p.actualTime > 0);
    if (projectsWithTime.length > 0) {
      const totalEfficiency = projectsWithTime.reduce((sum, p) => sum + p.efficiency, 0);
      averageEfficiency = totalEfficiency / projectsWithTime.length;
    }

    return res.status(200).json({
      success: true,
      data: {
        averageEfficiency: parseFloat(averageEfficiency.toFixed(2)),
        onTimeDelivery: parseFloat(onTimeDelivery.toFixed(2)),
        totalProjects,
        completedProjects,
        projectsAtRisk,
        projects: projectPerformance,
      },
    });
  } catch (error) {
    console.error('Error fetching job performance stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job performance stats',
      error: error.message,
    });
  }
};

export const getAllProjectsBasicStats = async (req, res) => {
  try {
    const projects = await ProjectSetup.findAll({
      include: [
        {
          model: Clients,
          as: 'client',
          attributes: ['id', 'companyName', 'emailAddress', 'phoneNumber'],
          required: false,
        },
      ],
      attributes: ['id', 'projectName', 'description', 'status', 'totalCost', 'totalSell', 'totalProfit', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    const projectsList = projects.map(project => ({
      id: project.id,
      name: project.projectName,
      description: project.description || '',
      status: project.status,
      client: project.client ? {
        id: project.client.id,
        name: project.client.companyName,
        email: project.client.emailAddress,
        phone: project.client.phoneNumber,
      } : null,
      totalCost: parseFloat(project.totalCost || 0),
      totalSell: parseFloat(project.totalSell || 0),
      totalProfit: parseFloat(project.totalProfit || 0),
      createdAt: project.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: projectsList,
    });
  } catch (error) {
    console.error('Error fetching projects basic stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch projects basic stats',
      error: error.message,
    });
  }
};

export const getProjectSetupStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    // ==================== 1. PROJECT DETAILS ====================
    const project = await ProjectSetup.findByPk(id, {
      include: [
        { model: Clients, as: 'client', required: false },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // ==================== 2. RATES ====================
    const rates = await ProjectRate.findAll({
      where: { projectId: id },
      order: [['type', 'ASC']],
    });

    // ==================== 3. COSTING SHEET ====================
    const costingSheet = await ProjectCostSheet.findOne({
      where: { projectId: id },
    });

    // ==================== 4. JOBS WITH WORKERS & HOURS ====================
    const jobs = await ProjectSetupJob.findAll({
      where: { projectSetupId: id },
      include: [
        {
          model: ProjectSetupJobWorker,
          as: 'assignedWorkers',
          include: [
            {
              model: Worker,
              as: 'worker',
              attributes: ['id', 'name', 'email', 'phone', 'jobTitle', 'hourlyRate', 'weeklyHours'],
            },
          ],
        },
        {
          model: ProjectKanban,
          as: 'kanbanTasks',
          attributes: ['id', 'title', 'status', 'stage', 'priority', 'startDate', 'endDate'],
        },
      ],
      order: [['startDate', 'ASC']],
    });

    // Calculate hours and work details
    let totalHoursAssigned = 0;
    let totalWorkersAssigned = 0;
    const maxHoursPerWeek = 40; // 8 hours * 5 days
    const workersDetails = [];

    jobs.forEach(job => {
      if (job.assignedWorkers && job.assignedWorkers.length > 0) {
        job.assignedWorkers.forEach(jobWorker => {
          const hoursAssigned = jobWorker.hoursAssigned || 0;
          totalHoursAssigned += hoursAssigned;
          totalWorkersAssigned++;

          // Calculate work days (assuming 5 days per week, 8 hours max per day)
          const workDays = Math.ceil(hoursAssigned / 8);
          const weeks = Math.ceil(workDays / 5);
          const overtimeHours = hoursAssigned > maxHoursPerWeek * weeks 
            ? hoursAssigned - (maxHoursPerWeek * weeks) 
            : 0;

          workersDetails.push({
            workerId: jobWorker.worker?.id,
            workerName: jobWorker.worker?.name || 'Unknown',
            workerEmail: jobWorker.worker?.email,
            workerPhone: jobWorker.worker?.phone,
            jobTitle: jobWorker.worker?.jobTitle,
            hourlyRate: jobWorker.worker?.hourlyRate || 0,
            weeklyHours: jobWorker.worker?.weeklyHours || 0,
            jobId: job.id,
            jobStartDate: job.startDate,
            jobEndDate: job.endDate,
            jobStatus: job.status,
            hoursAssigned: hoursAssigned,
            role: jobWorker.role || 'Worker',
            workDays: workDays,
            weeks: weeks,
            overtimeHours: overtimeHours,
            regularHours: hoursAssigned - overtimeHours,
          });
        });
      }
    });

    // ==================== 5. KANBAN TASKS WITH PROGRESS ====================
    // Get all job IDs for this project first
    const jobIds = jobs.map(job => job.id);
    
    const allKanbanTasks = jobIds.length > 0
      ? await ProjectKanban.findAll({
          where: {
            projectSetupJobId: {
              [Op.in]: jobIds,
            },
          },
          include: [
            {
              model: Worker,
              as: 'assignedWorker',
              attributes: ['id', 'name', 'email'],
              required: false,
            },
          ],
        })
      : [];

    // Calculate progress for each task
    const tasksWithProgress = allKanbanTasks.map(task => {
      const stages = ['To Do', 'In Progress', 'Done'];
      const currentStageIndex = stages.indexOf(task.stage || 'To Do');
      const progress = ((currentStageIndex + 1) / stages.length) * 100;

      // Calculate days until deadline
      let daysUntilDeadline = null;
      if (task.endDate) {
        const today = new Date();
        const deadline = new Date(task.endDate);
        const diffTime = deadline - today;
        daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        stage: task.stage,
        priority: task.priority,
        progress: Math.round(progress),
        startDate: task.startDate,
        endDate: task.endDate,
        daysUntilDeadline: daysUntilDeadline,
        assignedWorker: task.assignedWorker ? {
          id: task.assignedWorker.id,
          name: task.assignedWorker.name,
          email: task.assignedWorker.email,
        } : null,
        jobId: task.projectSetupJobId,
      };
    });

    // ==================== 6. MATERIALS & INVENTORY ====================
    const materials = await ProjectMaterial.findAll({
      where: { projectId: id },
      include: [
        {
          model: Suppliers,
          as: 'supplier',
          attributes: ['id', 'name', 'email', 'phone', 'address', 'status'],
          required: false,
        },
      ],
    });

    // ==================== 7. TOTAL COST & PROFIT CALCULATIONS ====================
    // Calculate from rates
    const ratesTotalCost = rates.reduce((sum, rate) => sum + (parseFloat(rate.cost) || 0), 0);
    const ratesTotalSell = rates.reduce((sum, rate) => sum + (parseFloat(rate.sell) || 0), 0);
    const ratesProfit = ratesTotalSell - ratesTotalCost;

    // Calculate from materials
    const materialsTotalCost = materials.reduce((sum, mat) => 
      sum + (parseFloat(mat.materialCost) || 0) + (parseFloat(mat.edgingCost) || 0), 0
    );

    // Calculate worker costs (hours * hourly rate)
    const workerCosts = workersDetails.reduce((sum, worker) => {
      const regularCost = (worker.regularHours || 0) * (worker.hourlyRate || 0);
      const overtimeCost = (worker.overtimeHours || 0) * (worker.hourlyRate || 0) * 1.5; // 1.5x for overtime
      return sum + regularCost + overtimeCost;
    }, 0);

    // Total costs
    const totalCost = ratesTotalCost + materialsTotalCost + workerCosts;
    const totalSell = ratesTotalSell;
    const totalProfit = totalSell - totalCost;
    const profitMargin = totalSell > 0 ? ((totalProfit / totalSell) * 100) : 0;

    // ==================== 8. SUPPLIER PERFORMANCE ====================
    // Get purchases for this project
    const purchases = await ProjectPurchase.findAll({
      where: { projectId: id },
      include: [
        {
          model: Suppliers,
          as: 'suppliers',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    // Group by supplier
    const supplierPerformanceMap = new Map();
    purchases.forEach(purchase => {
      if (purchase.suppliers) {
        const supplierId = purchase.suppliers.id;
        if (!supplierPerformanceMap.has(supplierId)) {
          supplierPerformanceMap.set(supplierId, {
            supplierId: supplierId,
            supplierName: purchase.suppliers.name,
            supplierEmail: purchase.suppliers.email,
            supplierPhone: purchase.suppliers.phone,
            totalOrders: 0,
            totalSpent: 0,
            deliveredOrders: 0,
            delayedOrders: 0,
            pendingOrders: 0,
          });
        }
        const perf = supplierPerformanceMap.get(supplierId);
        perf.totalOrders++;
        perf.totalSpent += parseFloat(purchase.totalAmount || 0);
        
        if (purchase.status === 'delivered') perf.deliveredOrders++;
        else if (purchase.status === 'delayed') perf.delayedOrders++;
        else if (purchase.status === 'pending' || purchase.status === 'submit') perf.pendingOrders++;
      }
    });

    const supplierPerformance = Array.from(supplierPerformanceMap.values());

    // ==================== 9. MATERIALS BY SUPPLIER ====================
    const materialsBySupplier = {};
    materials.forEach(material => {
      const supplierId = material.supplierId || 'unknown';
      if (!materialsBySupplier[supplierId]) {
        materialsBySupplier[supplierId] = {
          supplierId: supplierId,
          supplierName: material.supplier?.name || 'Unknown',
          supplierEmail: material.supplier?.email,
          supplierPhone: material.supplier?.phone,
          materials: [],
          totalCost: 0,
        };
      }
      const cost = (parseFloat(material.materialCost) || 0) + (parseFloat(material.edgingCost) || 0);
      materialsBySupplier[supplierId].materials.push({
        id: material.id,
        finishMaterial: material.finishMaterial,
        materialType: material.materialType,
        measure: material.measure,
        materialCost: parseFloat(material.materialCost || 0),
        edgingCost: parseFloat(material.edgingCost || 0),
        totalCost: cost,
      });
      materialsBySupplier[supplierId].totalCost += cost;
    });

    // ==================== 10. HOURS SUMMARY ====================
    const hoursSummary = {
      totalHoursAssigned: totalHoursAssigned,
      totalWorkersAssigned: totalWorkersAssigned,
      totalRegularHours: workersDetails.reduce((sum, w) => sum + (w.regularHours || 0), 0),
      totalOvertimeHours: workersDetails.reduce((sum, w) => sum + (w.overtimeHours || 0), 0),
      totalWorkDays: workersDetails.reduce((sum, w) => sum + (w.workDays || 0), 0),
      totalWeeks: Math.max(...workersDetails.map(w => w.weeks || 0), 0),
      totalWorkerCost: workerCosts,
      averageHoursPerWorker: totalWorkersAssigned > 0 ? (totalHoursAssigned / totalWorkersAssigned) : 0,
    };

    // ==================== 11. TASK PROGRESS SUMMARY ====================
    const taskProgressSummary = {
      totalTasks: tasksWithProgress.length,
      completedTasks: tasksWithProgress.filter(t => t.stage === 'Done').length,
      inProgressTasks: tasksWithProgress.filter(t => t.stage === 'In Progress').length,
      pendingTasks: tasksWithProgress.filter(t => t.stage === 'To Do').length,
      averageProgress: tasksWithProgress.length > 0
        ? Math.round(tasksWithProgress.reduce((sum, t) => sum + t.progress, 0) / tasksWithProgress.length)
        : 0,
      highPriorityTasks: tasksWithProgress.filter(t => t.priority === 'high').length,
      overdueTasks: tasksWithProgress.filter(t => t.daysUntilDeadline !== null && t.daysUntilDeadline < 0 && t.stage !== 'Done').length,
    };

    // ==================== 12. RATES BY TYPE ====================
    const ratesByType = {};
    rates.forEach(rate => {
      if (!ratesByType[rate.type]) {
        ratesByType[rate.type] = {
          type: rate.type,
          rates: [],
          totalCost: 0,
          totalSell: 0,
          totalProfit: 0,
        };
      }
      ratesByType[rate.type].rates.push({
        id: rate.id,
        markup: parseFloat(rate.markup || 0),
        cost: parseFloat(rate.cost || 0),
        sell: parseFloat(rate.sell || 0),
        hourlyRate: parseFloat(rate.hourlyRate || 0),
        profit: parseFloat(rate.sell || 0) - parseFloat(rate.cost || 0),
      });
      ratesByType[rate.type].totalCost += parseFloat(rate.cost || 0);
      ratesByType[rate.type].totalSell += parseFloat(rate.sell || 0);
      ratesByType[rate.type].totalProfit += (parseFloat(rate.sell || 0) - parseFloat(rate.cost || 0));
    });

    // ==================== 13. WORKER PERFORMANCE (LEAVES & TIMESHEETS) ====================
    const workerEmails = [...new Set(workersDetails.map(w => w.workerEmail).filter(Boolean))];
    const matchingUsers = workerEmails.length > 0 ? await User.findAll({
      where: { email: { [Op.in]: workerEmails } },
      attributes: ['id', 'email', 'name'],
    }) : [];

    const emailToUserIdMap = new Map();
    matchingUsers.forEach(user => {
      emailToUserIdMap.set(user.email, user.id);
    });

    const userIds = Array.from(emailToUserIdMap.values());
    const workerPerformance = workersDetails.map(worker => {
      const userId = emailToUserIdMap.get(worker.workerEmail);
      return {
        ...worker,
        userId: userId || null,
      };
    });

    // Get leaves and timesheets for workers
    const workerLeaves = userIds.length > 0 ? await EmployeeLeave.findAll({
      where: {
        employeeId: { [Op.in]: userIds },
        status: 'approved',
      },
      attributes: ['id', 'employeeId', 'leaveType', 'startDate', 'endDate', 'status'],
    }) : [];

    const workerTimeSheets = userIds.length > 0 ? await EmployeeTimeSheet.findAll({
      where: {
        employeeId: { [Op.in]: userIds },
        status: 'approved',
      },
      attributes: ['id', 'employeeId', 'date', 'overWork', 'startTime', 'endTime'],
    }) : [];

    // Add leaves and timesheet data to worker performance
    const workerPerformanceWithData = workerPerformance.map(worker => {
      if (!worker.userId) {
        return {
          ...worker,
          leaves: [],
          totalLeaves: 0,
          timesheets: [],
          totalOvertimeHours: 0,
        };
      }

      const leaves = workerLeaves.filter(leave => leave.employeeId === worker.userId);
      const timesheets = workerTimeSheets.filter(ts => ts.employeeId === worker.userId);
      
      // Calculate total overtime hours
      const timeToHours = (timeString) => {
        if (!timeString) return 0;
        const parts = timeString.split(':');
        if (parts.length < 2) return 0;
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        return hours + (minutes / 60);
      };

      const totalOvertimeHours = timesheets.reduce((sum, ts) => {
        return sum + timeToHours(ts.overWork);
      }, 0);

      return {
        ...worker,
        leaves: leaves.map(l => ({
          id: l.id,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
        })),
        totalLeaves: leaves.length,
        timesheets: timesheets.map(ts => ({
          id: ts.id,
          date: ts.date,
          overWork: ts.overWork,
        })),
        totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
      };
    });

    // ==================== 14. PURCHASING ITEMS ====================
    const purchasingItems = purchases.map(purchase => ({
      id: purchase.id,
      supplierName: purchase.suppliers?.name || 'Unknown',
      totalAmount: parseFloat(purchase.totalAmount || 0),
      status: purchase.status,
      expectedDelivery: purchase.expectedDelivery,
      deliveryStatus: purchase.deliveryStatus,
    }));

    return res.status(200).json({
      success: true,
      data: {
        project: {
          id: project.id,
          projectName: project.projectName,
          siteLocation: project.siteLocation,
          accessNotes: project.accessNotes,
          status: project.status,
          revision: project.revision,
          client: project.client ? {
            id: project.client.id,
            companyName: project.client.companyName,
            emailAddress: project.client.emailAddress,
            phoneNumber: project.client.phoneNumber,
          } : null,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
        rates: rates.map(rate => ({
          id: rate.id,
          type: rate.type,
          markup: parseFloat(rate.markup || 0),
          cost: parseFloat(rate.cost || 0),
          sell: parseFloat(rate.sell || 0),
          hourlyRate: parseFloat(rate.hourlyRate || 0),
          profit: parseFloat(rate.sell || 0) - parseFloat(rate.cost || 0),
        })),
        ratesByType: Object.values(ratesByType),
        costingSheet: costingSheet || null,
        jobs: jobs.map(job => ({
          id: job.id,
          startDate: job.startDate,
          endDate: job.endDate,
          status: job.status,
          notes: job.notes,
          workersCount: job.assignedWorkers?.length || 0,
          tasksCount: job.kanbanTasks?.length || 0,
        })),
        workersDetails: workersDetails,
        hoursSummary: hoursSummary,
        tasks: tasksWithProgress,
        taskProgressSummary: taskProgressSummary,
        materials: materials.map(material => ({
          id: material.id,
          finishMaterial: material.finishMaterial,
          materialType: material.materialType,
          measure: material.measure,
          materialCost: parseFloat(material.materialCost || 0),
          edgingCost: parseFloat(material.edgingCost || 0),
          totalCost: parseFloat(material.materialCost || 0) + parseFloat(material.edgingCost || 0),
          supplier: material.supplier ? {
            id: material.supplier.id,
            name: material.supplier.name,
            email: material.supplier.email,
            phone: material.supplier.phone,
          } : null,
        })),
        materialsBySupplier: Object.values(materialsBySupplier),
        supplierPerformance: supplierPerformance,
        purchasingItems: purchasingItems,
        workerPerformance: workerPerformanceWithData,
        financialSummary: {
          ratesTotalCost: ratesTotalCost,
          ratesTotalSell: ratesTotalSell,
          ratesProfit: ratesProfit,
          materialsTotalCost: materialsTotalCost,
          workerCosts: workerCosts,
          totalCost: totalCost,
          totalSell: totalSell,
          totalProfit: totalProfit,
          profitMargin: parseFloat(profitMargin.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching project setup stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project setup stats',
      error: error.message,
    });
  }
};