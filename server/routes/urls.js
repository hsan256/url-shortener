import express from "express";
import Url from "../models/Url.js";

const router = express.Router();

router.post('/test-create', async (req, res) => {
  try {
    const testDoc = await Url.create({
      originalUrl: 'https://www.arcube.org/',
      shortId: 'test123',
      qrCode: 'test-qr'
    });
    
    res.json({
      success: true,
      document: testDoc
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/test", async (req, res) => {
  try {
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    res.json({
      databaseStatus: states[connectionState],
      message:
        connectionState === 1
          ? "Database connection successful!"
          : "Connection in progress or failed",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;