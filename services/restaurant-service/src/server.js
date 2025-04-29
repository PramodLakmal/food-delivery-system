require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();
connectDB();

// Increase JSON payload limit to allow larger image uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use("/api/restaurants", require("./routes/restaurantRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
