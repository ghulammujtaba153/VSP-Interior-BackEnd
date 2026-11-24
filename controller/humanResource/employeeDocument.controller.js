import fs from "fs"
import path from "path"
import multer from "multer"
import db from '../../models/index.js';
import { Op } from "sequelize";
import { isHrAdmin } from '../../utils/permissionUtils.js';
import { logHrAudit } from '../../service/hrAuditService.js';

const { User, EmployeeDocumentRequest, EmployeeDocuments } = db;

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

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only PDF and image files are allowed'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
})

const assertRequestAccess = (req, request) => {
  if (!request) return false
  if (isHrAdmin(req.authUser)) return true
  return Number(request.employeeId) === req.authUser.id
}

const pickRequestFields = (body) => {
  const allowed = ['employeeId', 'documentType', 'documentName', 'reason']
  const payload = {}
  for (const key of allowed) {
    if (body[key] !== undefined) payload[key] = body[key]
  }
  if (payload.employeeId !== undefined) {
    payload.employeeId = parseInt(payload.employeeId, 10)
  }
  return payload
}

const requestInclude = [
  { model: EmployeeDocuments, as: 'documents' },
  { model: User, as: 'employee', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'requestedBy', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'reviewedBy', attributes: ['id', 'name', 'email'] },
]

const UPLOADABLE_STATUSES = new Set(['pending', 'rejected'])

export const uploadEmployeeDocument = async (req, res) => {
  try {
    const file = req.file
    const { employeeId, requestId } = req.body || {}

    if (!employeeId) return res.status(400).json({ error: "employeeId is required" })
    if (!requestId) return res.status(400).json({ error: "requestId is required" })
    if (!file) return res.status(400).json({ error: "file is required" })

    const request = await EmployeeDocumentRequest.findByPk(requestId)
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (!assertRequestAccess(req, request)) {
      return res.status(403).json({ error: 'Access denied' })
    }
    if (Number(employeeId) !== Number(request.employeeId)) {
      return res.status(400).json({ error: 'employeeId does not match request' })
    }
    if (!UPLOADABLE_STATUSES.has(request.status)) {
      return res.status(400).json({
        error: `Cannot upload while request status is "${request.status}". Wait for HR review or contact HR.`,
      })
    }

    const documentId = `doc-${Date.now()}`
    const documentUrl = `/uploads/employee-documents/${file.filename}`

    const employeeDocument = await EmployeeDocuments.create({
      employeeId: parseInt(employeeId, 10),
      requestId: parseInt(requestId, 10),
      documentId,
      documentUrl,
      status: 'uploaded',
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    })

    const oldData = request.get()
    await request.update({
      status: 'uploaded',
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
    })

    await logHrAudit({
      userId: req.authUser.id,
      action: 'upload',
      tableName: 'employee_document_requests',
      oldData,
      newData: { requestId: request.id, documentId: employeeDocument.id, status: 'uploaded' },
    })

    return res.status(200).json(employeeDocument)
  } catch (error) {
    console.error("uploadEmployeeDocument error:", error)
    return res.status(500).json({ error: error.message })
  }
}

