const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();


const app = express();


app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// routes
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);


// mongo connect
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));


const PORT = process.argv[2] || process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
