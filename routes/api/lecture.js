import express from 'express'
const router = express.Router();
import Lectures from '../../models/Lectures.js'

// Create a new lecture (POST)
router.post('/', async (req, res) => {
    try {
        const newLecture = new Lectures(req.body);
        const savedLecture = await newLecture.save();
        res.status(201).json(savedLecture); // Created
    } catch (err) {
        res.status(400).json({ error: err.message }); // Bad request
    }
});

// Get all lectures (GET)
router.get('/', async (req, res) => {
    try {
        const lectures = await Lectures.find();
        res.json(lectures);
    } catch (err) {
        res.status(500).json({ error: err.message }); // Internal server error
    }
});

// Get a single lecture by ID (GET)
router.get('/:id', async (req, res) => {
    try {
        const lecture = await Lectures.findById(req.params.id);
        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' }); // Not found
        }
        res.json(lecture);
    } catch (err) {
        res.status(500).json({ error: err.message }); // Internal server error
    }
});

// Update a lecture by ID (PUT)
router.put('/:id', async (req, res) => {
    const { notes } = req.body;

    try {
        const updatedLecture = await Lectures.findByIdAndUpdate(
            req.params.id,
            { $set: { notes } }, // Update specific fields
            { new: true } // Return the updated document
        );
        if (!updatedLecture) {
            return res.status(404).json({ message: 'Lecture not found' }); // Not found
        }
        res.json(updatedLecture);
    } catch (err) {
        res.status(400).json({ error: err.message }); // Bad request
    }
});

// Delete a lecture by ID (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const deletedLecture = await Lectures.findByIdAndDelete(req.params.id);
        if (!deletedLecture) {
            return res.status(404).json({ message: 'Lecture not found' }); // Not found
        }
        res.json({ message: 'Lecture deleted' });
    } catch (err) {
        res.status(500).json({error: err.message})
    }
})

export default router;
