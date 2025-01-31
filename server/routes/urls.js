import express from "express";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import validator from "validator";
import Url from "../models/Url.js";

const router = express.Router();

// Extract handlers into named functions
export const getAllUrlsHandler = async (req, res) => {
  try {
    const urls = await Url.find().sort({ createdAt: -1 });
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const shortenHandler = async (req, res) => {
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
};

export const redirectHandler = async (req, res) => {
  try {
    const url = await Url.findOneAndUpdate(
      { shortId: req.params.shortId },
      { $inc: { clicks: 1 } },
      { new: true }
    );
    url
      ? res.json({ originalUrl: url.originalUrl })
      : res.status(404).json({ error: "URL not found" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateHandler = async (req, res) => {
  const { shortId: newShortId } = req.body;

  if (!newShortId || newShortId.length < 4) {
    return res
      .status(400)
      .json({ error: "Short ID must be at least 4 characters" });
  }

  try {
    if (await Url.findOne({ shortId: newShortId })) {
      return res
        .status(400)
        .json({ error: "This custom URL is already taken" });
    }
    const url = await Url.findOneAndUpdate(
      { shortId: req.params.shortId },
      { shortId: newShortId },
      { new: true }
    );
    url ? res.json(url) : res.status(404).json({ error: "URL not found" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteHandler = async (req, res) => {
  try {
    const url = await Url.findOneAndDelete({ shortId: req.params.shortId });
    url
      ? res.json({ message: "URL deleted successfully" })
      : res.status(404).json({ error: "URL not found" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * @swagger
 * /:
 *   get:
 *     summary: Fetch all URLs
 *     description: Retrieves all stored URLs sorted by creation date in descending order.
 *     responses:
 *       200:
 *         description: A list of URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   originalUrl:
 *                     type: string
 *                   shortId:
 *                     type: string
 *                   qrCode:
 *                     type: string
 *                   clicks:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
router.get("/", getAllUrlsHandler);
/**
 * @swagger
 * /shorten:
 *   post:
 *     summary: Create a shortened URL
 *     description: Generates a shortened URL and QR code for the provided original URL.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 example: https://example.com
 *     responses:
 *       200:
 *         description: Successfully created shortened URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortUrl:
 *                   type: string
 *                   example: http://yourfrontend.com/abc12345
 *                 qrCode:
 *                   type: string
 *                   example: data:image/png;base64,...
 *       400:
 *         description: Invalid URL
 *       500:
 *         description: Server error
 */
router.post("/shorten", shortenHandler);
/**
 * @swagger
 * /{shortId}:
 *   get:
 *     summary: Redirect to original URL
 *     description: Fetches the original URL associated with the given shortId.
 *     parameters:
 *       - in: path
 *         name: shortId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier for the shortened URL.
 *     responses:
 *       200:
 *         description: Original URL found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 originalUrl:
 *                   type: string
 *                   example: https://example.com
 *       404:
 *         description: URL not found
 *       500:
 *         description: Server error
 */
router.get("/:shortId", redirectHandler);
/**
 * @swagger
 * /{shortId}:
 *   put:
 *     summary: Update shortId
 *     description: Updates the shortId of an existing URL.
 *     parameters:
 *       - in: path
 *         name: shortId
 *         required: true
 *         schema:
 *           type: string
 *         description: The current unique identifier for the shortened URL.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shortId:
 *                 type: string
 *                 example: newShortId123
 *     responses:
 *       200:
 *         description: Successfully updated shortId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 originalUrl:
 *                   type: string
 *                 shortId:
 *                   type: string
 *                 qrCode:
 *                   type: string
 *                 clicks:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input or custom URL already taken
 *       404:
 *         description: URL not found
 *       500:
 *         description: Server error
 */
router.put("/:shortId", updateHandler);
/**
 * @swagger
 * /{shortId}:
 *   delete:
 *     summary: Delete a URL
 *     description: Deletes a URL record from the database.
 *     parameters:
 *       - in: path
 *         name: shortId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier for the shortened URL.
 *     responses:
 *       200:
 *         description: Successfully deleted URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: URL deleted successfully
 *       404:
 *         description: URL not found
 *       500:
 *         description: Server error
 */
router.delete("/:shortId", deleteHandler);

export default router;