const jwt = require('jsonwebtoken')
const EndpointAccess = require('../models/endpointAccess')
const User = require('../models/user')

/*
Middleware that tracks a valid call to the endpoint based on the user, route, and method.

If no user can be found based on the provided auth token or request user
*/
exports.trackApiRouteStats = async (req, _, next) => {
  if (req && req.user && req.user.id) { // User was already attached to request
    await EndpointAccess.incrementCount({ userId: req.user.id, route: req.url, method: req.method })
    return next()
  }
  const token = req.cookies.token // Attempt to retrieve user via token
  try {
    // If the token is invalid or expired, throws an error, which we handle.
    // If the token is valid, it contains the user's ID, used for tracking.
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    const user = await User.findOne({
      where: {
        email: decodedToken.userEmail
      }
    })
    // If no user is found, throw an error because they lack proper authentication
    if (!user) throw new Error('No user with token')
    // If the user is found, increment the associated request.
    await EndpointAccess.incrementCount({ userId: user.id, route: req.url, method: req.method })
  } catch (_) {
    // No user was able to be found for this request, log as null for generic request
    await EndpointAccess.incrementCount({ userId: null, route: req.url, method: req.method })
  }
  next()
}
