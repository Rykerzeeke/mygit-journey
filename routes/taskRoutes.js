const express = require("express");
const router = express.Router();
const Task = require("../models/Task");


// get all
router.get("/", async(req,res)=>{
const tasks = await Task.find().sort({createdAt:-1});
res.json(tasks);
});


// add
router.post("/", async(req,res)=>{
const task = new Task({ title: req.body.title });
await task.save();
res.json(task);
});


// delete
router.delete("/:id", async(req,res)=>{
await Task.findByIdAndDelete(req.params.id);
res.json({message:"Deleted"});
});


// toggle complete
router.put("/:id", async(req,res)=>{
const task = await Task.findById(req.params.id);
task.completed = !task.completed;
await task.save();
res.json(task);
});


module.exports = router;
