const EndpointAccess = require('../models/endpointAccess')
const User = require('../models/user')

exports.getApiRouteStats = async (req, res) => {
  const rawRouteStats = await EndpointAccess.findAll({
    include: User
  })
  const routeStats = rawRouteStats.map(entry => {
    const { method, route, count, User } = entry
    return {
      email: User && User.email ? User.email : 'Unknown',
      method,
      route,
      count
    }
  })
  res.json(routeStats)
}
