
const ERROR_CODES = {
    CREATED_USER_201: 201,
    BAD_REQUEST_400: 400,
    UNAUTHORIZED_401: 401,
    FORBIDDEN_403: 403,
    NOT_FOUND_404: 404,
    CONFLICT_409: 409,
    SERVER_ERROR: 500
}

const ERROR_MESSAGES = {
    MSG_200: "OK",
    MSG_201: "User successfully registered!",
    MSG_400: "Missing email or password",
    MSG_401: "You're not authorized to access this resource",
    MSG_403: "You've exceeded your API call limit",
    MSG_404: "User not found",
    MSG_409: "User already exists",
    MSG_500: "Internal Server Error"
}

const MAX_API_CALLS = 20
const MAX_TOKEN_AGE_IN_MS = 3600000

export { ERROR_CODES, ERROR_MESSAGES, MAX_API_CALLS, MAX_TOKEN_AGE_IN_MS }
