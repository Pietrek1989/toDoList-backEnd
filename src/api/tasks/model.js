import mongoose from "mongoose";

const { Schema, model } = mongoose;

const MoveDetailSchema = new Schema({
  column: { type: String, required: true },
  time: { type: Date, required: true },
});

const TasksSchema = new Schema({
  title: { type: String, required: true },
  img: { type: String, required: false },
  createdAt: { type: Date, required: true, default: Date.now },
  movedAt: [MoveDetailSchema],
});

export default model("Task", TasksSchema);
