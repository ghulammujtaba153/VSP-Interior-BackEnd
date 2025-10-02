import db from "../../models/index.js";

const { ProjectSetup, ProjectRate, ProjectMaterial, Clients, ProjectAmend, Suppliers } = db;

export const createProjectSetup = async (req, res) => {
  const t = await db.sequelize.transaction(); // Start transaction
  try {
    const { project, rates = [], materials = [] } = req.body;

    // 1. Create ProjectSetup
    const newProject = await ProjectSetup.create(project, { transaction: t });

    const projectId = newProject.id;

    // 2. Create ProjectRates
    if (rates.length > 0) {
      const ratesData = rates.map((rate) => ({ ...rate, projectId }));
      await ProjectRate.bulkCreate(ratesData, { transaction: t });
    }

    // 3. Create ProjectMaterials
    if (materials.length > 0) {
      const materialsData = materials.map((mat) => ({ ...mat, projectId }));
      await ProjectMaterial.bulkCreate(materialsData, { transaction: t });
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
    ],
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
  };
}

export const updateProjectSetup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { project, rates = [], materials = [], amend } = req.body;

    const existingProject = await ProjectSetup.findByPk(id, {
      include: [
        { model: Clients, as: "client" },
        { model: ProjectRate, as: "rates" },
        {
          model: ProjectMaterial,
          as: "materials",
          include: [{ model: Suppliers, as: "supplier" }],
        },
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
    project.revision = (existingProject.revision || 0) + 1;
    await existingProject.update(project, { transaction: t });

    // 3️⃣ Refresh rates
    await ProjectRate.destroy({ where: { projectId: id }, transaction: t });
    if (rates.length > 0) {
      const ratesData = rates.map((rate) => ({ ...rate, projectId: id }));
      await ProjectRate.bulkCreate(ratesData, { transaction: t });
    }

    // 4️⃣ Refresh materials
    await ProjectMaterial.destroy({ where: { projectId: id }, transaction: t });
    if (materials.length > 0) {
      const materialsData = materials.map((mat) => ({ ...mat, projectId: id }));
      await ProjectMaterial.bulkCreate(materialsData, { transaction: t });
    }

    // 5️⃣ Create snapshot of updated data
    const updatedData = await getProjectSnapshot(id, t);

    // 6️⃣ If amend flag is true, store amendments
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
