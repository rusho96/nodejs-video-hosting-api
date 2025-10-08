import {Router} from "express"


import { verifyJWT } from "../middlewares/auth.js"
import { upload } from "../middlewares/multer.js";

//import controllers

import { registerUser } from "../controllers/user.controller.js"
import { loginUser } from "../controllers/user.controller.js"
import { logoutUser } from "../controllers/user.controller.js"
import { checkCookie } from "../controllers/user.controller.js"
import { getCurrentUser } from "../controllers/user.controller.js"
import { changeCurrentPassword } from "../controllers/user.controller.js"
import { updateCurrentUser } from "../controllers/user.controller.js"
import { refreashAccessToken } from "../controllers/user.controller.js"
import { getCurrentChannelProfile } from "../controllers/user.controller.js"
import { updateProfilePic} from "../controllers/user.controller.js";
import { updateCoverPic } from "../controllers/user.controller.js";
import { getWatchHistory } from "../controllers/user.controller.js";


const router=Router()

router.route("/register")
.post(
    upload.fields(
        [
            {
                name: "coverPic",
                maxCount: 1,
            },
            {
                name: "profilePic",
                maxCount: 1,
            } 
        ]),
    
    registerUser)
router.route("/login").post(upload.none(),loginUser)
router.route("/logout").get(verifyJWT,logoutUser) 
router.route("/CurrentUser").get(verifyJWT,getCurrentUser)
router.route("/updateUser").patch(verifyJWT,updateCurrentUser)
router.route("/changePassword").post(verifyJWT,changeCurrentPassword)
router.route("/refresh").get(refreashAccessToken)
router.route("/currentChannelProfile/:username").get(verifyJWT,getCurrentChannelProfile)
router.route("/checkCookies").get(checkCookie)
router.route("/updateProfilePic").patch(verifyJWT,upload.single("profilePic"),updateProfilePic)
router.route("/updateCoverPic").patch(verifyJWT,upload.single("coverPic"),updateCoverPic)
router.route("/getWatchHistory").get(verifyJWT,getWatchHistory)




export default router


