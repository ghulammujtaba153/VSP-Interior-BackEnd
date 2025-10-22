// server/index.js
import express from 'express';
import cors from 'cors';

import client from './config/database.js';
import router from './routes/index.js';
import dotenv from 'dotenv';
import db from './models/index.js';
// import "./jobs/thresholdChecker.js"
import path from "path";

dotenv.config();


const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://demo-vps-interior-front-end-ten.vercel.app",
      "https://vps-interior-front-end-ten.vercel.app",
    ],
    credentials: true,
  })
);


app.use("/uploads", express.static("uploads"));
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));





// Routes
app.use('/api', router);

// Start server
const PORT = process.env.PORT || 5000;


db.sequelize
  .sync({ alter: true }) // or force: true to drop & recreate
  .then(() => {
    console.log('✅ Database synced with Supabase');
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database sync failed:', err);
  });
