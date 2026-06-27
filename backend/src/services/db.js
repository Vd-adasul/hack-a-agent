const mongoose = require("mongoose");

const connectDb = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
};

module.exports = { connectDb };
