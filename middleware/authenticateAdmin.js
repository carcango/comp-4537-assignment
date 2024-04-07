const { RESPONSE_CODES, RESPONSE_MSG } = require('../constants')

exports.authenticateAdmin = async (req, res, next) => {
  if (!req.user) {
    // The user has not been authenticated
    return res.status(RESPONSE_CODES.UNAUTHORIZED_401).send(RESPONSE_MSG.UNAUTHORIZED_401)
  } else if (!req.user.isAdmin) {
    // The user's token has been verified and req.user exists
    return res.status(RESPONSE_CODES.FORBIDDEN_403).send(RESPONSE_MSG.NOT_ADMIN_403)
  }
  next()
}
