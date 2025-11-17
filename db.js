const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB ulandi"))
  .catch((err) => console.log("❌ MongoDB xato:", err));
