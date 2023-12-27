// Importing necessary libraries and modules
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// Creating an Express app and setting up middleware
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Creating a MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "project",
  password: "Ijkl098765@",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Handling user authentication (login)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists in the database
    const [user] = await pool
      .promise()
      .query("SELECT * FROM user_credentials WHERE username = ?", [username]);

    if (!user || user.length === 0) {
      // If the user does not exist, send a 401 response
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if the provided password matches the stored hashed password
    const validPassword = await bcrypt.compare(password, user[0].password);

    if (!validPassword) {
      // If the password is invalid, send a 401 response
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // If both username and password are valid, generate a JWT token
    const token = jwt.sign({ username: user[0].username }, "Abhishek");

    // Send the token in the response
    res.json({ token });
  } catch (error) {
    // Handle any errors that occur during the authentication process
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Handling user signup
app.post("/signup", async (req, res) => {
  const { username, password, admitId, hospital } = req.body;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save user credentials to the database
  await pool
    .promise()
    .query(
      "INSERT INTO user_credentials (username, password, admitId, hospital) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, admitId, hospital]
    );

  res.status(201).send("User registered successfully");
});

// Handling saving user data
app.post("/saveData", async (req, res) => {
  const { DoctorName, AdmitDate, AdmitID, CurrentProgress, VisitorData } =
    req.body;

  try {
    // Check if the Authorization header is present
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    // Extract and verify the token
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, "Abhishek");
    const username = decodedToken.username;

    // Check if the user exists in the database
    const [user] = await pool
      .promise()
      .query("SELECT * FROM user_credentials WHERE username = ?", [username]);

    if (!user || user.length === 0) {
      // If the user does not exist, send a 401 response
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Save data to the database
    await pool
      .promise()
      .query(
        "INSERT INTO user_data (user_id, DoctorName, AdmitDate, AdmitID, CurrentProgress, VisitorData) VALUES (?, ?, ?, ?, ?, ?)",
        [
          user[0].id, // Assuming 'id' is the primary key column in user_credentials
          DoctorName,
          AdmitDate,
          AdmitID,
          CurrentProgress,
          JSON.stringify(VisitorData),
        ]
      );

    res.status(201).send("Data saved successfully");
  } catch (error) {
    console.error(error);
    // Check if the error is related to token verification
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).send("Internal Server Error");
  }
});

// Handling getting visitor data
app.get("/getVisitorData/:admitId", (req, res) => {
  const admitId = req.params.admitId;

  // Retrieve visitorData from the database based on admitId
  pool
    .promise()
    .query("SELECT VisitorData FROM user_data WHERE AdmitID = ?", [admitId])
    .then(([results]) => {
      const visitorData = results[0]?.VisitorData || [];
      res.json({ visitorData });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

// Starting the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
