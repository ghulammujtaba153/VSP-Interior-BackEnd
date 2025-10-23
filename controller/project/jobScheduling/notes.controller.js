import fs from "fs";
import path from "path";
import multer from "multer";
import db from "../../../models/index.js";
const { Notes } = db;

// ensure upload dir
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads/notes");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

export const uploadNotes = multer({ storage });

// helper to build file metadata
const toFileMeta = (file) => ({
  name: file.originalname,
  filename: file.filename,
  url: `/uploads/notes/${file.filename}`,
  size: file.size,
  mime: file.mimetype,
});

// Create note (multipart/form-data, files field = "files")
export const createNote = async (req, res) => {
  try {
    const { projectSetupJobId, title, description, workerId } = req.body;

    console.log("createNote - Received data:", {
      projectSetupJobId,
      title,
      description,
      workerId,
      projectSetupJobIdType: typeof projectSetupJobId
    });

    if (!projectSetupJobId || !title) {
      return res.status(400).json({ error: "projectSetupJobId and title are required" });
    }

    // Validate that projectSetupJobId is a valid number
    const projectId = Number(projectSetupJobId);
    if (isNaN(projectId)) {
      return res.status(400).json({ 
        error: "Invalid projectSetupJobId: must be a valid number",
        received: projectSetupJobId,
        type: typeof projectSetupJobId
      });
    }

    const filesMeta = (req.files || []).map(toFileMeta);

    const newNote = await Notes.create({
      projectSetupJobId: projectId,
      workerId: workerId ? Number(workerId) : null,
      title,
      description,
      files: filesMeta,
    });

    res.status(201).json(newNote);
  } catch (error) {
    console.error("createNote error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get notes for a job
export const getNotes = async (req, res) => {
  try {
    const notes = await Notes.findAll({ where: { projectSetupJobId: req.params.projectId }, order: [["createdAt","DESC"]] });
    res.status(200).json(notes);
  } catch (error) {
    console.error("getNotes error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update note (allows uploading new files and removing old ones)
// Accepts multipart/form-data: new files in "files"; optional body.removeFilenames = JSON string array of filenames to remove
export const updateNote = async (req, res) => {
  try {
    const id = req.params.id;
    const note = await Notes.findByPk(id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const { title, description, workerId } = req.body;

    // remove specified files from disk and from note.files
    let existingFiles = Array.isArray(note.files) ? [...note.files] : [];
    if (req.body.removeFilenames) {
      const removeFilenames = JSON.parse(req.body.removeFilenames || "[]");
      existingFiles = existingFiles.filter((f) => {
        if (removeFilenames.includes(f.filename)) {
          const fpath = path.join(UPLOAD_DIR, f.filename);
          if (fs.existsSync(fpath)) {
            try { fs.unlinkSync(fpath); } catch (e) { console.warn("Failed delete file", fpath, e); }
          }
          return false;
        }
        return true;
      });
    }

    // append newly uploaded files
    const newFilesMeta = (req.files || []).map(toFileMeta);
    const updatedFiles = [...existingFiles, ...newFilesMeta];

    await note.update({
      title: title ?? note.title,
      description: description ?? note.description,
      workerId: workerId ? Number(workerId) : note.workerId,
      files: updatedFiles,
    });

    res.status(200).json(note);
  } catch (error) {
    console.error("updateNote error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete note and its files
export const deleteNote = async (req, res) => {
  try {
    const note = await Notes.findByPk(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    // delete files from disk
    const existingFiles = Array.isArray(note.files) ? note.files : [];
    existingFiles.forEach((f) => {
      const fpath = path.join(UPLOAD_DIR, f.filename || "");
      if (fs.existsSync(fpath)) {
        try { fs.unlinkSync(fpath); } catch (e) { console.warn("Failed delete file", fpath, e); }
      }
    });

    await note.destroy();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("deleteNote error:", error);
    res.status(500).json({ error: error.message });
  }
};