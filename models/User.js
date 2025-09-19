import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  grade: {
    type: String,
    required: true,
    min: 0,
    max: 12
  },

  email: {
    type: String,
    required: true,
  },
  currentStreak: {
    type: Number
  },
  longestStreak: {
    type: Number
  },
  lastActivityDate: {
    type: Date
  },
  streakStartDate: {
    type: Date
  },
  password: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    required: true
  },
  notebooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notebook'
  }]
}, {
  timestamps: true
});

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: [{}],
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

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['link', 'file', 'document', 'video', 'other'],
    required: true
  },
  url: {
    type: String,
    required: function() {
      return this.type === 'link' || this.type === 'video';
    }
  },
  filePath: {
    type: String,
    required: function() {
      return this.type === 'file' || this.type === 'document';
    }
  },
  description: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const homeworkSchema = new mongoose.Schema({

  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  processedWork: {
    type: String,
    
  },
  work: {
    type: String
    
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

const notebookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  notes: [noteSchema],
  resources: [resourceSchema],
  homework: [homeworkSchema]
}, {
  timestamps: true
});

// export default mongoose.model('user', UserSchema);

const User = mongoose.model('User', UserSchema);
const Notebook = mongoose.model('Notebook', notebookSchema);
export { User, Notebook, noteSchema, resourceSchema, homeworkSchema };
