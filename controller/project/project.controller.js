import db from "../../models/index.js";
const { Project, Clients, ProjectWorker, InventoryAllocation } = db;

export const createProject = async (req, res) => {
  try {
    const { projectData, clientData, workers = [], allocations = [] } = req.body;

    if (!projectData || !clientData?.id) {
      return res.status(400).json({ message: "Project data and client ID are required" });
    }

    // ✅ Fix: use Clients instead of Client
    const clientInstance = await Clients.findByPk(clientData.id);
    if (!clientInstance) {
      return res.status(404).json({ message: "Client not found" });
    }

    const project = await Project.create({
      ...projectData,
      clientId: clientInstance.id,
      client: clientInstance.companyName,
    });

    if (workers.length > 0) {
      await Promise.all(
        workers.map((worker) =>
          ProjectWorker.create({
            projectId: project.id,
            workerId: worker.workerId,
            role: worker.role,
            assignedHours: worker.assignedHours,
            startDate: worker.startDate,
            endDate: worker.endDate,
          })
        )
      );
    }

    if (allocations.length > 0) {
      await Promise.all(
        allocations.map((allocation) =>
          InventoryAllocation.create({
            projectId: project.id,
            materialId: allocation.materialId,
            quantityAllocated: allocation.quantityAllocated,
          })
        )
      );
    }

    return res.status(201).json({
      message: "Project created successfully",
      projectId: project.id,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
