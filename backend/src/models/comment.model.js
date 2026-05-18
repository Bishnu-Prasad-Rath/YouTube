import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
{
    content : {
        type : String,
        required : true
    },
    video : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    tweet : {
        type : Schema.Types.ObjectId,
        ref : "Tweet"
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
}
,{timestamps : true})

commentSchema.plugin(mongooseAggregatePaginate);
commentSchema.index({ video: 1, createdAt: -1 });


const Comment = mongoose.model("Comment",commentSchema) 
 
export {Comment}