import {User} from "../models/user.model.js"
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"

const verifyJWT = async function(req,res,next){
    try{
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
        const decodedToken = jwt.decode(
            token
        )
        if((decodedToken.exp*1000 - Date.now())/1000 < 0){
            throw new ApiError(401,"Session is expired")
        }
        const user = await User.findById(decodedToken?._id).select("-password -refreashToken")
    
        if(!user){
            throw new ApiError(401,"Invalid access token")
        }
        
        req.user=user

        
    
        next()
    } catch(err){
        throw new ApiError(401,err?.message || "some error has been occured")
    }
}

export {verifyJWT}