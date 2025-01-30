import express from "express";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import validator from "validator";
import Url from "../models/Url.js";

const router = express.Router();

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
      shortUrl: `${process.env.BASE_URL}/${url.shortId}`,
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
      return res.redirect(url.originalUrl);
    }
    res.status(404).json({ error: "URL not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;