// TODO: Create separate user search function (update for database search)
// TODO: Refactor using OOP principles
// TODO: Write API tracking function; update for database
// TODO: Add specific route for API calls; add middleware to track API calls
// TODO: Add user-facing messages to separate file

const User = require("./user");
const {
  RESPONSE_CODES,
  RESPONSE_MSG,
  MAX_TOKEN_AGE_IN_MS,
  MAX_API_CALLS,
} = require("./constants");
const cors = require("cors");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const sequelize = require("./db");
const Sequelize = require("sequelize"); // Add this line to import Sequelize
const SALT_ROUNDS = 10;

dotenv.config({ path: ".env.local" });

const express = require("express");
const app = express();
app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
); // Enable CORS for all routes
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const SECRET_KEY = process.env.SECRET_KEY;

require("dotenv").config(); // Load environment variable: secret key for JWT

// Allows Express to parse JSON and cookie data for middleware
app.use(express.json());
app.use(cookieParser());

const OPENAI_API_KEY = process.env.OPENAI_API_TOKEN;
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Sync the database models
sequelize.sync();

/// ////////////////////
// Get Current Users ///
/// ////////////////////
app.get("/users", async (_, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error(error);
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500);
  }
});

/// /////////////////////////////////////////
// Create User, Hash Password, Store User ///
/// /////////////////////////////////////////
app.post("/users", async (req, res) => {
  try {
    // Check payload for email, password; ensure they exist
    if (req.body.email == null || req.body.password == null) {
      return res
        .status(RESPONSE_CODES.BAD_REQUEST_400)
        .send(RESPONSE_MSG.MISSING_INFO_400);
    }
    // Check if user already exists
    console.log("Checking if user exists in /users on line 78");
    if (
      await User.findOne({
        where: {
          email: req.body.email,
        },
      })
    ) {
      return res
        .status(RESPONSE_CODES.CONFLICT_409)
        .send(RESPONSE_MSG.ALREADY_EXISTS_409);
    }
    console.log("Creating user in /users on line 90");
    const user = await User.createUser({
      email: req.body.email,
      password: req.body.password,
    });

    // Create token; user email is the payload (used to identify user later on)
    const token = jwt.sign({ userEmail: user.email }, SECRET_KEY, {
      expiresIn: MAX_TOKEN_AGE_IN_MS,
    });

    res
      .status(RESPONSE_CODES.CREATED_USER_201)
      .json({ token, message: RESPONSE_MSG.SUCCESSFULLY_REGISTERED_201 });
  } catch (error) {
    console.log(error);
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500);
  }
});

/// /////////////
// User Login ///
/// /////////////
app.post("/users/login", async (req, res) => {
  try {
    if (req.body.email == null || req.body.password == null) {
      return res
        .status(RESPONSE_CODES.BAD_REQUEST_400)
        .send(RESPONSE_MSG.MISSING_INFO_400);
    }
    console.log("Checking if user exists in /users/login on line 113");
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    // console.log("user is: ", user);
    if (user == null) {
      return res
        .status(RESPONSE_CODES.NOT_FOUND_404)
        .send(RESPONSE_MSG.NOT_FOUND_404);
    }
    console.log(
      "password is: " +
        req.body.password +
        " user.password is: " +
        user.password
    );
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordValid) {
      console.log("password is not valid");
      return res
        .status(RESPONSE_CODES.UNAUTHORIZED_401)
        .send(RESPONSE_MSG.UNAUTHORIZED_401);
    }
    console.log("password is valid");
    // Create token; user email is the payload (used to identify user later on)
    const token = jwt.sign({ userEmail: user.email }, SECRET_KEY, {
      expiresIn: MAX_TOKEN_AGE_IN_MS,
    });

    /* Set token in HTTP-only cookie
          > httpOnly: true - cookie cannot be accessed by client-side scripts
          > secure: true - cookie will only be sent over HTTPS; set to false for testing */
    res
      .cookie("token", token, {
        httpOnly: false,
        secure: false,
        maxAge: MAX_TOKEN_AGE_IN_MS,
      })
      .status(RESPONSE_CODES.OK_200)
      .json({ token }); // Send the token in the response data
  } catch (error) {
    console.error(error);
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .send(RESPONSE_MSG.SERVER_ERROR_500);
  }
});
/// ///////////////////////
// Handle Chat Messages ///
/// ///////////////////////
const API_URL = "https://api.anthropic.com";
const API_TOKEN = process.env.ANTHROPIC_API_TOKEN;
const ANTHROPIC_VERSION = "2023-06-01";
app.post("/chat", authenticateToken, trackApiCalls, async (req, res) => {
  const { messages } = req.body;
  console.log("chat request received with messages: " + messages);
  try {
    const response = await fetch(`${API_URL}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_TOKEN,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        system:
          "Roleplay as a text-based fantasy adventure game. Keep your responses to a couple sentences or less for a dynamic experience.",
        messages: messages,
        max_tokens: 200,
      }),
    });
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      const assistantReply = data.content[0].text;
      res.json({
        message: assistantReply,
        apiCallCounter: req.user.apiCallCounter,
      });
    } else {
      console.error("Error:", data);
      res.status(500).json({ error: "An error occurred" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

/// ///////////////////////
// Handle Image requests ///
/// ///////////////////////
app.post(
  "/generate-image",
  authenticateToken,
  trackApiCalls,
  async (req, res) => {
    const { prompt } = req.body;
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
      });
      // console.log(response);
      const imageUrl = response.data[0].url;
      // console.log(imageUrl);
      res.json({ imageUrl, apiCallCounter: req.user.apiCallCounter });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "An error occurred" });
    }
  }
);
/// ///////////////
// User API URL ///
/// ///////////////
app.listen(3000, () => console.log("Server started; listening on Port 3000"));
/// /////////////
// Middleware ///
/// /////////////
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader == null)
    return res.sendStatus(RESPONSE_CODES.UNAUTHORIZED_401);

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) return res.sendStatus(RESPONSE_CODES.FORBIDDEN_403);
    // Use email from decoded token to find user
    console.log("finds user in authenticateToken on line 226");
    const user = await User.findOne({
      where: {
        email: decoded.userEmail,
      },
    });
    if (!user) return res.sendStatus(RESPONSE_CODES.UNAUTHORIZED_401);
    req.user = user;
    next();
  });
}
async function trackApiCalls(req, res, next) {
  // Get user email from decoded token; find user based on email
  const userEmail = req.user.email;
  console.log("finds user in trackApiCalls on line 241");
  const user = await User.findOne({
    where: {
      email: userEmail,
    },
  });
  if (!user) {
    return res
      .status(RESPONSE_CODES.UNAUTHORIZED_401)
      .send(RESPONSE_MSG.UNAUTHORIZED_401);
  }
  user.apiCallCounter++;
  await user.save();
  if (user.apiCallCounter > MAX_API_CALLS) {
    return res
      .status(RESPONSE_CODES.FORBIDDEN_403)
      .send(RESPONSE_MSG.API_LIMIT_EXCEEDED_403);
  }
  next();
}
