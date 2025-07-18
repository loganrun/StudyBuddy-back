import express from 'express';
const router = express.Router();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import {User} from '../../models/User.js';
import { Notebook } from '../../models/User.js';
import auth from '../../middleware/auth.mjs'; 



router.get('/:id',  async function(req, res) {
    
  res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
  });
    try {
        const user = await User.findById(req.params.id)
        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
  
});

router.post('/', [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
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

  const { firstName,lastName, email, password, gradeLevel } = req.body;
  const userType = "student"
  

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json([{ msg: 'User already exists' }]);
    }

    user = new User({
      firstName,
      lastName,
      gradeLevel,
      email,
      password,
      userType
    });

    // Encrypt Password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save User
    await user.save();

    // Create a JWT
    const payload = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        gradeLevel: user.gradeLevel,
        userType: user.userType
      },
    };

    jwt.sign(
      payload,
      process.env.jwtSecret,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ ...payload, token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST /api/users/notebooks

router.post('/notebooks', [
  check('name', 'Notebook name is required').not().isEmpty(),
  check('subject', 'Subject is required').not().isEmpty()
], async (req, res) => {
  console.log(req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, subject, owner } = req.body;
    
    const notebook = new Notebook({
      name,
      subject,
      owner,
      notes: [],
      resources: []
    });

    await notebook.save();
    
    res.json(notebook);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET /api/users/notebooks

router.get('/notebooks', auth, async (req, res) => {
  try {
    const notebooks = await Notebook.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(notebooks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT /api/users/notebooks/:id
// @desc     Update a notebook
// @access   Private
router.put('/notebooks/:id', [
  
  check('name', 'Notebook name is required').not().isEmpty(),
  check('subject', 'Subject is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, subject, notes, resources } = req.body;
    let notebook = await Notebook.findById(req.params.id);
    console.log(notebook)
    console.log(req.params.id);
    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    // Check if user owns the notebook
    // if (notebook.owner.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: 'Not authorized' });
    // }

    // Update fields
    notebook.name = name;
    notebook.subject = subject;
    if (notes) notebook.notes = notes;
    if (resources) notebook.resources = resources;

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

router.delete('/notebooks/:id', async (req, res) => {
    try {
        const deletedNotebook = await Notebook.findByIdAndDelete(req.params.id);
        if (!deletedNotebook) {
            return res.status(404).json({ message: 'Notebook not found' }); 
        }
        res.json({ message: 'Notebook deleted' });
    } catch (err) {
        res.status(500).json({error: err.message})
    }
})

// @route    GET /api/users/notebooks/:id/download
// @desc     Download notebook as JSON
// @access   Private
router.get('/notebooks/:id/download', auth, async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.id);
    
    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    // Check if user owns the notebook
    if (notebook.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${notebook.name}.json"`);
    
    res.json(notebook);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notebook not found' });
    }
    res.status(500).send('Server Error');
  }
});

export default router;

