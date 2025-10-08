import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.js"
import { upload } from "../middlewares/multer.js";

//import route

import { getVideoComment } from "../controllers/comment.controller.js";
import { addComment } from "../controllers/comment.controller.js";
import { updateComment } from "../controllers/comment.controller.js";
import { deleteComment } from "../controllers/comment.controller.js";

const commentRouter=Router()

commentRouter.route("/getVideoComment/:videoId").get(verifyJWT,getVideoComment)
commentRouter.route("/addComment/:videoId").post(verifyJWT,upload.none(),addComment)
commentRouter.route("/updateComment/:commentId").put(verifyJWT,upload.none(),updateComment)
commentRouter.route("/deleteComment/:commentId").delete(verifyJWT,deleteComment)

export default commentRouter 