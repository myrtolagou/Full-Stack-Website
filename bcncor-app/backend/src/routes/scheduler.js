const { Router }        = require('express');
const db                = require('../config/db');
const { reloadSchedules } = require('../services/schedulerService');

const router = Router();

// GET /api/scheduler/settings
router.get('/settings', async (_req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM scheduler_settings ORDER BY id');
    res.json({ settings: rows });
  } catch (err) { next(err); }
});

// POST /api/scheduler/settings
// Body: { settings: [{ pipeline, enabled, frequency, day, time, lookback_days }, ...] }
router.post('/settings', async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings) || settings.length === 0)
      return res.status(400).json({ message: 'settings array is required' });

    for (const s of settings) {
      await db.query(
        `INSERT INTO scheduler_settings (pipeline, enabled, frequency, day, time, lookback_days)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (pipeline) DO UPDATE
           SET enabled=$2, frequency=$3, day=$4, time=$5, lookback_days=$6`,
        [s.pipeline, s.enabled ?? false, s.frequency ?? 'Weekly', s.day ?? 'Monday', s.time ?? '09:00', s.lookback_days ?? 7]
      );
    }

    await reloadSchedules();

    const { rows } = await db.query('SELECT * FROM scheduler_settings ORDER BY id');
    res.json({ settings: rows });
  } catch (err) { next(err); }
});

module.exports = router;
