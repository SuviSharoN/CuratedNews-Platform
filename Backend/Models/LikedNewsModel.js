// Backend/models/LikedNewsModel.js
import mongoose from 'mongoose';

const likedNewsSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Article URL is required.'],
    unique: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Article title is required.'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sourceName: {
    type: String,
    trim: true
  },
  urlToImage: {
    type: String,
    trim: true
  },
  publishedAt: {
    type: Date
  },
  firstSeenAt: { // Renamed for clarity
    type: Date,
    default: Date.now
  }
  // No likeCount here
});

const LikedNews = mongoose.model('LikedNews', likedNewsSchema);
export default LikedNews;