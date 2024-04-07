const Sequelize = require('sequelize')
const sequelize = require('../config/db')
const User = require('./user')

const EndpointAccess = sequelize.define('EndpointAccess', {
  id: {
    type: Sequelize.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
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

EndpointAccess.increment = async function (userID, route, method) {
  // Check if the user already exists
  const record = {
    id: userID,
    route,
    method
  }
  const currentRecord = await EndpointAccess.findOne({ where: record })
  if (!currentRecord) {
    return EndpointAccess.create(record)
  }
  return currentRecord.update({ count: currentRecord.count + 1 })
}

module.exports = EndpointAccess
