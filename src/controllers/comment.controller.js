import mongoose,{isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getVideoComment = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {page=1,limit=10} = req.query

    const commentLimit = parseInt(limit,10)
    const skipComment = (parseInt(page,10)-1)*commentLimit

    if(!videoId){
        throw new ApiError(404, "videoId is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const isVideoExist = await Video.findById(videoId)

    if(!isVideoExist){
        throw new ApiError(404, "No video is found")
    }
    
    //console.log(videoId)
    const videoComment = await Comment.aggregate(
        [
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $sort:{updatedAt:1}
            },
            {
                $skip:skipComment
            },
            {
                $limit:commentLimit
            }
        
        ]
    )

    

    return res
    .status(200)
    .json(
        new ApiResponse(200,videoComment,"Comment has been fetched successfully")
    )
})

const addComment = asyncHandler(async(req,res)=>{
    const {content} = req.body
    const {videoId} = req.params

    if(!videoId){
        throw new ApiError(404, "videoId is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const isVideoExist = await Video.findById(videoId)

    if(!isVideoExist){
        throw new ApiError(404, "No video is found")
    }

    if(!content){
        throw new ApiError(404, "content is required")
    }

    const newComment = await Comment.create({
        content:content,
        video:videoId,
        owner:req.user._id
    })

    console.log(newComment)

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Comment has been added successfully")
    )


})

const updateComment = asyncHandler(async(req,res)=>{
    const {content} = req.body
    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(404,"commentId is required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid commentId")
    }

    const isCommentExist = await Comment.findById(commentId)
    
    if(!isCommentExist){
        throw new ApiError(404,"No comment is found")
    }
    //console.log(req.body)
    if(isCommentExist?.owner.toString() !== req.user._id.toString()){
        throw new ApiError(404,"You can not edit this")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {$set:{content:content}},
        {new:true}
    )

    console.log(updatedComment)

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Comment has been updated successfully")
    )

})

const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(404,"commentId is required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid commentId")
    }

    const isCommentExist = await Comment.findById(commentId)
    
    if(!isCommentExist){
        throw new ApiError(404,"No comment is found")
    }

    if(isCommentExist?.owner.toString() !==req.user._id.toString()){
        throw new ApiError(404,"You can not edit this")
    }

    const deletedComment = await Comment.findByIdAndDelete(
        commentId
    )

    console.log(deletedComment)

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Comment has deleted successfully")
    )
})

export {getVideoComment,addComment,updateComment,deleteComment}