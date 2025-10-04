import express from 'express';
const router = express.Router();
import { check, validationResult } from 'express-validator';
import { User } from '../../models/User.js';
import { Notebook } from '../../models/User.js';
//import auth from '../../middleware/auth.mjs';

// @route    POST /api/activities/record
// @desc     Record a new activity and update streak
// @access   Private
router.put('/notebook/:id', [
  
  check('current', 'Current streak needed').not().isEmpty(),
  check('longest', 'Longest Streak is required').not().isEmpty()
  ], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { current, longest } = req.body;
    let notebook = await Notebook.findById(req.params.id);
    //console.log(notebook)
    //console.log(req.params.id);
    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    // Check if user owns the notebook
    // if (notebook.owner.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: 'Not authorized' });


    // Update fields
    notebook.currentStreak = current;
    notebook.longestStreak = longest;
    notebook.lastActivityDate = new Date();

    await notebook.save();
    
    res.json(notebook);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notebook not found' });
    }
    res.status(500).send('Server Error');
  }
});

router.put('/user/:id', [
  
  check('current', 'Current streak needed').not().isEmpty(),
  check('longest', 'Longest Streak is required').not().isEmpty()
  ], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { current, longest } = req.body;
    let user = await User.findById(req.params.id);
    //console.log(notebook)
    //console.log(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    // Check if user owns the notebook
    // if (notebook.owner.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: 'Not authorized' });


    // Update fields
    user.currentStreak = current;
    user.longestStreak = longest;
    user.lastActivityDate = new Date();

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});


export default router;