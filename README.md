# comp-4537-assignment

This project is an Express API for a comp-4537-assignment, which includes various endpoints for user authentication, chat message handling, image generation, and more.

## Getting Started

To get the project up and running on your local machine, follow these steps:

1. Clone the repository to your local machine.
2. Install the required dependencies by running `npm install`.
3. Set up your environment variables by creating a `.env.local` file with the necessary configurations.
4. Start the development server by running `npm run devStart`.

## Features

The API includes the following features:

- User registration and authentication
- Password reset functionality
- Chat messaging with AI
- AI-based image generation
- Admin functionalities like resetting API call counts and deleting users

## API Documentation

API documentation is available at the `/doc/` endpoint once the server is running. It is generated using Swagger and provides detailed information about each endpoint, including the expected request and response formats.

## Environment Variables

The following environment variables are required:

- `PORT`: The port number on which the server will listen.
- `POSTGRES_DATABASE`: The name of the PostgreSQL database.
- `POSTGRES_USER`: The PostgreSQL user.
- `POSTGRES_PASSWORD`: The password for the PostgreSQL user.
- `POSTGRES_HOST`: The host of the PostgreSQL server.
- `POSTGRES_PORT`: The port number of the PostgreSQL server.
- `OPENAI_API_TOKEN`: The API token for OpenAI services.
- `ANTHROPIC_API_TOKEN`: The API token for Anthropic services.
- `SECRET_KEY`: A secret key used for JWT token generation and verification.

## Scripts

The `package.json` file includes the following scripts:

- `devStart`: Starts the development server using nodemon.

## Dependencies

This project uses the following main dependencies:

- `express`: Web framework for Node.js.
- `sequelize`: ORM for PostgreSQL.
- `bcrypt`: Library for hashing passwords.
- `jsonwebtoken`: Library for working with JSON Web Tokens (JWT).
- `swagger-jsdoc`: Library for generating Swagger docs based on JSDoc comments.
- `swagger-ui-express`: Middleware for serving the Swagger UI.

## Development Tools

The project is set up with ESLint for code linting and nodemon for automatically restarting the server during development.

## .gitignore

The `.gitignore` file is configured to exclude the following directories and files from version control:

- `node_modules/`: Node.js modules.
- `.env`: Environment variables file.
- `.env.local`: Local environment variables file.

## Note

ChatGPT and Claude was used to assist in the development of this project.

## Author

The API is developed by students of COMP 4537.

---

For more information on how to use the API, refer to the Swagger documentation generated at the `/doc/` endpoint.