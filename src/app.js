import express from "express";
import cors from "cors"
import bodyParser from "body-parser";
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError.js";
import multer from "multer";


const app=express();


const allowedOrigins = [
  'https://video-hosting-react-ikwn5uhth-rusho96s-projects.vercel.app',
  'https://video-hosting-react-app.vercel.app', 
  'http://localhost:3000' 
];

app.use(cors({
  origin: function (origin, callback) {
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser())
app.use(bodyParser.json({limit: "16kb"}))
app.use(bodyParser.urlencoded({extended: true, limit: "16kb"}))



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





app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success || false,
      message: err.message,
      errors: err.errors || [],
      data: err.data || null,
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export {app}