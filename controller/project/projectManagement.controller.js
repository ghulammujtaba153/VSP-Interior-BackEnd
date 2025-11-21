// import db from "../../models/index.js";
// const { ProjectManagement } = db;

// // Create Project Management Task
// export const createProjectManagement = async (req, res) => {
//   try {
//     const project = await ProjectManagement.create(req.body);
//     res
//       .status(201)
//       .json({ message: "Project Management task created successfully", project });
//   } catch (error) {
//     res.status(500).json({ message: "Something went wrong", error: error.message });
//   }
// };

// // Get All Project Management Tasks by Project ID
// export const getProjectManagements = async (req, res) => {
//   try {
//     const projects = await ProjectManagement.findAll({
//       where: { projectId: req.params.id },
//     });
//     res.status(200).json(projects);
//   } catch (error) {
//     res.status(500).json({ message: "Something went wrong", error: error.message });
//   }
// };

// // Update Project Management Task
// export const updateProjectManagement = async (req, res) => {
//   try {
//     const project = await ProjectManagement.findByPk(req.params.id);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }
//     await project.update(req.body);
//     res
//       .status(200)
//       .json({ message: "Project Management task updated successfully", project });
//   } catch (error) {
//     res.status(500).json({ message: "Something went wrong", error: error.message });
//   }
// };

// // Delete Project Management Task
// export const deleteProjectManagement = async (req, res) => {
//   try {
//     const project = await ProjectManagement.findByPk(req.params.id);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }
//     await project.destroy();
//     res
//       .status(200)
//       .json({ message: "Project Management task deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Something went wrong", error: error.message });
//   }
// };
