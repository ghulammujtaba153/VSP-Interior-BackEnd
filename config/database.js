// db.js
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Needed for Supabase SSL
  },
})

client.connect()
  .then(() => console.log('✅ Connected to Supabase PostgreSQL'))
  .catch(err => console.error('❌ Connection error:', err))

export default client
