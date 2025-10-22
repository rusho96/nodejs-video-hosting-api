import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { v2 as cloudinary } from "cloudinary"
import getVideoDuration from "../utils/duration.js"
import { Types } from "mongoose"


const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const sort = { [sortBy]: sortType === "asc" ? 1 : -1 };
  const skip = (Number(page) - 1) * Number(limit);

  const pipeline = [];
  const matchCondition = {};

  if (query) {
    matchCondition.title = { $regex: query, $options: "i" };
  }

  if (userId && isValidObjectId(userId)) {
    matchCondition.owner = new mongoose.Types.ObjectId(userId);
  }

  if (Object.keys(matchCondition).length > 0) {
    pipeline.push({ $match: matchCondition });
  }

  
  pipeline.push({
    $lookup: {
      from: "users", 
      localField: "owner",
      foreignField: "_id",
      as: "owner",
    },
  });

 
  pipeline.push({
    $unwind: {
      path: "$owner",
      preserveNullAndEmptyArrays: true,
    },
  });

  
  pipeline.push({
    $project: {
      title: 1,
      thumbnail: 1,
      videoFile: 1,
      views: 1,
      duration: 1,
      createdAt: 1,
      "owner._id": 1,
      "owner.userName": 1,
      "owner.profilePic": 1,
      
    },
  });

 
  pipeline.push({ $sort: sort });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: Number(limit) });

  
  const aggregationPipeline = [
    {
      $facet: {
        videos: pipeline,
        totalCount: [{ $match: matchCondition }, { $count: "count" }],
      },
    },
    {
      $addFields: {
        totalCount: {
          $arrayElemAt: ["$totalCount.count", 0],
        },
      },
    },
  ];

  const result = await Video.aggregate(aggregationPipeline);

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "result has been fetched successfully")
    );
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const userId = req.user._id;

    if (!title || !description) {
        throw new ApiError(404, "title or description is not delivered");
    }

    

    
    const videoBuffer = req.files?.videoFile?.[0]?.buffer
    if (!videoBuffer) {
        throw new ApiError(400, "videoBuffer is required");
    }
    
    console.log(req.files?.videoFile)
    
    const thumbnailBuffer = req.files?.thumbnail?.[0]?.buffer;

    console.log(thumbnailBuffer)
    const videoFile = await uploadOnCloudinary(videoBuffer,"videos");

    
    let thumbnail = null;
    if (thumbnailBuffer) {
        thumbnail = await uploadOnCloudinary(thumbnailBuffer,"thumbnails");
    }

    const duration = Number(videoFile.duration)?.toFixed(2) || 0;

    const video = await Video.create({
        title,
        videoFile: videoFile.secure_url,
        cloudVideoId: videoFile.public_id,
        thumbnail: thumbnail?.secure_url || "",
        thumbnailId: thumbnail?.public_id || "",
        description,
        duration,
        owner: userId
    });

    return res.status(200).json(
        new ApiResponse(200, video, "Video has been published")
    );
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }

    

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid videoId")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    )

    if (!video) {
        throw new ApiError(404, "video has not found")
    }

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $addToSet: { watchHistory: videoId }
        },
        { new: true }
    ).select("-password -refreashToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video has been fetched")
        )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Provide correct videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);

    if (!video.owner.equals(userId)) {
        throw new ApiError(403, "Unauthorized access");
    }

    if (title) {
        video.title = title;
    }

    if (description) {
        video.description = description;
    }

    
    const newThumbnailBuffer = req.file?.buffer;
    console.log(newThumbnailBuffer)
    if (newThumbnailBuffer) {
        if (video.thumbnailId) {
            await cloudinary.uploader.destroy(video.thumbnailId);
        }

        const newThumbnail = await uploadOnCloudinary(newThumbnailBuffer,"thumbnails");
        console.log(newThumbnail)

        if (newThumbnail) {
            video.thumbnail = newThumbnail.secure_url;
            video.thumbnailId = newThumbnail.public_id;
        }
    }

    const updatedVideo = await video.save();
    console.log(updatedVideo)

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Video has been updated successfully")
        );
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Provide valid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video doesn't exist")
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);

    if (!video.owner.equals(userId)) {
        throw new ApiError(400, "Unauthorized access");
    }

    if (video.cloudVideoId) {
        await cloudinary.uploader.destroy(video.cloudVideoId)
    }

    if (video.thumbnailId) {
        await cloudinary.uploader.destroy(video.thumbnailId)
    }

    await video.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, " Video has been deleted")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Provide valid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video does not exist")
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);

    if (!video.owner.equals(userId)) {
        throw new ApiError(400, "Unauthorized access");
    }

    video.isPublished = !video.isPublished

    const updatedVideo = await video.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "PublisStatus has been toggled")
        )
})

const removeFromWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    console.log(videoId,userId)

    const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { watchHistory: videoId } },
        { new: true }
    ).select("-password -refreashToken")

    if (!user) {
        throw new ApiError(404, "User is not found")
    }

    return res.status(200).json(
        new ApiResponse(200, user, "Video is removed from watchHistory")
    )
})

const clearWatchHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const user = await User.findByIdAndUpdate(
        userId,
        { watchHistory: [] },
        { new: true }
    ).select("-password -refreashToken")

    if (!user) {
        throw new ApiError(404, "User is not found")
    }

    return res.status(200).json(
        new ApiResponse(200, user, "WatchHistory is cleared successfully")
    )
})

const getUserLikedVideos = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  
  const likes = await Like.find({ likedBy: userId, video: { $ne: null } })
    .populate("video") 
    .sort({ createdAt: -1 }); 

  
  const likedVideos = likes.map((like) => like.video);

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "User liked videos fetched"));
});




export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    removeFromWatchHistory,
    clearWatchHistory,
    getUserLikedVideos
}