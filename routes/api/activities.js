import express from 'express';
const router = express.Router();
import { check, validationResult } from 'express-validator';
import { User } from '../../models/User.js';
import auth from '../../middleware/auth.mjs';

// @route    POST /api/activities/record
// @desc     Record a new activity and update streak
// @access   Private
router.post('/record', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const now = new Date();
    const lastActivityDate = user.lastActivityDate ? new Date(user.lastActivityDate) : null;

    // If no previous activity, start a new streak
    if (!lastActivityDate) {
      user.currentStreak = 1;
      user.longestStreak = Math.max(user.longestStreak || 0, 1);
      user.lastActivityDate = now;
      user.streakStartDate = now;
    }
    // If activity is on the same day, don't change streak
    else if (lastActivityDate.toDateString() === now.toDateString()) {
      user.lastActivityDate = now;
    }
    // If activity is on consecutive day, increment streak
    else {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const daysDiff = Math.floor((now - lastActivityDate) / oneDayMs);
      
      if (daysDiff === 1) {
        user.currentStreak = (user.currentStreak || 0) + 1;
        user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
        user.lastActivityDate = now;
      } else {
        // If gap is more than one day, reset streak
        user.currentStreak = 1;
        user.lastActivityDate = now;
        user.streakStartDate = now;
      }
    }

    await user.save();

    res.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
      streakStartDate: user.streakStartDate
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET /api/activities/streak
// @desc     Get user streak information
// @access   Private
router.get('/streak', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastActivityDate: user.lastActivityDate,
      streakStartDate: user.streakStartDate
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT /api/activities/streak/reset
// @desc     Reset user streak
// @access   Private
router.put('/streak/reset', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.currentStreak = 0;
    user.lastActivityDate = null;
    user.streakStartDate = null;

    await user.save();

    res.json({
      msg: 'Streak reset successfully',
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
      streakStartDate: user.streakStartDate
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT /api/activities/streak/update
// @desc     Manually update streak values
// @access   Private
router.put('/streak/update', [
  auth,
  check('currentStreak', 'Current streak must be a number').optional().isNumeric(),
  check('longestStreak', 'Longest streak must be a number').optional().isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const { currentStreak, longestStreak, lastActivityDate, streakStartDate } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (currentStreak !== undefined) user.currentStreak = currentStreak;
    if (longestStreak !== undefined) user.longestStreak = longestStreak;
    if (lastActivityDate !== undefined) user.lastActivityDate = lastActivityDate ? new Date(lastActivityDate) : null;
    if (streakStartDate !== undefined) user.streakStartDate = streakStartDate ? new Date(streakStartDate) : null;

    await user.save();

    res.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
      streakStartDate: user.streakStartDate
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

export default router;