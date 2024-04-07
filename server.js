// TODO: Add user-facing messages to separate file

const sequelize = require('./config/db')

const dotenv = require('dotenv')
dotenv.config({ path: '.env.local' })

const express = require('express')
const app = express()
const PORT = process.env.PORT || 4000

const User = require('./models/user')
const { RESPONSE_CODES, RESPONSE_MSG } = require('./constants')

const { authenticateToken } = require('./middleware/authenticateToken')
const { trackApiCalls } = require('./middleware/trackApiCalls')
const { authenticateAdmin } = require('./middleware/authenticateAdmin')
const { userRegistration, userLogin, userLogout } = require('./controllers/authController')
const { handleChatMessages } = require('./controllers/chatController')
const { handleImageGeneration } = require('./controllers/imageController')
const { resetApiCallCount } = require('./controllers/resetAPICallCount')

const cors = require('cors')
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true // reflect the request's credentials mode
})) // Enable CORS for all routes
app.options('*', cors())

// Allows Express to parse JSON and cookie data for middleware
app.use(express.json())

const cookieParser = require('cookie-parser')
app.use(cookieParser())

// Sync the database models
sequelize.sync()

app.get('/users', async (_, res) => {
  try {
    const users = await User.findAll()
    res.json(users)
  } catch (error) {
    console.error('Error getting users! ' + error)
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500)
  }
})

app.patch(
  '/reset-api-call-count/:email',
  authenticateToken,
  authenticateAdmin,
  resetApiCallCount
)
app.get('/api-call-count', authenticateToken, (req, res) => {
  res
    .status(RESPONSE_CODES.OK_200)
    .json({ count: req.user.apiCallCounter })
})

app.post('/users', userRegistration)
app.post('/users/login', userLogin)
app.post('/users/logout', userLogout)

app.get('/verify-token', authenticateToken, (req, res) => {
  res.json({ message: 'Token is valid', user: req.user })
})

app.post(
  '/chat',
  authenticateToken,
  trackApiCalls,
  handleChatMessages
)

app.post(
  '/generate-image',
  authenticateToken,
  trackApiCalls,
  handleImageGeneration
)

app.listen(PORT, () => console.log(`Server started; listening on Port ${PORT}`))
