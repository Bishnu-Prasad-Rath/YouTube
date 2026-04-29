import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema({
  video: {
    type: Schema.Types.ObjectId,
    ref: "Video"
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment"
  },
  tweet: {
    type: Schema.Types.ObjectId,
    ref: "Tweet"
  },
  live: {
    type: Schema.Types.ObjectId,
    ref: "Live"
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
},{timestamps:true})

likeSchema.index(
  { likedBy: 1, video: 1 },
  { unique: true, partialFilterExpression: { video: { $exists: true } } }
)

likeSchema.index(
  { likedBy: 1, tweet: 1 },
  { unique: true, partialFilterExpression: { tweet: { $exists: true } } }
)

likeSchema.index(
  { likedBy: 1, comment: 1 },
  { unique: true, partialFilterExpression: { comment: { $exists: true } } }
)

likeSchema.index(
  { likedBy: 1, live: 1 },
  { unique: true, partialFilterExpression: { live: { $exists: true } } }
)

const Like = mongoose.model("Like", likeSchema)

export { Like }