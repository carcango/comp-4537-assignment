const swaggerJsdoc = require('swagger-jsdoc')
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API for comp-4537-assignment',
      version: '1.0.0'
    }
  },
  apis: ['./routes/*.js', './server.js'] // include all files with API annotations
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec
