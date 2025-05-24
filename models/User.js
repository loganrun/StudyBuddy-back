import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
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
  userType: {
    type: String,
    required: true
  },
  workbooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'workbook'
  }]
});

export default mongoose.model('user', UserSchema);
