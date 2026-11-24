// server/index.js
import express from 'express';
import cors from 'cors';

import client from './config/database.js';
import router from './routes/index.js';
import uploadsRouter from './routes/uploads.routes.js';
import dotenv from 'dotenv';
import db from './models/index.js';
import { seedDefaultLeavePolicies } from './service/leaveBalanceService.js';
import { logDatabaseTarget } from './config/dbConfig.js';
import { runHrSchemaPatches, runPricebookSchemaPatches, runProjectCatalogSchemaPatches } from './scripts/hrSchemaPatches.js';
// import "./jobs/thresholdChecker.js"
import path from "path";

dotenv.config();

// test

const app = express();

// CORS first so error responses (e.g. 413) still include ACAO headers
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://demo-vps-interior-front-end-ten.vercel.app",
      "https://vps-interior-front-end-ten.vercel.app",
      "https://dev.myvsp.co.nz",
      "https://myvsp.co.nz",
      "https://www.myvsp.co.nz",
    ],
    credentials: true,
  })
);

// Default 100kb is too small for pricebook import batches (~500 rows)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));



app.use("/uploads", (req, res, next) => {
  const p = req.path || '';
  if (p.startsWith('/employee-documents/') || p.startsWith('/notices/')) {
    return res.status(403).json({
      success: false,
      message: 'Use /api/uploads/secure for HR files',
    });
  }
  next();
});
app.use("/uploads", express.static("uploads"));
app.use('/api/uploads/secure', uploadsRouter);
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));




// Routes
app.use('/api', router);

// Start server
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Welcome to the VPS Interior API");
});

db.sequelize
  .authenticate()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
  })
  .then(() => db.sequelize.sync({ alter: false }))
  .then(() => runHrSchemaPatches(db.sequelize))
  .then(() => runPricebookSchemaPatches(db.sequelize))
  .then(() => runProjectCatalogSchemaPatches(db.sequelize))
  .then(() => db.sequelize.sync({ alter: process.env.NODE_ENV !== 'production' }))
  .then(async () => {
    await seedDefaultLeavePolicies();
    logDatabaseTarget();
    console.log('✅ Database synced with Supabase');
  })
  .catch((err) => {
    console.error('❌ Database sync failed:', err);
  });
