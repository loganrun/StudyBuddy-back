import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    workbook: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'workbook',
        required: true
    },
    source: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'source',
        required: false
    },
    tags: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('note', NoteSchema); 