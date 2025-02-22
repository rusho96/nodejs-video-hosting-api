import mongoose ,  { Schema } from "mongoose";

import aggregatePaginate from "mongoose-aggregate-paginate-v2"; 

const playlistSchema = new Schema({
    name:{
        type:String,
        required:true
    },

    description:{
        type:String
    },

    videos:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],

    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

playlistSchema.plugin(aggregatePaginate)

export const Playlist = mongoose.model("Playlist",playlistSchema)
