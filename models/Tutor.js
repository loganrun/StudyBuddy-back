import mongoose from 'mongoose';

const TutorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
    unique: true
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  documentId: {
    type: String,
    required: true,
    unique: true,
    data: Object
  },
  userType: {
    type: String,
    required: true
  }
});

export default mongoose.model('tutor', TutorSchema);