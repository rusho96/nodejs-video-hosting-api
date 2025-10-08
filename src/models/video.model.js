import mongoose ,  { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2"; 

const videoSchema = new Schema({
     title:{
        type:String,
        required:true
     },
     videoFile:{
        type:String,
        required:true
     },
     cloudVideoId:{
      type:String
     },
     thumbnail:{
        type:String,
     },
     thumbnailId:{
        type:String
     },
     description:{
        type:String,
        required:true
     },
     duration:{
        type:Number,
        default:0
     },
     views:{
        type:Number,
        default:0
     },
     isPublished:{
        type:Boolean,
        default:true
     },
     owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
     }
},{timestamps:true})

videoSchema.plugin(aggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)