import dotenv from 'dotenv'
import pg from 'pg'
import { getPgClientConfig, logDatabaseTarget } from '../config/dbConfig.js'

dotenv.config()

logDatabaseTarget()

const client = new pg.Client(getPgClientConfig())

try {
  await client.connect()
  console.log('✅ Database connection successful')
  await client.end()
  process.exit(0)
} catch (err) {
  console.error('❌ Database connection failed:', err.message)
  console.error(
    '\nTips:\n' +
      '  1. Copy the exact password from Supabase → Project Settings → Database\n' +
      '  2. DB password is NOT the same as SUPABASE_API_KEY (sb_publishable_...)\n' +
      '  3. Try direct connection: DB_HOST=db.xpybizonagebmgnmqyrm.supabase.co, DB_USER=postgres\n' +
      '  4. Or reset the database password in Supabase and update DB_PASSWORD in .env'
  )
  process.exit(1)
}
