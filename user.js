const Sequelize = require('sequelize')
const sequelize = require('./db')
const bcrypt = require('bcrypt')

// Constants for user model
const API_START_COUNT = 0
const HASHING_ROUNDS = 10

const User = sequelize.define('User', {
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  apiCallCounter: {
    type: Sequelize.INTEGER,
    defaultValue: API_START_COUNT
  },
  isAdmin: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
})

// Creating a user is asynchronous because hashing can be slow
User.createUser = async function (userData) {
  const { email, password } = userData

  // Check if the user already exists
  const existingUser = await User.findOne({ where: { email } })
  if (existingUser) {
    throw new Error('Email is already registered')
  }

  // Ensure password is provided
  if (!password) {
    throw new Error('Password is required')
  }

  // Hash password before saving it to the database
  const hashedPassword = await bcrypt.hash(password, HASHING_ROUNDS)
  return User.create({ email, password: hashedPassword })
}

module.exports = User
