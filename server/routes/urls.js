const express = require('express');
const router = express.Router();

router.get('/test', async (req, res) => {
    try {
      const connectionState = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      res.json({
        databaseStatus: states[connectionState],
        message: connectionState === 1 
          ? 'Database connection successful!'
          : 'Connection in progress or failed'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;