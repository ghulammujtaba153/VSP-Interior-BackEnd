import db from '../models/index.js'

const [rows] = await db.sequelize.query(`
  SELECT indexname, indexdef FROM pg_indexes
  WHERE tablename = 'priceBooks' ORDER BY indexname
`)
console.log(rows)
await db.sequelize.close()
