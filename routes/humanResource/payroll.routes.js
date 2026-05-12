import express from "express";
import {
  getAllPayroll,
  createPayroll,
  updatePayroll,
  deletePayroll,
} from "../../controller/humanResource/payroll.controller.js";

const router = express.Router();

router.get("/get", getAllPayroll);
router.post("/create", createPayroll);
router.put("/update/:id", updatePayroll);
router.delete("/delete/:id", deletePayroll);

export default router;