export const createEmployeeDocumentRequest = async (req, res) => {
    try {
        if (!isHrAdmin(req.authUser)) {
          return res.status(403).json({ error: 'Only HR administrators can create document requests' });
        }

        const payload = pickRequestFields(req.body)
        if (!payload.employeeId) {
          return res.status(400).json({ error: 'employeeId is required' });
        }
        if (!payload.documentType?.trim()) {
          return res.status(400).json({ error: 'documentType is required' });
        }
        if (!payload.documentName?.trim()) {
          return res.status(400).json({ error: 'documentName is required' });
        }
        payload.status = 'pending'
        payload.requestedById = req.authUser.id

        const employeeDocumentRequest = await EmployeeDocumentRequest.create(payload);

        await logHrAudit({
          userId: req.authUser.id,
          action: 'create',
          tableName: 'employee_document_requests',
          newData: employeeDocumentRequest.get(),
        })

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
        { model: EmployeeDocuments, as: "documents" },
        { model: User, as: "employee" },
      ],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      data: rows,
      pagination: {
        totalRows: count,
        totalPages: Math.ceil(count / limit),
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
        const employeeRequest = await EmployeeDocumentRequest.findByPk(req.params.id, {
            include: [{ model: EmployeeDocuments, as: 'documents' }],
        });
        if (!employeeRequest) {
            return res.status(404).json({ error: 'Employee Document Request not found' });
        }
        if (!assertRequestAccess(req, employeeRequest)) {
          return res.status(403).json({ error: 'Access denied' });
        }
        res.status(200).json(employeeRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getEmployeeDocumentRequestsByEmployeeId = async (req, res) => {
    try {
        const employeeId = Number(req.params.employeeId)
        if (!isHrAdmin(req.authUser) && req.authUser.id !== employeeId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100)
        const offset = (page - 1) * limit
        const search = req.query.search || req.query.Search || ''

        const where = { employeeId }
        if (search?.trim()) {
          where[Op.or] = [
            { documentType: { [Op.iLike]: `%${search}%` } },
            { documentName: { [Op.iLike]: `%${search}%` } },
            { status: { [Op.iLike]: `%${search}%` } },
          ]
        }

        const { count, rows } = await EmployeeDocumentRequest.findAndCountAll({
            where,
            include: requestInclude,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        })

        const allRows = await EmployeeDocumentRequest.findAll({ where: { employeeId } })
        const summary = {
          total: allRows.length,
          pending: allRows.filter((r) => r.status === 'pending').length,
          awaitingReview: allRows.filter((r) => r.status === 'uploaded').length,
          approved: allRows.filter((r) => r.status === 'approved').length,
          rejected: allRows.filter((r) => r.status === 'rejected').length,
        }

        res.status(200).json({
          data: rows,
          total: count,
          page,
          limit,
          summary,
        });
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
        if (!isHrAdmin(req.authUser)) {
          return res.status(403).json({ error: 'Only HR administrators can edit document requests' });
        }
        if (!['pending', 'rejected'].includes(employeeRequest.status)) {
          return res.status(400).json({
            error: 'Only pending or rejected requests can be edited. Use review actions for uploaded documents.',
          });
        }

        const oldData = employeeRequest.get()
        const payload = pickRequestFields(req.body)
        await employeeRequest.update(payload);

        await logHrAudit({
          userId: req.authUser.id,
          action: 'update',
          tableName: 'employee_document_requests',
          oldData,
          newData: employeeRequest.get(),
        })

        res.status(200).json(employeeRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const updateEmployeeDocumentRequestStatus = async (req, res) => {
    try {
        if (!isHrAdmin(req.authUser)) {
          return res.status(403).json({ error: 'Only HR administrators can review documents' });
        }

        const employeeRequest = await EmployeeDocumentRequest.findByPk(req.params.id);
        if (!employeeRequest) {
            return res.status(404).json({ error: 'Employee Document Request not found' });
        }

        const { status, rejectionReason } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
          return res.status(400).json({ error: 'Status must be approved or rejected' });
        }
        if (employeeRequest.status !== 'uploaded') {
          return res.status(400).json({
            error: 'Only uploaded documents awaiting review can be approved or rejected',
          });
        }
        if (status === 'rejected' && !rejectionReason?.trim()) {
          return res.status(400).json({ error: 'rejectionReason is required when rejecting' });
        }

        const oldData = employeeRequest.get()
        const updates = {
          status,
          reviewedById: req.authUser.id,
          reviewedAt: new Date(),
          rejectionReason: status === 'rejected' ? rejectionReason.trim() : null,
        }
        await employeeRequest.update(updates);

        const employeeDocuments = await EmployeeDocuments.findAll({
          where: { requestId: req.params.id },
        });
        for (const doc of employeeDocuments) {
          await doc.update({ status });
        }

        await logHrAudit({
          userId: req.authUser.id,
          action: status === 'approved' ? 'approve' : 'reject',
          tableName: 'employee_document_requests',
          oldData,
          newData: employeeRequest.get(),
        })

        res.status(200).json(employeeRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const deleteEmployeeDocumentRequest = async (req, res) => {
    try {
        const employeeRequest = await EmployeeDocumentRequest.findByPk(req.params.id, {
          include: [{ model: EmployeeDocuments, as: 'documents' }],
        });
        if (!employeeRequest) {
            return res.status(404).json({ error: 'Employee Document Request not found' });
        }
        if (!isHrAdmin(req.authUser)) {
          return res.status(403).json({ error: 'Only HR administrators can delete document requests' });
        }
        if (employeeRequest.status === 'approved') {
          return res.status(400).json({ error: 'Approved document requests cannot be deleted' });
        }

        const oldData = employeeRequest.get()

        const docs = employeeRequest.documents || await EmployeeDocuments.findAll({ where: { requestId: req.params.id } });
        for (const doc of docs) {
          if (doc.documentUrl) {
            const filePath = path.join(process.cwd(), doc.documentUrl.replace(/^\//, ''));
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
          await doc.destroy();
        }

        await employeeRequest.destroy();

        await logHrAudit({
          userId: req.authUser.id,
          action: 'delete',
          tableName: 'employee_document_requests',
          oldData,
        })

        res.status(200).json({ message: 'Employee Document Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
