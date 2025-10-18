import fs from "fs"
import path from "path"
import multer from "multer"
import db from '../../models/index.js';
import { Sequelize, Op } from "sequelize";
const { EmployeeTimeSheet, Audit, User, EmployeeDocumentRequest, EmployeeDocuments } = db;

// Multer storage for employee documents
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads/employee-documents")
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ""
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    cb(null, name)
  },
})

export const upload = multer({ storage })

// Upload employee document (expects multipart/form-data with field "file")
export const uploadEmployeeDocument = async (req, res) => {
  try {
    // multer populates req.file and req.body
    const file = req.file
    const {
      employeeId,
      requestId,
      documentId: incomingDocumentId,
      status: incomingStatus,
    } = req.body || {}

    // basic validation
    if (!employeeId) return res.status(400).json({ error: "employeeId is required" })
    if (!requestId) return res.status(400).json({ error: "requestId is required" })
    if (!file) return res.status(400).json({ error: "file is required" })

    // ensure documentId exists (model requires not null) - generate if not provided
    const documentId = incomingDocumentId || `doc-${Date.now()}`

    // file URL/path to store in DB (use leading slash to serve via static route)
    const documentUrl = `/uploads/employee-documents/${file.filename}`

    const status = incomingStatus || "uploaded"

    const employeeDocument = await EmployeeDocuments.create({
      employeeId: parseInt(employeeId, 10),
      requestId: parseInt(requestId, 10),
      documentId,
      documentUrl,
      status,
    })

    await EmployeeDocumentRequest.findByPk(requestId).then(async (request) => {
      if (request) {
        await request.update({ status: "uploaded" })
      }
    })

    return res.status(200).json(employeeDocument)
  } catch (error) {
    console.error("uploadEmployeeDocument error:", error)
    return res.status(500).json({ error: error.message })
  }
}


export const createEmployeeDocumentRequest = async (req, res) => {
    try {
        const employeeDocumentRequest = await EmployeeDocumentRequest.create(req.body);
        res.status(200).json(employeeDocumentRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const getEmployeeDocumentRequests = async (req, res) => {
  try {
    let { page = 1, limit = 10, Search } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const whereConditions = {};
    if (Search && Search.trim() !== "") {
      whereConditions[Op.or] = [
        { employeeId: { [Op.iLike]: `%${Search}%` } },
        { documentType: { [Op.iLike]: `%${Search}%` } },
        { status: { [Op.iLike]: `%${Search}%` } },
      ];
    }

    const { count, rows } = await EmployeeDocumentRequest.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: EmployeeDocuments,
          as: "documents",
        },
        {
          model: User,
          as: "employee",
        },
      ],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      data: rows,
      pagination: {
        totalRows: count,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching employee document requests:", error);
    res.status(500).json({ error: error.message });
  }
};

      

export const getEmployeeDocumentRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeRequest = await EmployeeDocumentRequest.findByPk(id, {
            include: [
                {
                    model: EmployeeDocuments,
                    as: 'documents',
                },
            ],
        });
        if (!employeeRequest) {
            return res.status(404).json({ error: 'Employee Document Request not found' });
        }
        res.status(200).json(employeeRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



export const getEmployeeDocumentRequestsByEmployeeId = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const employeeRequests = await EmployeeDocumentRequest.findAll({
            where: { employeeId },
            include: [
                {
                    model: EmployeeDocuments,
                    as: 'documents',
                },
            ],
        });
        res.status(200).json(employeeRequests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updateEmployeeDocumentRequest = async (req, res) => {
    try {
        const employeeRequest = await EmployeeDocumentRequest.findByPk(req.params.id);
        if (!employeeRequest) {
            return res.status(404).json({ error: 'Employee Document Request not found' });
        }
        await employeeRequest.update(req.body);
        res.status(200).json(employeeRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updateEmployeeDocumentRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const employeeRequest = await EmployeeDocumentRequest.findByPk(id);
        if (!employeeRequest) {
            return res.status(404).json({ error: 'Employee Document Request not found' });
        }
        const { status } = req.body;
        await employeeRequest.update({ status });
        const employeeDocuments = await EmployeeDocuments.findAll({
          where: { requestId: id }
        });
        for (let i = 0; i < employeeDocuments.length; i++) {
          await employeeDocuments[i].update({ status });
        }
        res.status(200).json(employeeRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}




export const deleteEmployeeDocumentRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeRequest = await EmployeeDocumentRequest.findByPk(id);
        if (!employeeRequest) {
            return res.status(404).json({ error: 'Employee Document Request not found' });
        }
        await employeeRequest.destroy();
        res.status(200).json({ message: 'Employee Document Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
