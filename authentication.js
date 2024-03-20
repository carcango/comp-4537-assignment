// TODO: Create separate user search function (update for database search)
// TODO: Refactor using OOP principles
// TODO: Write API tracking function; update for database
// TODO: Add specific route for API calls; add middleware to track API calls
// TODO: Add user-facing messages to separate file

import User from './user'
import { ERROR_CODES, ERROR_MESSAGES, MAX_TOKEN_AGE_IN_MS, MAX_API_CALLS } from './constants'

const express      = require('express')
const app          = express()
const bcrypt       = require('bcrypt')
const jwt          = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

require('dotenv').config() // Load environment variable: secret key for JWT

// Allows Express to parse JSON and cookie data for middleware
app.use(express.json())
app.use(cookieParser())

// Array to store users; used for testing, will be replaced with database
const users = []

///////////////////////
// Get Current Users //
///////////////////////
app.get('/users', (_, res) => {
    res.json(users)
})

////////////////////////////////////////////
// Create User, Hash Password, Store User //
////////////////////////////////////////////
app.post('/users', async (req, res) => {
    try {

        // Check payload for email and password; ensure they exist
        if (req.body.email == null || req.body.password == null) {
            return res.status(BAD_REQUEST_400).send(MSG_400)
        }

        // Will need to update this to use database search
        if (users.find(user => user.email === req.body.email)) {x
            return res.status(CONFLICT_409).send(MSG_409)
        }

        const user = await User.create(req.body.email, req.body.password)

        users.push(user)
        res.status(CREATED_USER_201).send(MSG_201)

    } catch(error) {
        console.log(error)
        res.status(SERVER_ERROR).send(MSG_500)
    }
})

////////////////
// User Login //
////////////////
app.post("/users/login", async (req, res) => {

    if (req.body.email == null || req.body.password == null) {
        return res.status(BAD_REQUEST_400).send(MSG_400)
    }

    const user = users.find(user => user.email === req.body.email);
    if (user == null) {
        return res.status(NOT_FOUND_404).send(MSG_404)
    }

    try {
        if (await bcrypt.compare(req.body.password, user.password)) {

            // Create token; user email is the payload (used to identify user later on)
            const token = jwt.sign({userEmail : user.email}, SECRET_KEY, {expiresIn: MAX_TOKEN_AGE_IN_MS})

            /* Set token in HTTP-only cookie
            > httpOnly: true - cookie cannot be accessed by client-side scripts
            > secure: true - cookie will only be sent over HTTPS; set to false for testing */
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                maxAge: MAX_TOKEN_AGE_IN_MS})
                .send(MSG_200)

        } else {
            res.send(MSG_401)
        }
    } catch {
        res.status(SERVER_ERROR).send(MSG_500)
    }
})

//////////////////
// User API URL //
//////////////////

app.listen(3000, ()=> console.log("Server started; listening on Port 3000"))

////////////////
// Middleware //
////////////////
function authenticateToken(req, res, next) {
    const token = req.cookies.token

    if (token == null) return res.sendStatus(ERROR_CODES.UNAUTHORIZED_401)

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.sendStatus(ERROR_CODES.FORBIDDEN_403)

        // Use email from decoded token to find user
        const user = users.find(user => user.email === decoded.userEmail)
        if (!user) return res.sendStatus(ERROR_CODES.UNAUTHORIZED_401)

        req.user = user

        next()
    })
}

function trackApiCalls(req, res, next) {

    // Get user email from decoded token; find user based on email
    const userEmail = req.user.email
    const user = users.find(user => user.email === userEmail)

    if (!user) {
        return res.status(ERROR_CODES.UNAUTHORIZED_401).send(ERROR_MESSAGES.MSG_401)
    }

    user.api_call_counter++

    if (user.api_call_counter > MAX_API_CALLS) {
        return res.status(ERROR_CODES.FORBIDDEN_403).send(ERROR_MESSAGES.MSG_403)
    }

    // Update counter in database for persistence (to be implemented)

    next()
}
