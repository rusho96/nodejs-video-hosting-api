import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.js"
import { upload } from "../middlewares/multer.js";



import { getAllVideos } from "../controllers/video.controller.js";
import { publishAVideo } from "../controllers/video.controller.js";
import { getVideoById } from "../controllers/video.controller.js";
import { updateVideo } from "../controllers/video.controller.js";
import { deleteVideo } from "../controllers/video.controller.js";
import { togglePublishStatus } from "../controllers/video.controller.js";
import {removeFromWatchHistory} from "../controllers/video.controller.js";
import {clearWatchHistory} from "../controllers/video.controller.js";
import { getUserLikedVideos } from "../controllers/video.controller.js";

const videoRouter=Router()
const uploadFields = upload.fields( 
    [
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail", 
            maxCount: 1,
        }
    ])

videoRouter.route("/getAllVideos").get(verifyJWT,getAllVideos)
videoRouter.route("/publishAVideo").post(verifyJWT,uploadFields,publishAVideo)
videoRouter.route("/getVideoById/:videoId").get(verifyJWT,getVideoById)
videoRouter.route("/updateVideo/:videoId").put(verifyJWT,upload.single('thumbnail'),updateVideo)
videoRouter.route("/deleteVideo/:videoId").delete(verifyJWT,deleteVideo)
videoRouter.route("/togglePublishStatus/:videoId").get(verifyJWT,togglePublishStatus)
videoRouter.route("/removeFromWatchHistory/:videoId").patch(verifyJWT,removeFromWatchHistory)
videoRouter.route("/clearWatchHistory").delete(verifyJWT,clearWatchHistory) 
videoRouter.route("/getUserLikedVideos/:userId").get(verifyJWT,getUserLikedVideos)

export default videoRouter 