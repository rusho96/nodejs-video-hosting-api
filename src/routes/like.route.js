import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.js"

//import route

import { toggleVideoLike } from "../controllers/like.controller.js";
import { toggleCommentLike } from "../controllers/like.controller.js";
import { getAllLikedVideos } from "../controllers/like.controller.js";

const likeRouter=Router()

likeRouter.route("/toggleVideoLike/:videoId").get(verifyJWT,toggleVideoLike)
likeRouter.route("/toggleCommentLike/:commentId").get(verifyJWT,toggleCommentLike)
likeRouter.route("/getAllLikedVideos").get(verifyJWT,getAllLikedVideos)

export default likeRouter