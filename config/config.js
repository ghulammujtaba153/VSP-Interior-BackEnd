
import dotenv from 'dotenv';
dotenv.config();

const { DATABASE_URL } = process.env;

export default {
  development: {
    use_env_variable: 'DATABASE_URL',
    url: DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
        rejectUnauthorized: false, // important for Supabase SSL
      },
    },
  },
  test: {
    use_env_variable: 'DATABASE_URL',
    url: DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    url: DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
