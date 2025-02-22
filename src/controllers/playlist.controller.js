
import mongoose ,{isValidObjectId} from "mongoose";
import { User } from '../models/user.model.js';
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async(req,res)=>{ 

    const {name,description} = req.body

    const {videoId} = req.params 
    
    if(!(name||videoId)){
        throw new ApiError(404,"Name and Video are required")
    }
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }
    
    const existVideo = await Video.findById(videoId)

    if(!existVideo){
        throw new ApiError(404,"Video does not exist")
    }

    const createdPlaylist = await Playlist.create({
        name:name,
        ...(description && {description:description}),
        videos:videoId,
        owner:req.user._id

    })

    if(!createdPlaylist){
        throw new ApiError(500,"Playlist is not created")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdPlaylist , "Playlist has been created successfully")
    )

})

const getUserPlaylists = asyncHandler(async(req,res)=>{

    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(404,"Invalied userId")
    }

    const existUser = await User.findById(userId)

    if(!existUser){
        throw new ApiError(400,"user does not exist")
    }

    const playlist = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort:{updatedAt:1}
        },

    ])

    console.log(playlist)

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Playlists are fetched successfully")
    )
    
})

const getPlaylistById = asyncHandler(async(req,res)=>{

    const {plalistId} = req.params

    if(!isValidObjectId(plalistId)){
        throw new ApiError(404,"Invalid playlistId")
    }

    const existPlaylist = await Playlist.findById(plalistId)

    if(!existPlaylist){
        throw new ApiError(400,"PLaylist does not exist")
    }

    const playlistDetail = await Playlist.aggregate([
        {
            $match: new mongoose.Types.ObjectId(plalistId)
        },
        {
            $lookup:{
                from:"Video",
                localField:"videos",
                foreignField:"_id",
                as:"playlistVideos"

            }
        }
    ])

    console.log(playlistDetail)
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,"PlaylistDetail has fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{


    const {plalistId,videoId} = req.params

    const {name,description} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid videoId")
    }

    const existVideo = await Video.findById(videoId)
   
    if(!existVideo){
        throw new ApiError(400,"Video does not exist")
    }
    
    if(!isValidObjectId(plalistId)){
        throw new ApiError(404,"Invalid plalistId")
    }

    const userId =new mongoose.Types.ObjectId(req.user._id); 
    //console.log(userId)

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id:plalistId,
            owner:userId
        },
        
        {
            $addToSet:{videos:videoId}
        },

        {
            new:true
        }
    )
    
    if(name){
        updatedPlaylist.name=name
    }

    if(description){
        updatedPlaylist.description=description
    }

    const updatedPlaylists = await updatedPlaylist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedPlaylists,"Playlist has been updated successfully")
    )
})

const removeVideFromPlaylist = asyncHandler(async(req,res)=>{
    const {plalistId,videoId} = req.params

    const {name,description} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid videoId")
    }

    const existVideo = await Video.findById(videoId)
   
    if(!existVideo){
        throw new ApiError(400,"Video does not exist")
    }
    
    if(!isValidObjectId(plalistId)){
        throw new ApiError(404,"Invalid plalistId")
    }

    const userId =new mongoose.Types.ObjectId(req.user._id); 
    
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id:plalistId,
            owner:userId
        },
        {
            $pull:{videos:videoId}
        },
        {
            new:true
        }
    )
    
    
    if(name){
        updatedPlaylist.name=name
    }

    if(description){
        updatedPlaylist.description=description
    }

    const updatedPlaylists =  await updatedPlaylist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedPlaylists,"Playlist has been updated successfully")
    )
})

const deletePlaylist = asyncHandler(async(req,res)=>{

    const {plalistId} = req.params

    if(!isValidObjectId(plalistId)){
        throw new ApiError(404,"Invalid plalistId")
    }
    
    const userId =new mongoose.Types.ObjectId(req.user._id);
    
    const playlist = await Playlist.findOne(plalistId)

    if(playlist.owner !== userId){
        throw new ApiError(400,"Unauthorised action")
    }

    const deletedPlaylist = await playlist.deleteOne()

    console.log(deletedPlaylist)

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Playlist has been deleted successfully")
    )
    
}) 

export {createPlaylist,getUserPlaylists,getPlaylistById,addVideoToPlaylist,removeVideFromPlaylist,deletePlaylist}