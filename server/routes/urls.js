import express from "express";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import validator from "validator";
import Url from "../models/Url.js";

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const urls = await Url.find().sort({ createdAt: -1 });
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post("/shorten", async (req, res) => {
  const { originalUrl } = req.body;

  if (!validator.isURL(originalUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const qrCode = await QRCode.toDataURL(originalUrl);

    const url = new Url({
      originalUrl,
      shortId: nanoid(8),
      qrCode,
    });

    await url.save();

    res.json({
      shortUrl: `${process.env.FRONTEND_URL}/${url.shortId}`,
      qrCode: url.qrCode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:shortId", async (req, res) => {
  try {
    const url = await Url.findOneAndUpdate(
      { shortId: req.params.shortId },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (url) {
      return res.json({ originalUrl: url.originalUrl });
    }
    res.status(404).json({ error: "URL not found" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put('/:shortId', async (req, res) => {
  const { shortId: newShortId } = req.body;

  if (!newShortId || newShortId.length < 4) {
    return res.status(400).json({ error: "Short ID must be at least 4 characters" });
  }

  try {
    const existingUrl = await Url.findOne({ shortId: newShortId });
    if (existingUrl) {
      return res.status(400).json({ error: "This custom URL is already taken" });
    }

    const url = await Url.findOneAndUpdate(
      { shortId: req.params.shortId },
      { shortId: newShortId },
      { new: true }
    );
    
    if (!url) return res.status(404).json({ error: "URL not found" });
    res.json(url);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


router.delete('/:shortId', async (req, res) => {
  try {
    const url = await Url.findOneAndDelete({ shortId: req.params.shortId });
    if (!url) return res.status(404).json({ error: "URL not found" });
    res.json({ message: "URL deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


export default router;