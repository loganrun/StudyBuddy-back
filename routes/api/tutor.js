import express from 'express';
const router = express.Router();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import Tutor from '../../models/Tutor.js';
import mongoose from 'mongoose';

// @route: GET api/users
// @desc: Test route
// @access: Public
router.get('/', (req, res) => res.send('Tutor Route'));

// @route: POST api/users
// @desc: Register User and Get JWT
// @access: Public
router.post('/', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check(
    'password',
    'Please enter a password with 6 characters or more'
  ).isLength({ min: 6 }),
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // To test information being sent
  // return res.send(req.body)

  const { name, email, password,userName } = req.body;
  const roomId = new mongoose.Types.ObjectId().toString();  // Generate a new room ID
  const documentId = new mongoose.Types.ObjectId().toString();
  const userType = "tutor"

  try {
    // Check if user already exists
    let tutor = await Tutor.findOne({ email });
    if (tutor) {
      return res.status(400).json([{ msg: 'User already exists' }]);
    }

    tutor = new Tutor({
      name,
      email,
      password,
      userName,
      roomId,
      documentId,
      userType  
    });

    // Encrypt Password
    const salt = await bcrypt.genSalt(10);
    tutor.password = await bcrypt.hash(password, salt);

    // Save User
    await tutor.save();

    // Create a JWT
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
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;