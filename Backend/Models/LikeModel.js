// Backend/models/LikeModel.js
import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Matches the 'User' model name
    required: [true, 'User ID is required for a like.'],
    index: true
  },
  articleUrl: {
    type: String,
    required: [true, 'Article URL is required for a like.'],
    trim: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index: Prevents the same user liking the same articleUrl twice
likeSchema.index({ userId: 1, articleUrl: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);
export default Like;