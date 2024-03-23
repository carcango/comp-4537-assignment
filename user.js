// user.js
const Sequelize = require('sequelize')
const sequelize = require('./db')
const bcrypt = require('bcrypt')
const INITIAL_API_COUNTER = 0
const SALT_ROUNDS = 10
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
    defaultValue: INITIAL_API_COUNTER
  }
})
// Creating a user is asynchronous because hashing can be slow
User.createUser = async function (userData) {
  const { email, password } = userData
  console.log(email)
  console.log(password)
  // Check if user email already registered
  console.log('Checking if user exists in User.createUser on line 33')
  const existingUser = await User.findOne({
    where: {
      email
    }
  })
  if (existingUser) {
    throw new Error('Email is already registered')
  }
  // Check if password is provided
  if (!password) {
    throw new Error('Password is required')
  }
  // Await hashing because it can be slow
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  console.log('Creating user in User.createUser on line 49')
  return await User.create({ email, password: hashedPassword })
}
module.exports = User
