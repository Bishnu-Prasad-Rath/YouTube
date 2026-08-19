import mongoose from "mongoose";

const liveSchema = new mongoose.Schema({
  streamer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  isLive: {
    type: Boolean,
    default: true,
  },
  viewers: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  duration: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

liveSchema.index({
    isActive: 1,
    createdAt: -1,
});

liveSchema.index({
    streamer: 1,
    isActive: 1,
});

const Live = mongoose.model("Live", liveSchema);

export { Live };