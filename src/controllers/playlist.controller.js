
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


    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlists are fetched successfully")
    )
    
})

const getPlaylistById = asyncHandler(async(req,res)=>{

    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(404,"Invalid playlistId")
    }

    const existPlaylist = await Playlist.findById(playlistId)

    if(!existPlaylist){
        throw new ApiError(400,"PLaylist does not exist")
    }

    const playlistDetail = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) }
        },
        {
            $lookup: {
                from: "videos",    
                localField: "videos",
                foreignField: "_id",
                as: "playlistVideos"
            }
        },
        {
            $unwind: {
                path: "$playlistVideos",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "users",   
                localField: "playlistVideos.owner",
                foreignField: "_id",
                as: "playlistVideos.owner"
            }
        },
        {
            $unwind: {
                path: "$playlistVideos.owner",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: "$_id",
                name: { $first: "$name" },
                description: { $first: "$description" },
                owner: { $first: "$owner" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                playlistVideos: { $push: "$playlistVideos" }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
                playlistVideos: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    duration: 1,
                    views: 1,
                    createdAt: 1,
                    "owner._id": 1,
                    "owner.userName": 1,
                    "owner.avatar": 1
                }
            }
        }
    ])


    //console.log(playlistDetail)
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,playlistDetail,"PlaylistDetail has fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{


    const {playlistId,videoId} = req.params

    const {name,description} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid videoId")
    }

    const existVideo = await Video.findById(videoId)
   
    if(!existVideo){
        throw new ApiError(400,"Video does not exist")
    }
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(404,"Invalid plalistId")
    }

    const userId =new mongoose.Types.ObjectId(req.user._id); 
    //console.log(userId)

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
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
    const {playlistId,videoId} = req.params

    const {name,description} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid videoId")
    }

    const existVideo = await Video.findById(videoId)
   
    if(!existVideo){
        throw new ApiError(400,"Video does not exist")
    }
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(404,"Invalid plalistId")
    }

    const userId =new mongoose.Types.ObjectId(req.user._id); 
    
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
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

    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(404,"Invalid plalistId")
    }
    
    const userId =new mongoose.Types.ObjectId(req.user._id);
    
    const playlist = await Playlist.findOne(playlistId)

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