import db from "../../models/index.js";

const { ProjectVariation, ProjectSetup, Clients } = db;

export const createProjectVariation = async (req, res) => {
    try {
        const projectVariation = await ProjectVariation.create(req.body);
        res.status(200).json(projectVariation);
    } catch (error) {
        res.status(500).json(error);
    }
}


export const getAllProjectVariation = async (req, res) => {
    try {
        const projectVariation = await ProjectVariation.findAll();
        res.status(200).json(projectVariation);
    } catch (error) {
        res.status(500).json(error);
    }
}


export const getProjectVariationById = async (req, res) => {
  try {
    const projectVariation = await ProjectVariation.findAll({
      where: { projectId: req.params.id },
      include: [
        {
          model: ProjectSetup,
          as: "project",
          include: [
            {
              model: Clients,
              as: "client", 
            },
          ],
        },
      ],
    });

    if (!projectVariation) {
      return res.status(404).json({ message: "Project Variation not found" });
    }

    res.status(200).json(projectVariation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};


export const updateProjectVariation = async (req, res) => {
    try {
        const projectVariation = await ProjectVariation.update(req.body, { where: { id: req.params.id } });
        res.status(200).json(projectVariation);
    } catch (error) {
        res.status(500).json(error);
    }
}


export const deleteProjectVariation = async (req, res) => {
    try {
        const projectVariation = await ProjectVariation.destroy({ where: { id: req.params.id } });
        res.status(200).json(projectVariation);
    } catch (error) {
        res.status(500).json(error);
    }
}