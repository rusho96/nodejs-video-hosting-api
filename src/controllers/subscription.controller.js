import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose , {isValidObjectId} from "mongoose";
import { User } from "../models/user.model.js";



const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Function to subscribe the user to a channel
    const subscribe = async () => {
        const newSubscription = await Subscription.create({
            channel: channelId,
            subscriber: req.user
        });
        return newSubscription;
    };

    // Function to unsubscribe the user from a channel
    const unsubscribe = async () => {
        const deletedSubscription = await Subscription.deleteOne({
            channel: channelId,
            subscriber: req.user
        });
        return deletedSubscription.deletedCount;
    };

    // Check if channelId is provided
    if (!channelId) {
        throw new ApiError(404, "ChannelId is required");
    }

    // Validate if channelId is a valid ObjectId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    // Retrieve the channel profile
    const channelProfile = await User.findById(channelId).select("-password -refreshToken");

    // Check if channel profile exists
    if (!channelProfile) {
        throw new ApiError(404, "No channel found");
    }

    // Check if the user is already subscribed
    const isSubscribedInfo = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user
    });

    if (!isSubscribedInfo) {
        // If not subscribed, subscribe the user
        const newSubscription = await subscribe(); // Assuming subscribe() handles errors internally
        console.log(`Subscribed user ${req.user} to channel ${channelId}`);
    } else {
        // If subscribed, unsubscribe the user
        const deletedCount = await unsubscribe(); // Assuming unsubscribe() handles errors internally
        console.log(`Unsubscribed user ${req.user} from channel ${channelId}, deletedCount: ${deletedCount}`);
    }

    // Send success response
    return res.status(200).json(new ApiResponse(200, "Subscription toggled successfully"));
});

const getChannelSubscribers = asyncHandler(async(req,res)=>{ 
    const { channelId } = req.params;

    // Check if channelId is provided
    if (!channelId) {
        throw new ApiError(404, "ChannelId is required");
    }

    // Validate if channelId is a valid ObjectId
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
            //{
                //$group:{
                    //_id:"$subscriber",
                    //subscribers:{$first:"$subscribers"}
                //}
            //}

            { 
                $project:{
                  _id: 0,                 // Exclude _id if not needed
                  subscriberId: "$subscriber", // Include subscriber ID
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

    // Check if channelId is provided
    if (!channelId) {
        throw new ApiError(404, "ChannelId is required");
    }

    // Validate if channelId is a valid ObjectId
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
                        fullName:"$channels.fullName"
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