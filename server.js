// TODO: Create separate user search function (update for database search)
// TODO: Refactor using OOP principles
// TODO: Write API tracking function; update for database
// TODO: Add specific route for API calls; add middleware to track API calls
// TODO: Add user-facing messages to separate file

const User = require('./user')
const {
  RESPONSE_CODES,
  RESPONSE_MSG,
  MAX_API_CALLS
} = require('./constants')
const cors = require('cors')
const fetch = require('node-fetch')
const dotenv = require('dotenv')
const OpenAI = require('openai')
const sequelize = require('./db')

dotenv.config({ path: '.env.local' })

const express = require('express')
const app = express()

const authenticateToken = require('./authMiddleware')
const { userRegistration, userLogin } = require('./authController')
const { handleChatMessages } = require('./chatController')
const { handleImageGeneration } = require('./imageController')

app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true // reflect the request's credentials mode
})) // Enable CORS for all routes
app.options('*', cors())
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const SECRET_KEY = process.env.SECRET_KEY

// Allows Express to parse JSON and cookie data for middleware
app.use(express.json())
app.use(cookieParser())

const OPENAI_API_KEY = process.env.OPENAI_API_TOKEN
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

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

/// ///////////////
// User API URL ///
/// ///////////////
app.listen(process.env.PORT, () => console.log(`Server started; listening on Port ${process.env.PORT}`))

/// /////////////
// Middleware ///
/// /////////////

async function trackApiCalls (req, res, next) {
  // Get user email from decoded token; find user based on email
  const userEmail = req.user.email

  const user = await User.findOne({
    where: {
      email: userEmail
    }
  })
  if (!user) {
    return res
      .status(RESPONSE_CODES.UNAUTHORIZED_401)
      .send(RESPONSE_MSG.UNAUTHORIZED_401)
  }
  user.apiCallCounter++
  await user.save()
  if (user.apiCallCounter > MAX_API_CALLS) {
    return res
      .status(RESPONSE_CODES.FORBIDDEN_403)
      .send(RESPONSE_MSG.API_LIMIT_EXCEEDED_403)
  }
  next()
}

function logError (route, error) {
  const timeString = Date.now().toString()
  console.error(`[${timeString}][${route}] ${error}`)
}
