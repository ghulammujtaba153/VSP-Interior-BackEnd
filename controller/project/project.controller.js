// import db from "../../models/index.js";
// const { Project, Clients, ProjectWorker, InventoryAllocation } = db;

// export const createProject = async (req, res) => {
//   try {
//     const { projectData, clientData, workers = [], allocations = [] } = req.body;

//     if (!projectData || !clientData?.id) {
//       return res.status(400).json({ message: "Project data and client ID are required" });
//     }

//     // ✅ Fix: use Clients instead of Client
//     const clientInstance = await Clients.findByPk(clientData.id);
//     if (!clientInstance) {
//       return res.status(404).json({ message: "Client not found" });
//     }

//     const project = await Project.create({
//       ...projectData,
//       clientId: clientInstance.id,
//       client: clientInstance.companyName,
//     });

//     if (workers.length > 0) {
//       await Promise.all(
//         workers.map((worker) =>
//           ProjectWorker.create({
//             projectId: project.id,
//             workerId: worker.workerId,
//             role: worker.role,
//             assignedHours: worker.assignedHours,
//             startDate: worker.startDate,
//             endDate: worker.endDate,
//           })
//         )
//       );
//     }

//     if (allocations.length > 0) {
//       await Promise.all(
//         allocations.map((allocation) =>
//           InventoryAllocation.create({
//             projectId: project.id,
//             materialId: allocation.materialId,
//             quantityAllocated: allocation.quantityAllocated,
//           })
//         )
//       );
//     }

//     return res.status(201).json({
//       message: "Project created successfully",
//       projectId: project.id,
//     });
//   } catch (error) {
//     console.error("Error creating project:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };



// export const getAllProjects = async (req, res) => {
//   try {
//     let { page = 1, limit = 10, search = "" } = req.query;
//     page = parseInt(page);
//     limit = parseInt(limit);
//     const offset = (page - 1) * limit;

//     // ✅ Search filter
//     const where = search
//       ? {
//           [db.Sequelize.Op.or]: [
//             { name: { [db.Sequelize.Op.like]: `%${search}%` } },
//             { description: { [db.Sequelize.Op.like]: `%${search}%` } },
//           ],
//         }
//       : {};

//     // ✅ Fetch projects with pagination + search
//     const { count, rows: projects } = await Project.findAndCountAll({
//       where,
//       include: [
//         { model: Clients, as: "clientDetails" },
//         {
//           model: ProjectWorker,
//           as: "workers",
//           include: [{ model: db.Worker, as: "worker" }],
//         },
//         {
//           model: InventoryAllocation,
//           as: "allocations",
//           include: [{ model: db.Inventory, as: "material" }],
//         },
//       ],
//       offset,
//       limit,
//       distinct: true, // ✅ ensures correct count when joins are used
//       order: [["createdAt", "DESC"]],
//     });

//     res.status(200).json({
//       total: count,
//       page,
//       limit,
//       totalPages: Math.ceil(count / limit),
//       projects,
//     });
//   } catch (error) {
//     console.error("Error fetching projects:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };




// export const getProjectById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const project = await Project.findOne({
//       where: { id },
//       include: [
//         { model: Clients, as: "clientDetails" },
//         {
//           model: ProjectWorker,
//           as: "workers",
//           include: [{ model: db.Worker, as: "worker" }], // ✅ worker details
//         },
//         {
//           model: InventoryAllocation,
//           as: "allocations",
//           include: [{ model: db.Inventory, as: "material" }], // ✅ material details
//         },
//       ],
//       order: [["createdAt", "DESC"]], // keep same ordering style as list API
//     });

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     res.status(200).json({
//       success: true,
//       project,
//     });
//   } catch (error) {
//     console.error("Error fetching project by ID:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//       error: error.message,
//     });
//   }
// };



// // ✅ Update project with client and details
// export const updateProject = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { projectData, clientData, workers = [], allocations = [] } = req.body;

//     const project = await Project.findByPk(id);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     // Validate client
//     let clientInstance = null;
//     if (clientData?.id) {
//       clientInstance = await Clients.findByPk(clientData.id);
//       if (!clientInstance) {
//         return res.status(404).json({ message: "Client not found" });
//       }
//     }

//     // Update main project
//     await project.update({
//       ...projectData,
//       clientId: clientInstance ? clientInstance.id : project.clientId,
//       client: clientInstance ? clientInstance.companyName : project.client,
//     });

//     // Update workers (replace old workers with new ones)
//     if (workers.length > 0) {
//       await ProjectWorker.destroy({ where: { projectId: project.id } });
//       await Promise.all(
//         workers.map((worker) =>
//           ProjectWorker.create({
//             projectId: project.id,
//             workerId: worker.workerId,
//             role: worker.role,
//             assignedHours: worker.assignedHours,
//             startDate: worker.startDate,
//             endDate: worker.endDate,
//           })
//         )
//       );
//     }

//     // Update allocations (replace old allocations with new ones)
//     if (allocations.length > 0) {
//       await InventoryAllocation.destroy({ where: { projectId: project.id } });
//       await Promise.all(
//         allocations.map((allocation) =>
//           InventoryAllocation.create({
//             projectId: project.id,
//             materialId: allocation.materialId,
//             quantityAllocated: allocation.quantityAllocated,
//           })
//         )
//       );
//     }

//     return res.status(200).json({
//       message: "Project updated successfully",
//       projectId: project.id,
//     });
//   } catch (error) {
//     console.error("Error updating project:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };


// // ✅ Delete project with workers and allocations
// export const deleteProject = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const project = await Project.findByPk(id);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     // Delete related workers and allocations first
//     await ProjectWorker.destroy({ where: { projectId: id } });
//     await InventoryAllocation.destroy({ where: { projectId: id } });

//     // Delete the project
//     await project.destroy();

//     return res.status(200).json({ message: "Project deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting project:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };
