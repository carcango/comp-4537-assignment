// user.js
const Sequelize = require("sequelize");
const sequelize = require("./db");
const bcrypt = require("bcrypt");
const INITIAL_API_COUNTER = 0;
const SALT_ROUNDS = 10;
const User = sequelize.define("User", {
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  apiCallCounter: {
    type: Sequelize.INTEGER,
    defaultValue: INITIAL_API_COUNTER,
  },
  isAdmin: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
});
// Creating a user is asynchronous because hashing can be slow
User.createUser = async function (userData) {
  const { email, password } = userData;
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    throw new Error("Email is already registered");
  }
  if (!password) {
    throw new Error("Password is required");
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return await User.create({ email, password: hashedPassword });
};

module.exports = User;
