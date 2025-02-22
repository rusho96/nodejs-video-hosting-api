class ApiError extends Error{
    constructor(
        statusCode,
        message="Some Error has been found",
        errors=[],
        stack=""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false;
        this.errors=errors
        
        //chatgpt
        if (stack){
            this.stack=stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}


export {ApiError}