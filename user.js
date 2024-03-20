const isEmail = require('validator').isEmail
const hash = require('bcrypt').hash

const INITIAL_API_COUNTER = 0
const SALT_ROUNDS = 10

class User {
  constructor (email, password) {
    this.email = email
    this.password = password
    this.api_counter = INITIAL_API_COUNTER
  }

  // Creating a user is asycnhronous because hashing can be slow
  static async create (email, password) {
    if (email == null || password == null) {
      throw new Error('Email and password are required')
    }

    if (!User.isValidEmail(email)) {
      throw new Error('Email is invalid')
    }

    // TODO: Check if user email already registered

    // Await hashing because it can be slow
    const hashedPassword = await User.hashPassword(password)
    return new User(email, hashedPassword)
  }

  // Async because hashing can be slow
  static async hashPassword (password) {
    return await hash(password, SALT_ROUNDS)
  }

  static isValidEmail (email) {
    return isEmail(email)
  }
}

module.exports = User
