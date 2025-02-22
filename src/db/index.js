import dotenv from "dotenv"
import mongoose from "mongoose";
import { DB_Name } from "../constants.js";
dotenv.config({
    path: './.env'
})


const db= async function(){
   try{
      const dbConnection= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`,
         { 
            useNewUrlParser: true,
            useUnifiedTopology: true,
         })
      console.log(dbConnection.connections[0].port)
   } catch(error){
      console.log("MONGODB connection FAILED",error);
      process.exit(1)
   }
}



export {db}; 