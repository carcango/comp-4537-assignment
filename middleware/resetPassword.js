const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { RESPONSE_CODES, RESPONSE_MSG } = require('../constants')

exports.resetPassword = async (req, res) => {
  const { token } = req.params
  const { newPassword } = req.body

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY)
    const userEmail = decoded.email

    // Find the user by email
    const user = await User.findOne({ where: { email: userEmail } })
    if (!user) {
      return res.status(RESPONSE_CODES.NOT_FOUND_404).send(RESPONSE_MSG.NOT_FOUND_404)
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update the user's password
    await user.update({ password: hashedPassword })

    res.send(RESPONSE_MSG.SUCCESS_200)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(RESPONSE_CODES.UNAUTHORIZED_401).send(RESPONSE_MSG.EXPIRED_TOKEN_401)
    }
    // Handle other possible errors (e.g., token invalid, database errors)
    console.error('Reset Password Error: ', error)
    res.status(RESPONSE_CODES.SERVER_ERROR_500).send(RESPONSE_MSG.SERVER_ERROR_500)
  }
}
