import dotenv from 'dotenv'

dotenv.config()

/**
 * Build Postgres connection config from env.
 * Prefer discrete DB_* vars when set — avoids URL-encoding issues with special
 * characters in passwords (e.g. @, !, #).
 */
export function getDatabaseConfig() {
  const trim = (v) => {
    if (typeof v !== 'string') return v
    let s = v.trim()
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      s = s.slice(1, -1)
    }
    return s
  }

  const DATABASE_URL = trim(process.env.DATABASE_URL)
  const DB_HOST = trim(process.env.DB_HOST)
  const DB_PORT = trim(process.env.DB_PORT)
  const DB_USER = trim(process.env.DB_USER)
  const DB_PASSWORD = trim(process.env.DB_PASSWORD)
  const DB_NAME = trim(process.env.DB_NAME)

  const ssl = {
    require: true,
    rejectUnauthorized: false,
  }

  // Discrete vars (password can contain @, !, etc. without encoding)
  if (DB_HOST && DB_USER && DB_PASSWORD && DB_NAME) {
    return {
      dialect: 'postgres',
      host: DB_HOST,
      port: Number(DB_PORT) || 5432,
      username: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      dialectOptions: { ssl },
      logging: false,
    }
  }

  if (!DATABASE_URL) {
    throw new Error(
      'Database not configured. Set DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in .env'
    )
  }

  return {
    dialect: 'postgres',
    dialectOptions: { ssl },
    logging: false,
    // Sequelize accepts connection string as first constructor arg; return url separately
    url: DATABASE_URL,
  }
}

export function createSequelize(Sequelize) {
  const config = getDatabaseConfig()

  if (config.url) {
    return new Sequelize(config.url, {
      dialect: config.dialect,
      dialectOptions: config.dialectOptions,
      logging: config.logging,
    })
  }

  return new Sequelize(config.database, config.username, config.password, config)
}

export function getPgClientConfig() {
  const config = getDatabaseConfig()

  if (config.url) {
    return {
      connectionString: config.url,
      ssl: { rejectUnauthorized: false },
    }
  }

  return {
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    ssl: { rejectUnauthorized: false },
  }
}

/** Log connection target (never logs password). */
export function logDatabaseTarget() {
  const config = getDatabaseConfig()
  if (config.url) {
    console.log('📦 Database: using DATABASE_URL')
    return
  }
  console.log(
    `📦 Database: ${config.username}@${config.host}:${config.port}/${config.database}`
  )
}
