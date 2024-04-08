const Sequelize = require('sequelize')
const sequelize = require('../config/db')
const User = require('./user')

const EndpointAccess = sequelize.define('EndpointAccess', {
  route: {
    type: Sequelize.STRING,
    allowNull: false
  },
  method: {
    type: Sequelize.STRING,
    allowNull: false
  },
  count: {
    type: Sequelize.INTEGER,
    defaultValue: 1
  }
})

// Setup associations
EndpointAccess.belongsTo(User)
User.hasMany(EndpointAccess)

// Instance method to increment a record (userId, route, and method)
EndpointAccess.incrementCount = async function (record) {
  const { userId, route, method } = record
  const UserId = userId || null // Automatic column name from associations...
  if (!method || !route) throw new Error('Cannot increment with provided args!')
  // Check if the users entry already exists
  const currentRecord = await EndpointAccess.findOne({ where: { UserId, route, method } })
  if (!currentRecord) {
    return EndpointAccess.create({ UserId, route, method })
  }
  return currentRecord.increment('count')
}

module.exports = EndpointAccess
