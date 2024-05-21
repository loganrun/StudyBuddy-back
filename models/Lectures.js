import mongoose from 'mongoose';
//import { useId } from 'react';

const LectureSchema = new mongoose.Schema({
  subject: {
    type: String,
    
  },
  userId:{
    type: String
  },
  url: {
    type: String,
  },
  transcript: {
    type: String,
  },
  summary:{
    type: String,
  },
  date:{
    type: String,
  },
  notes:{
    type: String,
  }
});

export default mongoose.model('lecture', LectureSchema);

