import express from 'express';
const router = express.Router();
import auth from '../../middleware/auth.mjs'; // Assuming auth.js is an ESM module
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import Tutor from '../../models/Tutor.js';

// @route: GET api/auth
// @desc: Test route
// @access: Public
router.get('/', auth, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.tutor.id).select('password');
    res.json(tutor);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

router.post(
  '/',
  [check('email', 'Please include a valid email').isEmail(), check('password', 'Password required').exists()],
  async (req, res) => {
    console.log("tutor route")
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let tutor = await Tutor.findOne({ email });

      if (!tutor) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const isMatch = await bcrypt.compare(password, tutor.password);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const payload = {
        tutor: {
          id: tutor.id,
          name: tutor.name,
          userName: tutor.userName,
          roomId: tutor.roomId,
          documentId: tutor.documentId,
          userType: tutor.userType
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
