import mongoose,{Schema} from "mongoose";

const playlistSchema = new Schema({
name : {
    type : String,
    required : true
},
description : {
    type : String,
    required : true
},
videos : [{
    type : Schema.Types.ObjectId,
    ref : "Video"
}],
owner : {
    type : Schema.Types.ObjectId,
    ref : "User"
} 
},{timestamps : true})

playlistSchema.set("toJSON", {
    transform : (doc,ret) => {
        delete ret.owner.password
    }
})
const Playlist = mongoose.model("Playlist",playlistSchema)

export {Playlist}