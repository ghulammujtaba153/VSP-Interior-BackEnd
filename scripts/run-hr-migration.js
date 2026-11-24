import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '../migrations/001_hr_upgrade.sql')

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

async function run() {
  const sql = fs.readFileSync(sqlPath, 'utf8')
  await client.connect()
  await client.query(sql)
  await client.end()
  console.log('HR migration applied successfully')
}

run().catch((err) => {
  console.error('HR migration failed:', err)
  process.exit(1)
})
