const fs = require('fs')
const swaggerJsdoc = require('swagger-jsdoc')
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API for comp-4537-assignment',
      version: '1.0.0'
    }
  },
  // Path to the API docs
  apis: ['./server.js']
}
const swaggerSpec = swaggerJsdoc(options)

// Write Swagger spec to a file
fs.writeFileSync('./swagger-output.json', JSON.stringify(swaggerSpec, null, 2), 'utf8')
console.log('Swagger spec generated at ./swagger-output.json')
