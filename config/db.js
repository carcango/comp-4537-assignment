// db.js
const Sequelize = require('sequelize')

const sequelize = new Sequelize(
  process.env.POSTGRES_DATABASE,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST,
    dialect: 'postgres',
    port: process.env.POSTGRES_PORT,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    }
  }
)

module.exports = sequelize
