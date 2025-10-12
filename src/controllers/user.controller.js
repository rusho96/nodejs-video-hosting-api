import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {v2 as cloudinary} from "cloudinary"

const generateAccessTokenAndRefreashToken= async function(userId){
    const user = await User.findById(userId)

    const AccessToken = user.generateAccessToken()
    const RefreashToken = user.generateRefreshToken()
    
    user.refreashToken=RefreashToken
    await user.save({
        validateBeforeSave:false
    })


    return {AccessToken,RefreashToken}
} 


const checkCookie = asyncHandler(async(req,res)=>{
    const accessToken = req.cookies?.accessToken
    const refreashToken = req.cookies?.refreashToken

    try {
        const decodedAccessToken = jwt.decode(accessToken)
        console.log((decodedAccessToken.exp*1000 - Date.now())/1000)
        console.log(decodedAccessToken.exp)
        console.log(decodedAccessToken.exp*1000)
        console.log(Date.now())
    } catch (error) {
        throw new ApiError(error)
    }
    
    

    

    res.json(
        new ApiResponse(200,{accessToken,refreashToken})
    )
})

const registerUser= asyncHandler(async(req,res)=>{
    

    const {fullName,userName,email,password} = req.body
    const userDetail={}

    if([fullName,userName,email,password].some((field)=>field.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne(
        {
            $or:[{userName},{email}]
        }
    )

    if(existedUser){
        throw new ApiError(409,"User with email or password is already exist")
    }

    //console.log(req.files)

    const coverPicPath = req.files?.coverPic?.[0]?.path || null;
    const profilePicPath = req.files?.profilePic?.[0]?.path || null;


    const coverImage= coverPicPath? await uploadOnCloudinary(coverPicPath):null
    const profileImage = profilePicPath? await uploadOnCloudinary(profilePicPath):null

    if(coverImage){
        userDetail.coverPic=coverImage.secure_url
        userDetail.coverPicId=coverImage.public_id
    }

    if(profileImage){
        userDetail.profilePic=profileImage.secure_url
        userDetail.profilePicId=profileImage.public_id
    }

    userDetail.fullName=fullName
    userDetail.userName=userName.toLowerCase()
    userDetail.email=email
    userDetail.password=password

    const user = await User.create(
      userDetail
    )

    const createdUser=await User.findById(user._id).select(
        "-password -refreashToken"
    )

    if (!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,"User Registered successfully")
    )


}) 


const loginUser = asyncHandler(async(req,res)=>{
    


    const {userName,email,password} = req.body

    

    if(!(userName || email)){
        throw new ApiError(400,"userName or email is required")
    }

    const user = await User.findOne(
        {
            $or:[{userName},{email}]
        }
    )

    if(!user){
        throw new ApiError(404,"Invalid userName or email")
    }

    if(!(await user.isPasswordCorrect(password))){
        throw new ApiError(401,"Password is incorrect")
    }

    const {RefreashToken,AccessToken} = await generateAccessTokenAndRefreashToken(user._id)

    console.log(RefreashToken,AccessToken)
    
    const loggedInUser= await User.findById(user._id).select(
        "-password -refreashToken"
    )

    const option = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",   // production এ true হবে
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };

    return res
    .status(200)
    .cookie("refreashToken",RefreashToken,option)
    .cookie("accessToken",AccessToken,option)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser
            },

            "User logged in successfully"
        )
    )
    

})



const logoutUser = asyncHandler(async(req,res)=>{
    const user = req.user

    const changedUser = await User.findByIdAndUpdate( 
        user._id,
        {
            $unset :{
                refreashToken:1
            }
        },
        {
            new:true
        }

    )

    const option = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("refreashToken",option)
    .clearCookie("accessToken",option)
    .json(
        new ApiResponse(200,changedUser,"logged out successfully")
    )

})



const refreashAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ApiError(401, "You are not logged in");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

    const { refreshToken, accessToken } =
        await generateAccessTokenAndRefreashToken(user._id);

    const option = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {  oldPassword,newPassword,reNewPassword } = req.body
    
    const user = await User.findById(req.user._id)
    
    const isPasswordCorrect =await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Old Password")
    }

    if(reNewPassword != newPassword){
        throw new ApiError(400,"newPassword and reNewPassword didn't match")
    }

    user.password = newPassword

    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200," Password has changed sussessfully ")
    )


})

const getCurrentUser = asyncHandler(async(req,res)=>{
    const user = req.user

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"User fetched successfully")
    )
})

const updateCurrentUser = asyncHandler(async (req, res) => {
  const { userName, email, fullName, bio } = req.body;

  if (!(userName || email || fullName || bio)) {
    throw new ApiError(400, "Empty update field request");
  }

  const updateFields = {};
  if (userName) updateFields.userName = userName;
  if (email) updateFields.email = email;
  if (fullName) updateFields.fullName = fullName;
  if (bio) updateFields.bio = bio;

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateFields },
    { new: true }
  ).select("-password -refreashToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User is updated successfully"));
});


const getCurrentChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    //console.log(username)

    if(!username){
        throw new ApiError(400,"Username is required")
    }

    const channel = await User.aggregate([
        {
            $match:{
                userName : username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
               subscribersCount:{
                   $size:"$subscribers"
               },
               subscribedToCount:{
                   $size:"$subscribedTo"
               },
               isSubscribed:{
                   $cond:{
                     if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                     then:true,
                     else:false
                   }
               }

            }
        },
        {
            $project:{
                fullName:1,
                userName:1,
                profilePic:1,
                coverPic:1,
                subscribersCount:1,
                subscribedToCount:1,
                isSubscribed:1
            }
        }


    ])

    if(!channel?.length){
        throw new ApiError(404,"User channel is not exist")
    }

    console.log(channel)

    res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"Current channel is fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

const updateProfilePic= asyncHandler(async(req,res)=>{
    const userId = req.user._id

    const profilePicPath = req.file?.path

    if(!profilePicPath){
        throw new ApiError(400,"FilePath is needed")
    }

    const profilePic= await uploadOnCloudinary(profilePicPath)

    if(!profilePic){
        throw new ApiError(400,"File isn't created")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404,"User is not found")
    }

    if(user.profilePicId){
        cloudinary.uploader.destroy(user.profilePicId)
    }

    user.profilePic=profilePic?.secure_url
    user.profilePicId=profilePic?.public_id

    const updatedUser = await user.save()

    return res
    .status(200)
    .json(
         new ApiResponse(200,"ProfilePic has been updated")
    )
})

const updateCoverPic= asyncHandler(async(req,res)=>{
    const userId = req.user._id

    const coverPicPath = req.file?.path

    if(!coverPicPath){
        throw new ApiError(400,"FilePath is needed")
    }

    const coverPic = await uploadOnCloudinary(coverPicPath)

    if(!coverPic){
        throw new ApiError(400,"File is not created")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404,"User is not found")
    }

    if(user.coverPicId){
        cloudinary.uploader.destroy(user.coverPicId)
    }

    user.coverPic=coverPic.secure_url
    user.coverPicId= coverPic.public_id

    await user.save()

    return res.status(200).json(
        new ApiResponse(200,"CoverPic has been updated successfully")
    )
     
})


export {registerUser,loginUser,logoutUser,checkCookie,changeCurrentPassword,getCurrentUser,updateCurrentUser,getCurrentChannelProfile,refreashAccessToken,getWatchHistory,updateProfilePic,updateCoverPic}