import { ERROR_CODES, ERROR_MESSAGES, MAX_API_CALLS } from './constants'

const jwt = require('jsonwebtoken')

function authenticateToken(req, res, next) {
    const token = req.cookies.token

    if (token == null) return res.sendStatus(ERROR_CODES.UNAUTHORIZED_401)

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
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

    // Send user email to database to retrieve user

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
