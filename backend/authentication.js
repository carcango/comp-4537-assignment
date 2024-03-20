// TODO: Create separate user search function (update for database search)
// TODO: Refactor using OOP principles
// TODO: Write API tracking function
// TODO: Add specific route for API calls; add middleware to track API calls


const express = require('express')
require('dotenv').config()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const app = express()


const CREATED_USER_201          = 201
const BAD_REQUEST_400           = 400
const UNAUTHORIZED_401          = 401
const FORBIDDEN_403             = 403
const CONFLICT_409              = 409
const INTERNAL_SERVER_ERROR_500 = 500

const SALT_ROUNDS   = 10 // User for password hashing
const MAX_API_CALLS = 20 // Max number of API calls
const SECRET_KEY    = process.env.SECRET_KEY // Secret key for JWT
const MAX_TOKEN_AGE = 3600000 // 1 hour in milliseconds


/* An Express method to configure middleware; has access to requests
and response objects, plus the next middleware function to be run. */
app.use(express.json())

app.use(cookieParser())

/* Users will be stored in a database, but for testing
purposes, we'll store them in a local variable. */
const users = []

app.get('/users', (req, res) => {
    res.json(users)
})

////////////////////////////////////////////
// Create User, Hash Password, Store User //
////////////////////////////////////////////
app.post('/users', async (req, res) => {
    try {

        if (req.body.name == null || req.body.email == null || req.body.password == null) {
            return res.status(BAD_REQUEST_400).send("Missing name, email, or password")
        }

        if (users.find(user => user.email === req.body.email)) {
            return res.status(CONFLICT_409).send("User already exists")
        }

        /* Hashes the password; takes the original plain-text password and a
        salt, which is the complexity of the hashing process -- a higher number
        means more time, more complexity, and more security. */
        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS)

        const user = {
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            api_call_counter: 0
        }
        users.push(user)
        res.status(CREATED_USER_201).send()

    } catch {
        res.status(INTERNAL_SERVER_ERROR_500).send()
    }
})

////////////////
// User Login //
////////////////

app.post("/users/login", async (req, res) => {

    const user = users.find(user => user.email === req.body.email);
    if (user == null) {
        return res.status(BAD_REQUEST_400).send('Cannot find user')
    }

    try {
        if (await bcrypt.compare(req.body.password, user.password)) {

            // Create token; user email is the payload (used to identify user later on)
            const token = jwt.sign({userEmail : user.email}, SECRET_KEY, {expiresIn: '1h'})

            /* Set token in HTTP-only cookie
            > httpOnly: true - cookie cannot be accessed by client-side scripts
            > secure: true - cookie will only be sent over HTTPS; set to false for testing */
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                maxAge: MAX_TOKEN_AGE})
                .send('Login successful!')

        } else {
            res.send('Not Allowed')
        }
    } catch {
        res.status(INTERNAL_SERVER_ERROR_500).send()
    }
})

//////////////////
// User API URL //
//////////////////


app.listen(3000, ()=> console.log("Server started; listening on port 3000"))


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
        return res.status(UNAUTHORIZED_401).send('User not found')
    }

    user.api_call_counter++

    if (user.api_call_counter > MAX_API_CALLS) {
        return res.status(FORBIDDEN_403).send('API call limit reached')
    }

    // Update counter in database

    next()
}
