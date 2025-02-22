import mongoose, {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async(req,res)=>{

    
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid videoId")
    }

    const existVideo = await Video.findById(videoId)
    
    if(!existVideo){
        throw new ApiError(404,"Video does not exist")
    }

    const userId = new mongoose.Types.ObjectId(req.user._id)
    const like = async function(){
        const newLike = await Like.create(
            {
                video:videoId,
                likedBy:userId
            }
        )

        return newLike
    }

    const unLike = async function(){
        const deletedLike = await Like.deleteOne({
            video:videoId,
            likedBy:userId
        })

        return deletedLike
    }

    

    const isVideoLiked = await Like.find({
        video:videoId,
        likedBy:userId
    })

    if(isVideoLiked.length === 0){
        const newLike = await like()
        console.log(`user ${req.user.fullName} liked the video ${videoId}`)
    }
    
    else{
        const deletedLike = await unLike()
        console.log(`user ${req.user.fullName} unlike the video ${videoId}`)
    }
    
    return res
           .status(200)
           .json(
              new ApiResponse(200,"Like is toggled on video successfully")
           )

})

const toggleCommentLike = asyncHandler(async(req,res)=>{

    const {commentId} = req.params
    const userId = new mongoose.Types.ObjectId(req.user._id)
    if(!isValidObjectId(commentId)){
        throw new ApiError(404,"Invalid commentId")
    }
    const existComment = await Comment.findById(commentId)

    if(!existComment){
        throw new ApiError()
    }

    const like = async function(){
        const newLike = await Like.create({
            comment:commentId,
            likedBy:userId
        })

        return newLike
    }

    const unlike = async function(){
        const deletedLike = await Like.deleteOne({
            comment:commentId,
            likedBy:userId
        })

        return deletedLike
    }

    
    const isCommentLiked = await Like.find({
        comment:commentId,
        likedBy:userId
    })
    
    if(isCommentLiked.length===0){
        const newLike = await like()
        console.log(`user ${req.user.fullName} liked the comment ${commentId}`)
    }

    else{
        const deletedLike = await unlike()
        console.log(`user ${req.user.fullName} disliked the comment ${commentId}`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Like is toggled on comment successfully")
    )
    
})

const getAllLikedVideos = asyncHandler(async(req,res)=>{

    
const likedVideos = await Like.aggregate([
    {
        $match:{
            likedBy:new mongoose.Types.ObjectId(req.user._id)
        } 
    },
    {
        $lookup:{
            from:"videos",
            localField:"video",
            foreignField:"_id",
            as:"likedVid"
        }
    },
    {
        $unwind:"$likedVid"
    },
    {
        $project:{
            _id:0,
            videoId:"$video",
            videoDetail:{
                title:"$likedVid.title",
                thumbnail:"$likedVid.thumbnail",
                videoFile:"$likedVid.videoFile"

            }
        }
    }

])


return res
.status(200)
.json(
   new ApiResponse(200,likedVideos,"liked videos are fetched successfully")
)
    
})

//getLikedComment lekha hoynai

export {toggleVideoLike,toggleCommentLike,getAllLikedVideos}
