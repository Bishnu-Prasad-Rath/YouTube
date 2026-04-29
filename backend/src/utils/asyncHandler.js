const asyncHandler = (requestHandler) => {
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))         //Higher order function must return the function..
    }
}

    

export {asyncHandler}

// const asyncHandler = () => {}
// const asyncHandler = (func) => {() => {}}  Higher order fucntions freom JS
// const asyncHandler = (func) => async () => {}

// const asyncHandler = (func) => async(req,res,next) => {
//     try {
//         await func(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success : false,
//             message : error.message
//         })
//     }
// }