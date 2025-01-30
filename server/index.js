require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const urlsRouter = require('./routes/urls');

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api', urlsRouter);

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));