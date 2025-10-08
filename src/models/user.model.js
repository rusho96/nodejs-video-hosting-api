import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import aggregatePaginate from "mongoose-aggregate-paginate-v2"


const userSchema= new Schema({
    fullName:{
        type:String,
        required:true
    },
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    bio: {
        type: String,
        default: ""
    },

    password:{
        type:String,
        required:true
        
    },
    coverPic:{
        type:String
    },
    coverPicId:{
        type:String
    },
    profilePic:{
        type:String
    },
    profilePicId:{
        type:String
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    refreashToken:{
        type:String
    }
},
{
    timestamps:true
})


userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password=await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken=function(){
   return jwt.sign(
    {
        _id:this._id,
        email:this.email,
        userName:this.userName,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
   )
}



userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            
        },
        process.env.REFREASH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFREASH_TOKEN_EXPIRY
        }
       )
}

userSchema.plugin(aggregatePaginate);

export const User = mongoose.model("User",userSchema)

