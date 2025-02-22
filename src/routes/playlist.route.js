import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.js"
import { upload } from "../middlewares/multer.js";

//import route

import { createPlaylist } from "../controllers/playlist.controller.js";
import { getUserPlaylists } from "../controllers/playlist.controller.js";
import { getPlaylistById } from "../controllers/playlist.controller.js";
import { addVideoToPlaylist } from "../controllers/playlist.controller.js";
import { removeVideFromPlaylist } from "../controllers/playlist.controller.js";
import { deletePlaylist } from "../controllers/playlist.controller.js";

const playlistRouter=Router()

playlistRouter.route("/createPlaylist/:videoId").post(verifyJWT,upload.none(),createPlaylist)
playlistRouter.route("/getPlaylist/:userId").get(verifyJWT,getUserPlaylists)
playlistRouter.route("/getPlaylistById/:plalistId").get(verifyJWT,getPlaylistById)
playlistRouter.route("/addVideoToPlaylist/:plalistId/:videoId").put(verifyJWT,upload.none(),addVideoToPlaylist)
playlistRouter.route("/removeVideFromPlaylist/:plalistId/:videoId").put(verifyJWT,upload.none(),removeVideFromPlaylist)
playlistRouter.route("/deletePlaylist/:plalistId").delete(verifyJWT,deletePlaylist)

export default playlistRouter ;  