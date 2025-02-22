import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2"


const subscriptionSchema = new Schema({
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestamps:true
})

subscriptionSchema.plugin(aggregatePaginate);

export const Subscription = mongoose.model("Subscription",subscriptionSchema)