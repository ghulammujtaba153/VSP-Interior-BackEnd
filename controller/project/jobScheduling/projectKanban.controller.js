import db from "../../../models/index.js";
const { ProjectKanban, Worker } = db;
import { Op } from "sequelize";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/kanban-files";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  },
});


export const createKanbanTask = async (req, res) => {
    try {
        const projectKanban = await ProjectKanban.create(req.body);
        res.status(201).json({ message: "Kanban task created successfully", task: projectKanban });
    } catch (error) {
        res.status(500).json({ message: "Error creating kanban task", error: error.message });
    }
}

export const getKanbanTasksByJob = async (req, res) => {
  try {
    const { projectSetupJobId } = req.params;

    const tasks = await ProjectKanban.findAll({
      where: { projectSetupJobId },
      include: [
        // {
        //   model: ProjectSetupJob,
        //   as: "kanbanTasks",
        //   attributes: ["id", "jobTitle", "description"], 
        // },
        {
          model: Worker,
          as: "assignedWorker",
          
        },
      ],
    });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching kanban tasks",
      error: error.message,
    });
  }
};


export const updateKanbanTask = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedTask = await ProjectKanban.update(req.body, { where: { id } });
        res.status(200).json({ message: "Kanban task updated successfully", task: updatedTask });
    } catch (error) {
        res.status(500).json({ message: "Error updating kanban task", error: error.message });
    }
}


export const deleteKanbanTask = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedTask = await ProjectKanban.destroy({ where: { id } });
        res.status(200).json({ message: "Kanban task deleted successfully", task: deletedTask });
    } catch (error) {
        res.status(500).json({ message: "Error deleting kanban task", error: error.message });
    }
}

// File upload endpoint
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileUrl = `/uploads/kanban-files/${req.file.filename}`;
        
        res.status(200).json({
            message: "File uploaded successfully",
            fileUrl: fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype
        });
    } catch (error) {
        res.status(500).json({ message: "Error uploading file", error: error.message });
    }
}

// Export multer middleware for use in routes
export { upload };