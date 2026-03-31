require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

// Import routes
const authRoutes = require("./src/routes/authRoutes");

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// DB connection
connectDB();


app.get('/', (req, res) => {
    // res.send("<h1>Hello World</h1>");
    res.json({message: "UniStay API is running"});
})

// Mount routes
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`)
})




