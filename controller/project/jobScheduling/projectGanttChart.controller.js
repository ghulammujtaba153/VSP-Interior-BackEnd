import db from "../../../models/index.js";
const { ProjectGanttChart } = db;
import { Op } from "sequelize";



export const createGanttChart = async (req, res) => {
    try {
        const projectGanttChart = await ProjectGanttChart.create(req.body);
        res.status(201).json({ message: "Gantt chart created successfully", chart: projectGanttChart });
    } catch (error) {
        res.status(500).json({ message: "Error creating gantt chart", error: error.message });
    }
}


export const getGanttChartByJob = async (req, res) => {
    try {
        const { projectSetupJobId } = req.params;
        const chart = await ProjectGanttChart.findAll({ where: { projectSetupJobId } });
        res.status(200).json({ chart });
    } catch (error) {
        res.status(500).json({ message: "Error getting gantt chart", error: error.message });
    }
}


export const updateGanttChart = async (req, res) => {
    try {
        const { id } = req.params;
        const chart = await ProjectGanttChart.findByPk(id);
        if (!chart) {
            return res.status(404).json({ message: "Gantt chart not found" });
        }
        await chart.update(req.body);
        res.status(200).json({ message: "Gantt chart updated successfully", chart: chart });
    } catch (error) {
        res.status(500).json({ message: "Error updating gantt chart", error: error.message });
    }
}


export const deleteGanttChart = async (req, res) => {
    try {
        const { id } = req.params;
        const chart = await ProjectGanttChart.findByPk(id);
        if (!chart) {
            return res.status(404).json({ message: "Gantt chart not found" });
        }
        await chart.destroy();
        res.status(200).json({ message: "Gantt chart deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting gantt chart", error: error.message });
    }
}