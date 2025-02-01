// server/tests/unit/urls.test.js
import { jest } from '@jest/globals';
import QRCode from 'qrcode';
import Url from '../../models/Url.js';
import router from '../../routes/urls.js';

describe('Unit tests for URL routes', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('GET /', () => {
    it('should return list of urls', async () => {
      const dummyUrls = [
        { originalUrl: 'https://www.arcube.org', shortId: 'abc123', qrCode: 'data:image/png;base64,...', clicks: 0 },
      ];
      Url.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(dummyUrls),
      });

      const getAllHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/' && layer.route.methods.get
      ).route.stack[0].handle;

      await getAllHandler(req, res);
      expect(Url.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(dummyUrls);
    });

    it('should handle server error', async () => {
      Url.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Test error')),
      });

      const getAllHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/' && layer.route.methods.get
      ).route.stack[0].handle;

      await getAllHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('POST /shorten', () => {
    beforeEach(() => {
      req.body = {};
    });

    it('should return 400 if URL is invalid', async () => {
      req.body.originalUrl = 'invalidurl';
      const postShortenHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/shorten' && layer.route.methods.post
      ).route.stack[0].handle;

      await postShortenHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid URL' });
    });

    it('should create a shortened URL when provided a valid URL', async () => {
      req.body.originalUrl = 'https://www.arcube.org';
      process.env.FRONTEND_URL = 'http://localhost:3000';

      QRCode.toDataURL = jest.fn().mockResolvedValue('dummyQRCode');

      const saveSpy = jest.spyOn(Url.prototype, 'save').mockResolvedValue();

      Object.defineProperty(Url.prototype, 'shortId', {
        get: () => 'customid',
      });

      const postShortenHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/shorten' && layer.route.methods.post
      ).route.stack[0].handle;

      await postShortenHandler(req, res);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(req.body.originalUrl);
      expect(saveSpy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        shortUrl: `${process.env.FRONTEND_URL}/customid`,
        qrCode: 'dummyQRCode',
      });

      saveSpy.mockRestore();
    });

    it('should handle server error during URL shortening', async () => {
      req.body.originalUrl = 'https://www.arcube.org';
      process.env.FRONTEND_URL = 'http://localhost:3000';
      QRCode.toDataURL = jest.fn().mockRejectedValue(new Error('Test error'));

      const postShortenHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/shorten' && layer.route.methods.post
      ).route.stack[0].handle;

      await postShortenHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('GET /:shortId', () => {
    beforeEach(() => {
      req.params = { shortId: 'abc123' };
    });

    it('should return original URL and increment clicks if found', async () => {
      const dummyUrl = { originalUrl: 'https://www.arcube.org', clicks: 0 };
      Url.findOneAndUpdate = jest.fn().mockResolvedValue(dummyUrl);

      const getShortHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.get
      ).route.stack[0].handle;

      await getShortHandler(req, res);
      expect(Url.findOneAndUpdate).toHaveBeenCalledWith(
        { shortId: req.params.shortId },
        { $inc: { clicks: 1 } },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({ originalUrl: dummyUrl.originalUrl });
    });

    it('should return 404 if URL not found', async () => {
      Url.findOneAndUpdate = jest.fn().mockResolvedValue(null);
      const getShortHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.get
      ).route.stack[0].handle;

      await getShortHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'URL not found' });
    });

    it('should handle server error', async () => {
      Url.findOneAndUpdate = jest.fn().mockRejectedValue(new Error('Test error'));
      const getShortHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.get
      ).route.stack[0].handle;

      await getShortHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('PUT /:shortId', () => {
    beforeEach(() => {
      req.params = { shortId: 'abc123' };
      req.body = {};
    });

    it('should return 400 if new shortId is invalid', async () => {
      req.body.shortId = 'abc'; // less than 4 characters
      const putHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.put
      ).route.stack[0].handle;

      await putHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Short ID must be at least 4 characters' });
    });

    it('should return 400 if custom URL is already taken', async () => {
      req.body.shortId = 'newid';
      // Simulate that a URL with the new shortId already exists
      Url.findOne = jest.fn().mockResolvedValue({ shortId: 'newid' });

      const putHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.put
      ).route.stack[0].handle;

      await putHandler(req, res);
      expect(Url.findOne).toHaveBeenCalledWith({ shortId: 'newid' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'This custom URL is already taken' });
    });

    it('should return 404 if URL not found', async () => {
      req.body.shortId = 'validid';
      Url.findOne = jest.fn().mockResolvedValue(null);
      Url.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      const putHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.put
      ).route.stack[0].handle;

      await putHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'URL not found' });
    });

    it('should update the URL when valid data is provided', async () => {
      req.body.shortId = 'validid';
      Url.findOne = jest.fn().mockResolvedValue(null);
      const updatedUrl = {
        originalUrl: 'https://www.arcube.org',
        shortId: 'validid',
        qrCode: 'dummyQRCode',
        clicks: 0,
      };
      Url.findOneAndUpdate = jest.fn().mockResolvedValue(updatedUrl);

      const putHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.put
      ).route.stack[0].handle;

      await putHandler(req, res);
      expect(Url.findOneAndUpdate).toHaveBeenCalledWith(
        { shortId: req.params.shortId },
        { shortId: req.body.shortId },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedUrl);
    });

    it('should handle server error', async () => {
      req.body.shortId = 'validid';
      Url.findOne = jest.fn().mockResolvedValue(null);
      Url.findOneAndUpdate = jest.fn().mockRejectedValue(new Error('Test error'));

      const putHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.put
      ).route.stack[0].handle;

      await putHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('DELETE /:shortId', () => {
    beforeEach(() => {
      req.params = { shortId: 'abc123' };
    });

    it('should return 404 if URL not found', async () => {
      Url.findOneAndDelete = jest.fn().mockResolvedValue(null);
      const deleteHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.delete
      ).route.stack[0].handle;

      await deleteHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'URL not found' });
    });

    it('should delete the URL successfully', async () => {
      const dummyUrl = { shortId: 'abc123' };
      Url.findOneAndDelete = jest.fn().mockResolvedValue(dummyUrl);

      const deleteHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.delete
      ).route.stack[0].handle;

      await deleteHandler(req, res);
      expect(Url.findOneAndDelete).toHaveBeenCalledWith({ shortId: req.params.shortId });
      expect(res.json).toHaveBeenCalledWith({ message: 'URL deleted successfully' });
    });

    it('should handle server error', async () => {
      Url.findOneAndDelete = jest.fn().mockRejectedValue(new Error('Test error'));
      const deleteHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/:shortId' && layer.route.methods.delete
      ).route.stack[0].handle;

      await deleteHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });
});
