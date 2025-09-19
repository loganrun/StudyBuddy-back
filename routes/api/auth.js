import express from 'express';
const router = express.Router();
import auth from '../../middleware/auth.mjs'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import {User} from '../../models/User.js';
import { Notebook } from '../../models/User.js'; 

// @route: GET api/auth
// @desc: Test route
// @access: Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

router.post(
  '/',
  [check('email', 'Please include a valid email').isEmail(), check('password', 'Password required').exists()],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      //console.log(user);

      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // Fetch user's notebooks (limit to last 10)
      const notebooks = await Notebook.find({ owner: user.id }).sort({ createdAt: -1 }).limit(10);

      const payload = {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          grade: user.grade,
          userType: user.userType,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          lastActivityDate: user.lastActivityDate,
          streakStartDate: user.streakStartDate,
          notebooks: notebooks
          
        },
      };

      jwt.sign(
        payload,
        process.env.jwtSecret,
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err;
          res.json({ token, payload});
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);



export default router;

