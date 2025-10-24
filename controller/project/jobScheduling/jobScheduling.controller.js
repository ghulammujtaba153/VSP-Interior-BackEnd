import db from "../../../models/index.js";
const { ProjectSetupJob, ProjectSetupJobWorker, Worker, ProjectSetup } = db;
import { Op } from "sequelize";

// ✅ Create Job Scheduling
export const createJobScheduling = async (req, res) => {
  try {
    const { projectSetupId, startDate, endDate, status, notes, workerIds } = req.body;

    if (!projectSetupId || !startDate || !endDate) {
      return res.status(400).json({ message: "projectSetupId, startDate, and endDate are required." });
    }

    // Create main job record
    const job = await ProjectSetupJob.create({
      projectSetupId,
      startDate,
      endDate,
      status: status || "scheduled",
      notes,
    });

    // Assign workers (many-to-many through junction)
    // Assign workers (many-to-many through junction)
if (Array.isArray(workerIds) && workerIds.length > 0) {
  const workerAssignments = workerIds.map(({ workerId, hoursAssigned }) => ({
    projectSetupJobId: job.id,
    workerId,
    hoursAssigned: hoursAssigned || null, // optional if your table has this column
  }));
  await ProjectSetupJobWorker.bulkCreate(workerAssignments);
}


    // Fetch full created job with associations
    const createdJob = await ProjectSetupJob.findByPk(job.id, {
      include: [
        { model: ProjectSetup, as: "projectSetup" },
        { model: Worker, as: "workers", through: { attributes: [] } },
      ],
    });

    return res.status(201).json({ message: "Job scheduled successfully", job: createdJob });
  } catch (error) {
    console.error("Error creating job scheduling:", error);
    return res.status(500).json({ message: "Server error while creating job", error: error.message });
  }
};

// ✅ Get All Job Schedulings
export const getJobSchedulings = async (req, res) => {
  try {
    const jobs = await ProjectSetupJob.findAll({
      include: [
        { model: ProjectSetup, as: "projectSetup" },
        { model: Worker, as: "workers", through: { attributes: ["hoursAssigned"] } },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ total: jobs.length, jobs });
  } catch (error) {
    console.error("Error fetching job schedulings:", error);
    return res.status(500).json({ message: "Server error while fetching jobs", error: error.message });
  }
};


// ✅ Get single Job Scheduling (with full project data)
export const getJobScheduling = async (req, res) => {
  const { id } = req.params;

  try {
    const job = await ProjectSetupJob.findOne({
      where: { id },
      include: [
        {
          model: ProjectSetup,
          as: "projectSetup",
          include: [
            { model: db.ProjectRate, as: "rates" },
            { model: db.ProjectMaterial, as: "materials" },
            { model: db.ProjectVariation, as: "variations" },
            { model: db.ProjectAmend, as: "amends" },
            { model: db.ProjectCostSheet, as: "costingSheet" },
            { model: db.Clients, as: "client" },
          ],
        },
        {
          model: Worker,
          as: "workers",
          through: { attributes: ["hoursAssigned"] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!job)
      return res.status(404).json({ message: "Job not found" });

    return res.status(200).json({ job });
  } catch (error) {
    console.error("Error fetching job scheduling:", error);
    return res.status(500).json({
      message: "Server error while fetching job",
      error: error.message,
    });
  }
};


// ✅ Update Job Scheduling
export const updateJobScheduling = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, status, notes, workerIds } = req.body;

    const job = await ProjectSetupJob.findByPk(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    await job.update({
      startDate: startDate || job.startDate,
      endDate: endDate || job.endDate,
      status: status || job.status,
      notes: notes || job.notes,
    });

    // Update assigned workers
    // Update assigned workers
if (Array.isArray(workerIds)) {
  await ProjectSetupJobWorker.destroy({ where: { projectSetupJobId: id } });

  const workerAssignments = workerIds.map(({ workerId, hoursAssigned }) => ({
    projectSetupJobId: id,
    workerId,
    hoursAssigned: hoursAssigned || null,
  }));
  await ProjectSetupJobWorker.bulkCreate(workerAssignments);
}


    const updatedJob = await ProjectSetupJob.findByPk(id, {
      include: [
        { model: ProjectSetup, as: "projectSetup" },
        { model: Worker, as: "workers", through: { attributes: [] } },
      ],
    });

    return res.status(200).json({ message: "Job updated successfully", job: updatedJob });
  } catch (error) {
    console.error("Error updating job scheduling:", error);
    return res.status(500).json({ message: "Server error while updating job", error: error.message });
  }
};

// ✅ Get Jobs of a Worker
export const getJobsofWorker = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // ✅ use 'where' for Sequelize
    const worker = await Worker.findOne({ where: { email } });

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const workerId = worker.id;

    const jobs = await ProjectSetupJob.findAll({
      include: [
        {
          model: Worker,
          as: "workers",
          where: { id: workerId },
          through: { attributes: [] },
        },
        { model: ProjectSetup, as: "projectSetup" },
      ],
      order: [["startDate", "ASC"]],
    });

    return res.status(200).json({ total: jobs.length, jobs });
  } catch (error) {
    console.error("Error fetching worker jobs:", error);
    return res.status(500).json({
      message: "Server error while fetching worker jobs",
      error: error.message,
    });
  }
};


// ✅ Delete Job Scheduling
export const deleteJobScheduling = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await ProjectSetupJob.findByPk(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    await ProjectSetupJobWorker.destroy({ where: { projectSetupJobId: id } });
    await job.destroy();

    return res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job scheduling:", error);
    return res.status(500).json({ message: "Server error while deleting job", error: error.message });
  }
};
