import mongoose,{Schema} from "mongoose";

const tweetSchema = new Schema({
content : {
    type : String,
    required : true
},
owner : {
    type : Schema.Types.ObjectId,
    ref : "User"
}
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

tweetSchema.virtual("replies", {
    ref: "Comment",
    localField: "_id",
    foreignField: "tweet"
});

tweetSchema.set("toJSON", {
    transform : (doc,ret) => {
        delete ret.owner.password
    }
})
const Tweet = mongoose.model("Tweet",tweetSchema)

export {Tweet}