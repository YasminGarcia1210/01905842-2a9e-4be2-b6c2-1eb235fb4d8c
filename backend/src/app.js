const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/healthz", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/api/auth", authRoutes);

module.exports = app;
