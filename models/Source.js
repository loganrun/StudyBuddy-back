import mongoose from 'mongoose';

const SourceSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['book', 'article', 'website', 'video', 'other']
    },
    url: {
        type: String,
        required: false
    },
    author: {
        type: String,
        required: false
    },
    publicationDate: {
        type: Date,
        required: false
    },
    workbook: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'workbook',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('source', SourceSchema); 