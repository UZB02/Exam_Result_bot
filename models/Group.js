const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true }, // masalan: "5 Blue"
  chatId: { type: String, required: true },
});

module.exports = mongoose.model("Group", groupSchema);
