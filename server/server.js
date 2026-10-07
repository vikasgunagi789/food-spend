const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VGlytics API is running",
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `VGlytics server running on port ${
          process.env.PORT || 5000
        }`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });