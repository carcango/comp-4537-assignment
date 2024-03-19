const express = require('express')
const bcrypt = require('bcrypt')
const app = express()

// CONSTANTS //

 const CREATED_USER_201          = 201
 const BAD_REQUEST_400           = 400
 const CONFLICT_409              = 409
 const INTERNAL_SERVER_ERROR_500 = 500

 const SALT_ROUNDS = 10 // User for password hashing

/* An Express method to configure middleware; has access to requests
and response objects, plus the next middleware function to be run. */
app.use(express.json())

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

        // Error is user doesn't provide name, email, or password
        if (req.body.name == null || req.body.email == null || req.body.password == null) {
            return res.status(BAD_REQUEST_400).send("Missing name, email, or password")
        }

        // Error if user already exists
        if (users.find(user => user.email === req.body.email)) {
            return res.status(CONFLICT_409).send("User already exists")
        }

        /* Hashes the password; takes the original plain-text password and a
        salt, which is the complexity of the hashing process -- a higher number
        means more time, more complexity, and more security.  */
        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS)

        const user = {
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        }

        // User successfully created and stored
        users.push(user)
        res.status(CREATED_USER_201).send()

    } catch {
        res.status(INTERNAL_SERVER_ERROR_500).send()
    }
})

////////////////
// USER LOGIN //
////////////////

app.post("/users/login", async (req, res) => {

    // Look for user based on name and email
    const user = users.find(user => {
        user.name === req.body.name &&
        user.email === req.body.email
    })

    if (user == null) {
        return res.status(BAD_REQUEST_400).send('Cannot find user')
    }

    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            res.send('Success')
        } else {
            res.send('Not Allowed')
        }
    } catch {
        res.status(INTERNAL_SERVER_ERROR_500).send()
    }
})

app.listen(3000)
