import ffmpeg from "fluent-ffmpeg"



const getVideoDuration = (filePath)=> new Promise((resolve,reject)=>{
    ffmpeg.ffprobe(filePath,(err,metadata)=>{
        if(err) return reject (err)
        resolve (metadata.format.duration)
    })
})

export default getVideoDuration


