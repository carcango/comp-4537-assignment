const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user') // Adjust the path as needed
const {
  RESPONSE_CODES,
  RESPONSE_MSG,
  MAX_TOKEN_AGE_IN_MS
} = require('../constants') // Adjust the path as needed

exports.userRegistration = async (req, res) => {
  try {
  // Check payload for email, password; ensure they exist
    if (req.body.email == null || req.body.password == null) {
      return res
        .status(RESPONSE_CODES.BAD_REQUEST_400)
        .send(RESPONSE_MSG.MISSING_INFO_400)
    }

    // If email and password are provided, then check if user already exists
    const existingUser = await User.findOne({ where: { email: req.body.email } })
    if (existingUser) {
      return res
        .status(RESPONSE_CODES.CONFLICT_409)
        .send(RESPONSE_MSG.ALREADY_EXISTS_409)
    }

    /* If user does not already exist, then create a new user;
    (password hashing is handled by `user` object) */
    await User.createUser({
      email: req.body.email,
      password: req.body.password
    })

    // Notify user that registration was successful
    res
      .status(RESPONSE_CODES.CREATED_USER_201)
      .send(RESPONSE_MSG.SUCCESSFULLY_REGISTERED_201)
  } catch (error) {
    console.error('Error creating user! ' + error)
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500)
  }
}

exports.userLogin = async (req, res) => {
  try {
    // Check that user is registered
    const existingUser = await User.findOne({
      where: { email: req.body.email }
    })

    // If user is not found, return an error
    if (!existingUser) {
      return res
        .status(RESPONSE_CODES.NOT_FOUND_404)
        .send(RESPONSE_MSG.NOT_FOUND_404)
    }

    /* If user is found, check that password is valid by
    comparing the provided password with the hashed password */
    const isValidPassword = await bcrypt.compare(req.body.password, existingUser.password)
    if (!isValidPassword) {
      return res
        .status(RESPONSE_CODES.UNAUTHORIZED_401)
        .send(RESPONSE_MSG.UNAUTHORIZED_401)
    }

    // If password is valid, create a token and send it to user via cookie
    const token = jwt.sign(
      { userEmail: existingUser.email },
      process.env.SECRET_KEY,
      { expiresIn: MAX_TOKEN_AGE_IN_MS })

    res.cookie('token', token,
      {
        httpOnly: true,
        secure: true,
        maxAge: MAX_TOKEN_AGE_IN_MS,
        sameSite: 'none'
      })

    // Notify user that login was successful
    res
      .status(RESPONSE_CODES.OK_200)
      .send(RESPONSE_MSG.OK_200)
  } catch (error) {
    console.error('Error logging in user! ' + error)
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500)
  }
}
