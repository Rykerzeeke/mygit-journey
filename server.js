const express = require("express");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    }
  })
);

// routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const checkRoutes = require("./routes/checkRoutes");
const telegramRoutes = require("./routes/telegramRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/checks", checkRoutes);
app.use("/api/telegram", telegramRoutes);

const PORT = process.argv[2] || process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
