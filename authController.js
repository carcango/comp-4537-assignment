const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user') // Adjust the path as needed
const {
  RESPONSE_CODES,
  RESPONSE_MSG,
  SECRET_KEY,
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
    password hashing is handled by `user` */
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
//

app.post('/users', async (req, res) => {
  try {
    // Check payload for email, password; ensure they exist
    if (req.body.email == null || req.body.password == null) {
      return res
        .status(RESPONSE_CODES.BAD_REQUEST_400)
        .send(RESPONSE_MSG.MISSING_INFO_400)
    }
    // Check if user already exists
    if (
      await User.findOne({
        where: {
          email: req.body.email
        }
      })
    ) {
      return res
        .status(RESPONSE_CODES.CONFLICT_409)
        .send(RESPONSE_MSG.ALREADY_EXISTS_409)
    }

    const user = await User.createUser({
      email: req.body.email,
      password: req.body.password
    })

    // Create token; user email is the payload (used to identify user later on)
    const token = jwt.sign({ userEmail: user.email }, SECRET_KEY, {
      expiresIn: MAX_TOKEN_AGE_IN_MS
    })

    res
      .status(RESPONSE_CODES.CREATED_USER_201)
      .json({ token, message: RESPONSE_MSG.SUCCESSFULLY_REGISTERED_201 })
  } catch (error) {
    logError('users', 'Error creating user! ' + error)
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500)
  }
})

/// /////////////
// User Login ///
/// /////////////
app.post('/users/login', async (req, res) => {
  try {
    if (req.body.email == null || req.body.password == null) {
      return res
        .status(RESPONSE_CODES.BAD_REQUEST_400)
        .send(RESPONSE_MSG.MISSING_INFO_400)
    }

    const user = await User.findOne({
      where: {
        email: req.body.email
      }
    })

    if (user == null) {
      return res
        .status(RESPONSE_CODES.NOT_FOUND_404)
        .send(RESPONSE_MSG.NOT_FOUND_404)
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    )

    if (!isPasswordValid) {
      return res
        .status(RESPONSE_CODES.UNAUTHORIZED_401)
        .send(RESPONSE_MSG.UNAUTHORIZED_401)
    }

    // Create token; user email is the payload (used to identify user later on)
    const token = jwt.sign({ userEmail: user.email }, SECRET_KEY, { expiresIn: MAX_TOKEN_AGE_IN_MS })
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        maxAge: MAX_TOKEN_AGE_IN_MS
      })
      .status(RESPONSE_CODES.OK_200)
      .json({ message: RESPONSE_MSG.OK_200 })
  } catch (error) {
    logError('users/login', 'Error on user login! ' + error)
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500)
  }
})

app.get('/verify-token', authenticateToken, (req, res) => {
  res.status(200).send({ message: 'Token is valid' })
})
