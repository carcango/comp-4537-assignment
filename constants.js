const RESPONSE_CODES = {
  OK_200: 200,
  CREATED_USER_201: 201,
  BAD_REQUEST_400: 400,
  UNAUTHORIZED_401: 401,
  FORBIDDEN_403: 403,
  NOT_FOUND_404: 404,
  CONFLICT_409: 409,
  SQLI_469: 469,
  SERVER_ERROR_500: 500
}

const RESPONSE_MSG = {
  OK_200: 'OK',
  SUCCESSFULLY_REGISTERED_201: 'User successfully registered!',
  MISSING_INFO_400: 'Missing email or password',
  UNAUTHORIZED_401: "Unauthorized: email or password doesn't match",
  API_LIMIT_EXCEEDED_403: "You've exceeded your API call limit",
  NOT_FOUND_404: 'User not found',
  ALREADY_EXISTS_409: 'User already exists',
  SERVER_ERROR_500: 'Internal Server Error',
  SQLI_DETECTED: "Normally we wouldn't tell you this, but this proves we can detect an sql injection"
}

const MAX_API_CALLS = 20
const MAX_TOKEN_AGE_IN_MS = 360000

module.exports = {
  RESPONSE_CODES,
  RESPONSE_MSG,
  MAX_API_CALLS,
  MAX_TOKEN_AGE_IN_MS
}
