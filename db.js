// db.js
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  "comp4537_assignment",
  "assignment_user",
  "j8#^&4DmHFCuK!CX",
  {
    host: "comp-4537-4392.g95.gcp-us-west2.cockroachlabs.cloud",
    dialect: "postgres",
    port: 26257,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }
);

module.exports = sequelize;
