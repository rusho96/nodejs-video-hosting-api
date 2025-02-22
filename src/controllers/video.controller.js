import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {v2 as cloudinary} from "cloudinary"
import getVideoDuration from "../utils/duration.js"
import { Types } from "mongoose"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    console.log(sortBy,sortType)
     
    //pagination
    const sort={[sortBy]:sortType === "asc" ? 1:-1 }

    console.log(sort)

    const skip=(Number(page)-1)*Number(limit)

    //pipeline
    const pipeline=[]
    const matchCondition = {}
    

    if(query){
        matchCondition.title={$regex:query,$options:"i"}
    }

    if(userId && isValidObjectId(userId)){
        matchCondition.owner= new mongoose.Types.ObjectId(userId)
    }

    if(Object.keys(matchCondition).length>0){
        pipeline.push({$match:matchCondition}) 
    }

    pipeline.push({$sort:sort})

    //console.log(pipeline)

    pipeline.push({$skip:skip})
    pipeline.push({$limit:Number(limit)})

    console.log(pipeline)

    const aggregationPipeline = [
        {
            $facet:{
                videos:pipeline,
                totalCount:[{$match:matchCondition},{$count:"count"}]
            }
        },
        {
            $addFields:{
                totalCount:{
                    $arrayElemAt:["$totalCount.count",0]
                }
            }
        }
    ]

    console.log(aggregationPipeline)

    const result= await Video.aggregate(aggregationPipeline)

    console.log(result)


    return res
    .status(200)
    .json(
         new ApiResponse(200,result,"result has been fetched successfully") 
    )



})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const userId = req.user._id
    if(!title || !description){
        throw new ApiError(404, "title or description is not delivered")
    }

    const videoFilePath = req.files.videoFile[0]?.path
    if(!videoFilePath){
        throw new ApiError(400,"videofilePath is required")
    }

    //console.log(videoFilePath)

    const thumbnailPath = req.files.thumbnail[0]?.path
    if(!thumbnailPath){
        throw new ApiError(400,"thumbnailPath is required")
    }
    
    //console.log(thumbnailPath)
    

    const videoFile = await uploadOnCloudinary(videoFilePath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    console.log(videoFile)
    //console.log(thumbnail)
    
    if(!videoFile || !thumbnail){
        throw new ApiError(400, "File is required") 
    }

    const duration = (videoFile.duration).toFixed(2)
 
    const video = await Video.create({

        title,
        videoFile:videoFile.secure_url,
        cloudVideoId:videoFile.public_id,
        thumbnail:thumbnail.secure_url,
        thumbnailId:thumbnail.public_id,
        description,
        duration:duration,
        owner:userId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"video has been published")
    )

})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId= req.user._id
    
    if(!videoId){
        throw new ApiError(400,"videoId is required")
    }

    console.log(videoId)

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid videoId")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {$inc:{views:1}},
        {new:true}
    )

    if(!video){
        throw new ApiError(404,"video has not found")
    }

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $addToSet:{watchHistory:videoId}
        },
        {new:true}
    ).select("-password -refreashToken")

    return res
    .status(200)
    .json(
         new ApiResponse(200,video,"video has been fetched")
    )
    
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description}=req.body

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"provide correct videoId")
    }
    
    

    const video = await Video.findOne(videoId)

    if(!video){
        throw new ApiError(404,"No video is found") 
    }
    
    const userId =new mongoose.Types.ObjectId(req.user._id); 

    if (!video.owner.equals(userId)) { 
        throw new ApiError(400, "Unauthorized access");
    }

    if(title){
        video.title=title 
    }

    if(description){
        video.description=description
    }

    if(video.thumbnailId){
        cloudinary.uploader.destroy(video.thumbnailId)
    }

    //console.log(req.file)
    
    const newThumbnailPath = req.file?.path
    

    const newThumbnail = await uploadOnCloudinary(newThumbnailPath)


    if(newThumbnail){
        video.thumbnail=newThumbnail.secure_url
        video.thumbnailId=newThumbnail.public_id
    }

    const updateVideo = await video.save()
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,updateVideo,"video has updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Provide valid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"video doesn't exist")
    }

    const userId =new mongoose.Types.ObjectId(req.user._id); 

    if (!video.owner.equals(userId)) { 
        throw new ApiError(400, "Unauthorized access");
    }

    if(video.cloudVideoId){
        await cloudinary.uploader.destroy(video.cloudVideoId)
    }

    if(video.thumbnailId){
        await cloudinary.uploader.destroy(video.thumbnailId) 
    }

    await video.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, " Video has been deleted")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Provide valid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video does not exist")
    }

    const userId =new mongoose.Types.ObjectId(req.user._id);  

    if (!video.owner.equals(userId)) { 
        throw new ApiError(400, "Unauthorized access");
    }

    video.isPublished= !video.isPublished

    const updatedVideo= await video.save()

    return res
    .status(200)
    .json(
        new  ApiResponse(200,updatedVideo,"PublisStatus has been toggled")
    )
})

const removeFromWatchHistory= asyncHandler(async(req,res) =>{
    const {videoId} = req.params
    const userId = req.user._id

    const user = await findByIdAndUpdate(
        userId,
        { $pull: { watchHistory : videoId}},
        { new:true}
    ).select("-password -refreashToken")

    if(!user){
        throw new ApiError(404,"User is not found")
    }

    return res.stutus(200).json(
        new ApiResponse(200,user,"Video is removed from watchHistory")
    )
})

const clearWatchHistory = asyncHandler (async(req,res)=>{
    const userId = req.user._id

    const user = await findByIdAndUpdate(
        userId,
        {watchHistory: [] },
        {new:true}
    ).select("-password -refreashToken")

    if(!user){
        throw new ApiError(404,"User is not found")
    }

    return res.status(200).json(
        new ApiResponse(200,user,"WatchHistory is cleared successfully")
    )
})



export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    removeFromWatchHistory,
    clearWatchHistory
}