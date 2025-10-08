import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.js"
import { upload } from "../middlewares/multer.js";



import { createPlaylist } from "../controllers/playlist.controller.js";
import { getUserPlaylists } from "../controllers/playlist.controller.js";
import { getPlaylistById } from "../controllers/playlist.controller.js";
import { addVideoToPlaylist } from "../controllers/playlist.controller.js";
import { removeVideFromPlaylist } from "../controllers/playlist.controller.js";
import { deletePlaylist } from "../controllers/playlist.controller.js";

const playlistRouter=Router()

playlistRouter.route("/createPlaylist/:videoId").post(verifyJWT,upload.none(),createPlaylist)
playlistRouter.route("/getPlaylist/:userId").get(verifyJWT,getUserPlaylists)
playlistRouter.route("/getPlaylistById/:playlistId").get(verifyJWT,getPlaylistById)
playlistRouter.route("/addVideoToPlaylist/:playlistId/:videoId").put(verifyJWT,upload.none(),addVideoToPlaylist)
playlistRouter.route("/removeVideFromPlaylist/:playlistId/:videoId").put(verifyJWT,upload.none(),removeVideFromPlaylist)
playlistRouter.route("/deletePlaylist/:playlistId").delete(verifyJWT,deletePlaylist)

export default playlistRouter ;  