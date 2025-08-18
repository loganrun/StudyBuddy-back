import express from 'express';
const router = express.Router();
import { check, validationResult } from 'express-validator';
import { Notebook } from '../../models/User.js';
import auth from '../../middleware/auth.mjs';

// @route    POST /api/notes/:notebookId
// @desc     Add a note to a notebook
// @access   Private
router.post('/:notebookId', 
    [
   
  check('title', 'Title is required').not().isEmpty(),
  check('content', 'Content is required').not().isEmpty()
], 
async (req, res) => {
    // console.log('Adding note to notebook');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content } = req.body;
    const notebook = await Notebook.findById(req.params.notebookId);

    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    const newNote = {
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    notebook.notes.push(newNote);
    await notebook.save();

    const addedNote = notebook.notes[notebook.notes.length - 1];
    res.json(addedNote);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notebook not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    PUT /api/notes/:notebookId/:noteId
// @desc     Update a note in a notebook
// @access   Private
router.put('/:notebookId/:noteId', [
  check('title', 'Title is required').not().isEmpty(),
  check('content', 'Content is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content } = req.body;
    const notebook = await Notebook.findById(req.params.notebookId);

    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    const note = notebook.notes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({ msg: 'Note not found' });
    }

    note.title = title;
    note.content = content;
    note.updatedAt = new Date();

    await notebook.save();
    res.json(note);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notebook or Note not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    GET /api/notes/:notebookId
// @desc     Get all notes from a notebook
// @access   Private
router.get('/:notebookId', async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.notebookId);

    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    res.json(notebook.notes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notebook not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    GET /api/notes/:notebookId/:noteId
// @desc     Get a specific note from a notebook
// @access   Private
router.get('/:notebookId/:noteId', async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.notebookId);

    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    const note = notebook.notes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({ msg: 'Note not found' });
    }

    res.json(note);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notebook or Note not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    DELETE /api/notes/:notebookId/:noteId
// @desc     Delete a note from a notebook
// @access   Private
router.delete('/:notebookId/:noteId', async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.notebookId);

    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    const note = notebook.notes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({ msg: 'Note not found' });
    }

    notebook.notes.pull(req.params.noteId);
    await notebook.save();

    res.json({ msg: 'Note deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notebook or Note not found' });
    }
    res.status(500).send('Server Error');
  }
});

export default router;