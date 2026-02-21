const express = require("express");
const path = require("path");

const app = express();
const publicDir = path.join(__dirname, "public");

app.use(express.static(publicDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "tasks.html"));
});

const PORT = process.argv[2] || process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
