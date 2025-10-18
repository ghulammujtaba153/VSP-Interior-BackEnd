import db from '../../models/index.js';
import { Sequelize, Op } from "sequelize";
const { Notice } = db;


import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn’t exist
const uploadDir = path.resolve("uploads/notices");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter (only PDFs)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

export const upload = multer({ storage, fileFilter });


export const createNotice = async (req, res) => {
  try {
    // defensive: req.body may be undefined if parsing failed
    const { title = "", content = "", status = "active" } = req.body || {};

    let fileUrl = null;
    if (req.file) {
      // keep leading slash for static route consistency
      fileUrl = `/uploads/notices/${req.file.filename}`;
    }

    const notice = await Notice.create({
      title,
      content,
      status: status || "active",
      fileUrl,
    });

    res.status(201).json({
      message: "Notice created successfully",
      data: notice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get all notices
export const getNotices = async (req, res) => {
  const { status } = req.query;
  const whereClause = {};
  if (status) {
    whereClause.status = status;
  }

  try {
    const notices = await Notice.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single notice
export const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findByPk(req.params.id);
    if (!notice) return res.status(404).json({ error: "Notice not found" });
    res.status(200).json(notice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    // defensive
    const { title = "", content = "", status = "active" } = req.body || {};

    const notice = await Notice.findByPk(id);
    if (!notice) {
      return res.status(404).json({ error: "Notice not found" });
    }

    let fileUrl = notice.fileUrl;

    // if a new file is uploaded
    if (req.file) {
      // delete old file if exists (resolve to actual path)
      if (fileUrl) {
        const oldPath = path.resolve("." + (fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // store new file path with leading slash
      fileUrl = `/uploads/notices/${req.file.filename}`;
    }

    // update fields
    await notice.update({
      title,
      content,
      status,
      fileUrl,
    });

    res.status(200).json({
      message: "Notice updated successfully",
      notice,
    });
  } catch (error) {
    console.error("Error updating notice:", error);
    res.status(500).json({ error: error.message });
  }
};


// Delete notice
export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByPk(req.params.id);
    if (!notice) return res.status(404).json({ error: "Notice not found" });

    // delete file if exists
    if (notice.fileUrl) {
      const filePath = path.resolve("." + notice.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await notice.destroy();
    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
