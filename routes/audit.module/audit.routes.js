import express from "express"
import { getAudit } from "../../controller/audit/audit.controller.js"


const auditRouter = express.Router()


auditRouter.get("/get", getAudit)


export default auditRouter