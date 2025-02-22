import express from "express";
import cors from "cors"
import bodyParser from "body-parser";
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError.js";
import multer from "multer";


const app=express();
//const upload = multer();

app.use(cors({
    origin:"http://192.168.0.105:8000",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser())
app.use(bodyParser.json({limit: "16kb"}))
app.use(bodyParser.urlencoded({extended: true, limit: "16kb"}))
//app.use(upload.array())


//import route
import userRouter from "./routes/user.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import commentRouter from "./routes/comment.route.js";
import likeRouter from "./routes/like.route.js";
import playlistRouter from "./routes/playlist.route.js";
import videoRouter from "./routes/video.route.js";


//route diclaration
app.use("/api/v1/user", userRouter) 
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/like",likeRouter)
app.use("/api/v1/playlist",playlistRouter)
app.use("/api/v1/video",videoRouter)




//centralized Error handling
//app.use((err,req,res,next) =>{
    //if(err instanceof ApiError){
        //res.status(err.statusCode).json({
            //success:err.success,
            //message:err.message,
            //errors:err.errors
        //})
    //}else {
        //res.status(500).json({
            //success:false,
            //message: "internal Server Error"
        //})
    //}
//}) 
export {app}