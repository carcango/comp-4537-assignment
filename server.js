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
const { getApiRouteStats } = require('./controllers/getApiRouteStatsController')
const { forgotPassword } = require('./controllers/forgotPasswordController')
const { resetPassword } = require('./controllers/resetPasswordController')
const deleteUser = require('./controllers/deleteUserController')
const promoteUser = require('./controllers/promoteUserController')


const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./swagger')

// Serve Swagger docs at the '/doc/' endpoint
app.use('/doc/', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

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

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of users
 *     description: Retrieve a list of users from the database.
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     description: The user's email.
 *                   apiCallCounter:
 *                     type: integer
 *                     description: The number of API calls made by the user.
 *                   isAdmin:
 *                     type: boolean
 *                     description: Whether the user is an admin.
 */
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

/**
 * @swagger
 * /reset-api-call-count/{email}:
 *   patch:
 *     summary: Reset API call count
 *     description: Resets the API call count for a user with the specified email.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The email of the user whose API call count is to be reset.
 *     responses:
 *       200:
 *         description: API call count reset successfully.
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 *       403:
 *         description: Forbidden if the user is not an admin.
 *       404:
 *         description: Not found if the user does not exist.
 */
app.patch(
  '/reset-api-call-count/:email',
  authenticateToken,
  authenticateAdmin,
  resetApiCallCount
)

/**
 * @swagger
 * /api-call-count:
 *   get:
 *     summary: Get the API call count for the current user
 *     description: Returns the number of API calls made by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The API call count of the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: The number of API calls made by the user.
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 */
app.get('/api-call-count', authenticateToken, (req, res) => {
  res
    .status(RESPONSE_CODES.OK_200)
    .json({ count: req.user.apiCallCounter })
})

/**
 * @swagger
 * /api-route-stats:
 *   get:
 *     summary: Retrieves each API endpoints call counts by user and HTTP method.
 *     description: Returns the number of API calls for each route.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The API call counts of each endpoint and method for each user.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 description: The number of API calls made by a user for a specific endpoint and method.
 *                 properties:
 *                   email:
 *                     type: string
 *                     description: User email or Uknown if no user
 *                   method:
 *                     type: string
 *                     description: HTTP Method
 *                   route:
 *                     type: string
 *                     description: Requested route
 *                   count:
 *                     type: integer
 *                     description: Number of calls to this endpoint.
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 *       403:
 *         description: Unauthorized if the user is not an administrator.
 */
app.get('/api-route-stats', authenticateToken, authenticateAdmin, getApiRouteStats)

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user with the provided data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *               password:
 *                 type: string
 *                 description: The password for the user.
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Bad request if the input data is invalid.
 */
app.post('/users', userRegistration)

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates the user with email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *               password:
 *                 type: string
 *                 description: The password for the user.
 *     responses:
 *       200:
 *         description: Login successful.
 *       401:
 *         description: Unauthorized if the credentials are invalid.
 */
app.post('/users/login', userLogin)

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Log out a user
 *     description: Ends the session for the current user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful.
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 */
app.post('/users/logout', userLogout)

/**
 * @swagger
 * /verify-token:
 *   get:
 *     summary: Verify JWT token
 *     description: Checks if the provided JWT token is valid and returns the associated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message stating the token is valid.
 *                 user:
 *                   type: object
 *                   description: The user object associated with the valid token.
 *       401:
 *         description: Unauthorized if the token is invalid or expired.
 */
app.get('/verify-token', authenticateToken, (req, res) => {
  res.json({ message: 'Token is valid', user: req.user })
})

/**
 * @swagger
 * /verify-admin:
 *   get:
 *     summary: Verify Admin User
 *     description: Verifies if the current user has admin privileges.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User has admin privileges.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation that the user is an admin.
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       description: Email of the admin user.
 *                     isAdmin:
 *                       type: boolean
 *                       description: Boolean flag indicating admin status.
 *       401:
 *         description: Unauthorized if the user is not authenticated or not an admin.
 */
app.get('/verify-admin', authenticateToken, authenticateAdmin, (req, res) => {
  res.json({ message: 'user is admin', user: req.user })
})

/**
 * @swagger
 * /promote-user/{email}:
 *   patch:
 *     summary: Promote User to Admin
 *     description: Grants admin privileges to the user with the specified email.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: Email of the user to be promoted to admin.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User was successfully promoted to admin.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message about the promotion.
 *       400:
 *         description: Bad request if the email is not provided or invalid.
 *       401:
 *         description: Unauthorized if the user is not authenticated or not an admin.
 */
app.patch('/promote-user/:email', authenticateToken, authenticateAdmin, promoteUser)

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Initiate password reset
 *     description: Sends a password reset link to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user requesting password reset.
 *     responses:
 *       200:
 *         description: Password reset email sent.
 *       400:
 *         description: Bad request if the email is not provided or invalid.
 */
app.post('/forgot-password', forgotPassword)

/**
 * @swagger
 * /reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     description: Allows the user to reset their password using a valid token.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The password reset token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: The new password for the user.
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Bad request if the password is not provided or invalid.
 *       404:
 *         description: Not found if the token is invalid or expired.
 */
app.post('/reset-password/:token', resetPassword)

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Send a chat message
 *     description: Sends a chat message to the AI and receives a response.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: An array of messages sent by the user.
 *     responses:
 *       200:
 *         description: Received AI response to the chat message.
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 *       403:
 *         description: Forbidden if the API call limit is exceeded.
 */
app.post('/chat', authenticateToken, trackApiCalls, handleChatMessages)

/**
 * @swagger
 * /generate-image:
 *   post:
 *     summary: Generate an image
 *     description: Generates an image based on the provided prompt using AI.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The prompt based on which the AI generates an image.
 *     responses:
 *       200:
 *         description: Image generated successfully.
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 *       403:
 *         description: Forbidden if the API call limit is exceeded.
 */
app.post('/generate-image', authenticateToken, trackApiCalls, handleImageGeneration)

/**
 * @swagger
 * /delete-user/{email}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user with the specified email.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The email of the user to delete.
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 *       403:
 *         description: Forbidden if the user is not an admin.
 *       404:
 *         description: Not found if the user does not exist.
 */
app.delete('/delete-user/:email', authenticateToken, authenticateAdmin, deleteUser)

app.patch('/promote-user/:email', authenticateToken, authenticateAdmin, promoteUser)

app.listen(PORT, () => console.log(`Server started; listening on Port ${PORT}`))
