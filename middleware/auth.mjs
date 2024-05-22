import jwt from 'jsonwebtoken'


export default function(req, res, next){

    const token = req.header('x-auth-token')

    if(!token){
        return res.status(401).json({msg: "Improper Credentials"})
    }

    try{

        const decoded = jwt.verify(token, process.env.jwtSecret)
        req.user = decoded.user
        next()

    }catch(err){
        res.status(401).json({msg: "Invalid Credentials"})
    }

}