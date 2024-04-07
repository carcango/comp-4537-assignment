const User = require('../models/user')

const {
  RESPONSE_CODES,
  RESPONSE_MSG,
  MAX_API_CALLS
} = require('../constants')

exports.trackApiCalls = async (req, res, next) => {
  const userEmail = req.user.email

  const user = await User.findOne({ where: { email: userEmail } })
  if (!user) {
    return res
      .status(RESPONSE_CODES.UNAUTHORIZED_401)
      .send(RESPONSE_MSG.UNAUTHORIZED_401)
  }
  if (user.apiCallCounter >= MAX_API_CALLS) {
    return res
      .status(RESPONSE_CODES.FORBIDDEN_403)
      .send(RESPONSE_MSG.API_LIMIT_EXCEEDED_403)
  }
  user.apiCallCounter++
  await user.save()
  next()
}
