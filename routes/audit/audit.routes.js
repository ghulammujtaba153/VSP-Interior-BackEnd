import express from "express"
import { getAudit } from "../../controller/audit/audit.controller.js"
import { authMiddleware } from "../../middleware/authMiddleware.js"


const auditRouter = express.Router()


auditRouter.get("/get", authMiddleware, getAudit)


export default auditRouter