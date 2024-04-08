// TODO: Add user-facing messages to separate file

const dotenv = require('dotenv')
dotenv.config({ path: '.env.local' })

const sequelize = require('./config/db')

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
const { forgotPassword } = require('./controllers/forgotPasswordController')
const { resetPassword } = require('./controllers/resetPasswordController')
const deleteUser = require('./controllers/deleteUserController')

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

const { trackApiRouteStats } = require('./middleware/trackApiRouteStats')
app.use(trackApiRouteStats) // Must be called before sequelize.sync to include tracking model

// Sync the database models, alter does the following:
// "This checks what is the current state of the table in the database (which columns it has, what are their data types, etc), and then performs the necessary changes in the table to make it match the model."
sequelize.sync({ alter: true })

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

app.post('/forgot-password', forgotPassword)

app.post('/reset-password/:token', resetPassword)

app.post('/chat', authenticateToken, trackApiCalls, handleChatMessages)

app.post('/generate-image', authenticateToken, trackApiCalls, handleImageGeneration)

app.delete('/delete-user/:email', authenticateToken, authenticateAdmin, deleteUser)

app.listen(PORT, () => console.log(`Server started; listening on Port ${PORT}`))
