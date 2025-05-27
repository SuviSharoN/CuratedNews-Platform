import mongoose from 'mongoose';

const interestsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interests: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length <= 4;
      },
      message: 'Maximum 4 interests allowed'
    }
  },
  email: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Interests', interestsSchema); 