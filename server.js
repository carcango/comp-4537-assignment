// TODO: Create separate user search function (update for database search)
// TODO: Add specific route for API calls; add middleware to track API calls
// TODO: Add user-facing messages to separate file

const User = require('./user')
const {
  RESPONSE_CODES,
  RESPONSE_MSG
} = require('./constants')

const cors = require('cors')
const dotenv = require('dotenv')
const sequelize = require('./db')

dotenv.config({ path: '.env.local' })

const express = require('express')
const app = express()

const authenticateToken = require('./authMiddleware')
const trackApiCalls = require('./apiMiddleware')

const { userRegistration, userLogin } = require('./authController')
const { handleChatMessages } = require('./chatController')
const { handleImageGeneration } = require('./imageController')

app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true // reflect the request's credentials mode
})) // Enable CORS for all routes
app.options('*', cors())
const cookieParser = require('cookie-parser')

// Allows Express to parse JSON and cookie data for middleware
app.use(express.json())
app.use(cookieParser())

// Sync the database models
sequelize.sync()

/// ////////////////////
// Get Current Users ///
/// ////////////////////
app.get('/users', async (_, res) => {
  try {
    const users = await User.findAll()
    res.json(users)
  } catch (error) {
    logError('users', 'Error retrieving users! ' + error)
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500)
  }
})

// Handle user registration and login
app.post('/users', userRegistration)
app.post('/users/login', userLogin)

// Handle chat messages
app.post('/chat', authenticateToken, trackApiCalls, handleChatMessages)

// Handle image generation
app.post('/generate-image', authenticateToken, trackApiCalls, handleImageGeneration)

app.listen(process.env.PORT, () => console.log(`Server started; listening on Port ${process.env.PORT}`))
