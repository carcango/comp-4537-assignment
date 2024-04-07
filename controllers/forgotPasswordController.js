const User = require('../models/user')
const jwt = require('jsonwebtoken')

const { RESPONSE_CODES, RESPONSE_MSG } = require('../constants')

exports.forgotPassword = async (req, res) => {
  const userEmail = req.body.email

  // Confirm the user exists
  const user = await User.findOne({ where: { email: userEmail } })
  if (!user) {
    return res
      .status(RESPONSE_CODES.NOT_FOUND_404)
      .send(RESPONSE_MSG.NOT_FOUND_404)
  }

  // Generate a password reset token that expires in 15 minutes
  const token = jwt.sign(
    { email: user.email },
    process.env.SECRET_KEY,
    { expiresIn: '15m' }
  )

  console.log(`Password reset token for ${userEmail}: ${token}`)
  res.json({ token, message: 'Token generated for password reset. Use it to reset your password.' })
}
