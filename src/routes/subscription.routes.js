import {Router} from "express"


import { verifyJWT } from "../middlewares/auth.js"


//import controller 

import { toggleSubscription } from "../controllers/subscription.controller.js"
import { getChannelSubscribers } from "../controllers/subscription.controller.js"
import { getSubscribedToChannels } from "../controllers/subscription.controller.js"

const subscriptionRouter = Router()

subscriptionRouter.route("/toggleSubscription/:channelId").get(verifyJWT,toggleSubscription)
subscriptionRouter.route("/getChannelSubscribers/:channelId").get(verifyJWT,getChannelSubscribers)
subscriptionRouter.route("/getSubscribedToChannels/:channelId").get(verifyJWT,getSubscribedToChannels)





export default subscriptionRouter;