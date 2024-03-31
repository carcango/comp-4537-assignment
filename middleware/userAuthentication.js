const jwt = require('jsonwebtoken')
const { User } = require('../models/user')
const { RESPONSE_CODES, RESPONSE_MSG } = require('../constants')

const authenticateToken = async (req, res, next) => {
  // Extract token from request; if token is missing, return 401, else verify token
  const token = req.cookies.token
  if (token == null) {
    return res.status(RESPONSE_CODES.UNAUTHORIZED_401).send(RESPONSE_MSG.UNAUTHORIZED_401)
  }

  try {
    /* Decode the extracted token using the secret key; if the token is invalid
    or expired, it will throw an error, which we handle in the catch block. If the
    token is valid, it contains the user's email, used for authentication. */
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    const user = await User.findONe({
      where: {
        email: decodedToken.userEmail
      }
    })

    // If no user is found, then they are not registered and are thus unathorized.
    if (!user) {
      return res.status(RESPONSE_CODES.UNAUTHORIZED_401).send(RESPONSE_MSG.UNAUTHORIZED_401)
    }

    // If the user is found, we attach the user object to the request and continue.
    req.user = user
    next()
  } catch (error) {
    // The token is either invalid or expired, and thus the request is forbidden.
    return res.status(RESPONSE_CODES.FORBIDDEN_403).send(RESPONSE_MSG.FORBIDDEN_403)
  }
}

module.exports = { authenticateToken }
