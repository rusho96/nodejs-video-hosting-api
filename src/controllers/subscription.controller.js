import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose , {isValidObjectId} from "mongoose";
import { User } from "../models/user.model.js";



const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    let data = null

    
    const subscribe = async () => {
        const newSubscription = await Subscription.create({
            channel: channelId,
            subscriber: req.user
        });
        return newSubscription;
    };

    
    const unsubscribe = async () => {
        const deletedSubscription = await Subscription.deleteOne({
            channel: channelId,
            subscriber: req.user
        });
        return deletedSubscription.deletedCount;
    };

    
    if (!channelId) {
        throw new ApiError(404, "ChannelId is required");
    }

    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    
    const channelProfile = await User.findById(channelId).select("-password -refreshToken");

    
    if (!channelProfile) {
        throw new ApiError(404, "No channel found");
    }

    
    const isSubscribedInfo = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user
    });

    console.log( `info ${isSubscribedInfo}`)

    if (!isSubscribedInfo) {
        
        
        const newSubscription = await subscribe(); 
        //console.log(`Subscribed user ${req.user} to channel ${channelId}`);
        data =true
        
    } else {
        
        const deletedCount = await unsubscribe(); 
        //console.log(`Unsubscribed user ${req.user} from channel ${channelId}, deletedCount: ${deletedCount}`);
        data=false
    }

    
    return res.status(200).json(new ApiResponse(200, data));
});

const getChannelSubscribers = asyncHandler(async(req,res)=>{ 
    const { channelId } = req.params;

    
    if (!channelId) {
        throw new ApiError(404, "ChannelId is required");
    }

    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const isUserExist = await User.findById(channelId)

    if(!isUserExist){
        throw new ApiError(404, "User does not exist");
    }

    

    const channelSubscribers = await Subscription.aggregate(
        [
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscribers"
                }
            },
            {
                $unwind:"$subscribers"
            },
            
            { 
                $project:{
                  _id: 0,                 
                  subscriberId: "$subscriber", 
                  subscriberDetails: {
                      userName: "$subscribers.userName",
                      fullName: "$subscribers.fullName"
                  }
                }
            }
        
        ]
    )

    //console.log(channelSubscribers)

    return res.status(200).json(new ApiResponse(200, channelSubscribers ,"Subscribers are fetched successfully"));
})

const getSubscribedToChannels = asyncHandler(async(req,res)=>{
    const { channelId } = req.params;

    
    if (!channelId) {
        throw new ApiError(404, "ChannelId is required");
    }

    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const isUserExist = await User.findById(channelId)

    if(!isUserExist){
        throw new ApiError(404, "User does not exist")
    }

    const subscribedToChannels = await Subscription.aggregate(
        [
            {
                $match:{
                    subscriber: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"channel",
                    foreignField:"_id",
                    as:"channels"
                }
            },
            {
                $unwind:"$channels"
            },
            {
                $project:{
                    _id:0,
                    subscribedToChannelId:"$channel",
                    subscribedToChannelDetail:{
                        userName:"$channels.userName",
                        fullName:"$channels.fullName",
                        profilePic:"$channels.profilePic"
                    }
                }
            }
        ]
    )

    //console.log(subscribedToChannels)

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribedToChannels,"Channels are fetched successfully")
    )
})

export {toggleSubscription,getChannelSubscribers,getSubscribedToChannels}