// TODO: Create separate user search function (update for database search)
// TODO: Refactor using OOP principles
// TODO: Write API tracking function; update for database
// TODO: Add specific route for API calls; add middleware to track API calls
// TODO: Add user-facing messages to separate file

const User = require('./user')
const {
  RESPONSE_CODES,
  RESPONSE_MSG,
  MAX_TOKEN_AGE_IN_MS,
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
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true // reflect the request's credentials mode
})) // Enable CORS for all routes
app.options('*', cors())
app.use(express.json())
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

/// /////////////////////////////////////////
// Create User, Hash Password, Store User ///
/// /////////////////////////////////////////
app.post('/users', async (req, res) => {
  try {
    // Check payload for email, password; ensure they exist
    if (req.body.email == null || req.body.password == null) {
      return res
        .status(RESPONSE_CODES.BAD_REQUEST_400)
        .send(RESPONSE_MSG.MISSING_INFO_400)
    }
    // Check if user already exists
    if (
      await User.findOne({
        where: {
          email: req.body.email
        }
      })
    ) {
      return res
        .status(RESPONSE_CODES.CONFLICT_409)
        .send(RESPONSE_MSG.ALREADY_EXISTS_409)
    }

    const user = await User.createUser({
      email: req.body.email,
      password: req.body.password
    })

    // Create token; user email is the payload (used to identify user later on)
    const token = jwt.sign({ userEmail: user.email }, SECRET_KEY, {
      expiresIn: MAX_TOKEN_AGE_IN_MS
    })

    res
      .status(RESPONSE_CODES.CREATED_USER_201)
      .json({ token, message: RESPONSE_MSG.SUCCESSFULLY_REGISTERED_201 })
  } catch (error) {
    logError('users', 'Error creating user! ' + error)
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500)
  }
})

/// /////////////
// User Login ///
/// /////////////
app.post('/users/login', async (req, res) => {
  try {
    if (req.body.email == null || req.body.password == null) {
      return res
        .status(RESPONSE_CODES.BAD_REQUEST_400)
        .send(RESPONSE_MSG.MISSING_INFO_400)
    }

    const user = await User.findOne({
      where: {
        email: req.body.email
      }
    })

    if (user == null) {
      return res
        .status(RESPONSE_CODES.NOT_FOUND_404)
        .send(RESPONSE_MSG.NOT_FOUND_404)
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    )

    if (!isPasswordValid) {
      return res
        .status(RESPONSE_CODES.UNAUTHORIZED_401)
        .send(RESPONSE_MSG.UNAUTHORIZED_401)
    }

    // Create token; user email is the payload (used to identify user later on)
    const token = jwt.sign({ userEmail: user.email }, SECRET_KEY, { expiresIn: MAX_TOKEN_AGE_IN_MS })

    /* Set token in HTTP-only cookie
          > httpOnly: true - cookie cannot be accessed by client-side scripts
          > secure: true - cookie will only be sent over HTTPS; set to false for testing */
    res
      .cookie('token', token, {
        httpOnly: false,
        secure: false,
        maxAge: MAX_TOKEN_AGE_IN_MS
      })
      .status(RESPONSE_CODES.OK_200)
      .json({ message: RESPONSE_MSG.OK_200 })
  } catch (error) {
    logError('users/login', 'Error on user login! ' + error)
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500)
  }
})

app.get('/verify-token', authenticateToken, (req, res) => {
  res.status(200).send({ message: 'Token is valid' })
})

/// ///////////////////////
// Handle Chat Messages ///
/// ///////////////////////
const API_URL = 'https://api.anthropic.com'
const API_TOKEN = process.env.ANTHROPIC_API_TOKEN
const ANTHROPIC_VERSION = '2023-06-01'
app.post('/chat', authenticateToken, trackApiCalls, async (req, res) => {
  const { messages } = req.body

  try {
    const response = await fetch(`${API_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_TOKEN,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        system:
          'Roleplay as a text-based fantasy adventure game. Keep your responses to a couple sentences or less for a dynamic experience.',
        messages,
        max_tokens: 200
      })
    })

    const data = await response.json()

    if (response.ok) {
      const assistantReply = data.content[0].text
      res.json({
        message: assistantReply,
        apiCallCounter: req.user.apiCallCounter
      })
    } else {
      res.status(500).json({ error: 'An error occurred' })
    }
  } catch (error) {
    logError('chat', 'Error POSTing chat message! ' + error)
    res.status(500).json({ error: 'An error occurred' })
  }
})

/// ///////////////////////
// Handle Image requests ///
/// ///////////////////////
app.post(
  '/generate-image',
  authenticateToken,
  trackApiCalls,
  async (req, res) => {
    const { prompt } = req.body

    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1
      })
      const imageUrl = response.data[0].url
      res.json({ imageUrl, apiCallCounter: req.user.apiCallCounter })
    } catch (error) {
      logError('generate-image', 'Error generating image! ' + error)
      res.status(500).json({ error: 'An error occurred' })
    }
  }
)
/// ///////////////
// User API URL ///
/// ///////////////
app.listen(process.env.PORT, () => console.log(`Server started; listening on Port ${process.env.PORT}`))

/// /////////////
// Middleware ///
/// /////////////
async function authenticateToken (req, res, next) {
  const token = req.cookies.token
  if (token == null) {
    logError('authToken', 'Client request lacked authentication token. Unable to verify request!')
    return res.sendStatus(RESPONSE_CODES.UNAUTHORIZED_401)
  }

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) {
      logError('authToken', 'Unable to sign JWT token! ' + err)
      return res.sendStatus(RESPONSE_CODES.FORBIDDEN_403)
    }

    // Use email from decoded token to find user
    const user = await User.findOne({
      where: {
        email: decoded.userEmail
      }
    })
    if (!user) {
      logError('authToken', `Unregistered user ${decoded.userEmail} attempted to authenticate!`)
      return res.sendStatus(RESPONSE_CODES.UNAUTHORIZED_401)
    }
    req.user = user
    next()
  })
}

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
