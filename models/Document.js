import mongoose from 'mongoose';

const Document = new mongoose.Schema({
  _id: String,
  data: Object,
})

export default mongoose.model("document", Document)