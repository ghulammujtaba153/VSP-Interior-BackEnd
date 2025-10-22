import db from "../../../models/index.js";
const { ProjectKanban } = db;
import { Op } from "sequelize";


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
        const tasks = await ProjectKanban.findAll({ where: { projectSetupJobId } });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching kanban tasks", error: error.message });
    }
}

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