// TODO: Create separate user search function (update for database search)
// TODO: Refactor using OOP principles
// TODO: Write API tracking function; update for database
// TODO: Add specific route for API calls; add middleware to track API calls
// TODO: Add user-facing messages to separate file

const express      = require('express')
const app          = express()

const bcrypt       = require('bcrypt')
const jwt          = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

require('dotenv').config() // Load environment variable: secret key for JWT

////////////////////////////
// Error Codes & Messages //
////////////////////////////
const CREATED_USER_201 = 201
const BAD_REQUEST_400  = 400
const UNAUTHORIZED_401 = 401
const FORBIDDEN_403    = 403
const NOT_FOUND_404    = 404
const CONFLICT_409     = 409
const SERVER_ERROR     = 500

const MSG_200 = "OK"
const MSG_201 = "User successfully registered!"
const MSG_400 = "Missing email or password"
const MSG_401 = "You're not authorized to access this resource"
const MSG_403 = "You've exceeded your API call limit"
const MSG_404 = "User not found"
const MSG_409 = "User already exists"
const MSG_500 = "Internal Server Error"

const SECRET_KEY          = process.env.SECRET_KEY // For JWT
const SALT_ROUNDS         = 10 // User for password hashing
const MAX_API_CALLS       = 20
const MAX_TOKEN_AGE       = 3600000 // 1 hour in milliseconds
const INITIAL_API_COUNTER = 0

// Allows Express to parse JSON and cookie data for middleware
app.use(express.json())
app.use(cookieParser())

// Array to store users; will be replaced with database
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

        if (req.body.email == null || req.body.password == null) {
            return res.status(BAD_REQUEST_400).send(MSG_400)
        }

        if (users.find(user => user.email === req.body.email)) {
            return res.status(CONFLICT_409).send(MSG_409)
        }

        /* Hashes the password; takes the original plain-text password and a
        salt, which is the complexity of the hashing process -- higher number
        means more time, more complexity, and more security. */
        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS)

        const user = {
            email: req.body.email,
            password: hashedPassword,
            api_call_counter: INITIAL_API_COUNTER
        }

        users.push(user)
        res.status(CREATED_USER_201).send(MSG_201)

    } catch {
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
            const token = jwt.sign({userEmail : user.email}, SECRET_KEY, {expiresIn: MAX_TOKEN_AGE})

            /* Set token in HTTP-only cookie
            > httpOnly: true - cookie cannot be accessed by client-side scripts
            > secure: true - cookie will only be sent over HTTPS; set to false for testing */
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                maxAge: MAX_TOKEN_AGE})
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


//////////////////////////
// MIDDLEWARE FUNCTIONS //
//////////////////////////
function authenticateToken(req, res, next) {
    const token = req.cookies.token

    if (token == null) return res.sendStatus(UNAUTHORIZED_401)

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.sendStatus(FORBIDDEN_403)

        // Use email from decoded token to find user
        const user = users.find(user => user.email === decoded.userEmail)
        if (!user) return res.sendStatus(UNAUTHORIZED_401)

        req.user = user

        next()
    })
}

// Middleware function to track API calls
function trackApiCalls(req, res, next) {

    // Get user email from decoded token; find user based on email
    const userEmail = req.user.email
    const user = users.find(user => user.email === userEmail)

    if (!user) {
        return res.status(UNAUTHORIZED_401).send(MSG_401)
    }

    user.api_call_counter++

    if (user.api_call_counter > MAX_API_CALLS) {
        return res.status(FORBIDDEN_403).send(MSG_403)
    }

    // Update counter in database for persistence (to be implemented)

    next()
}
