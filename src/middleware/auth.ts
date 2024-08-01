import { RequestHandler } from "express";
import { sendErrorRes } from "src/utils/helper";
import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";
import UserModel from "src/models/users";
interface UserProfile{
    id: string;
    name: string;
    email: string;
    verified: boolean;
    avatar: any;

   //  avatar: string

}
 declare global{
    namespace Express {
        interface Request {
          user: UserProfile
        }
    }
 }
 const JWT_SECRET = process.env.JWT_SECRET!.toString();
export const isAuth: RequestHandler = async (req, res, next) => {
   try {
    const authToken = req.headers.authorization
    if (!authToken) return sendErrorRes(res, "unauthorized request!", 403);
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2OTExZTBmZTA5NTMxM2ZmODkzYTViMCIsImlhdCI6MTcyMTkwOTE3OSwiZXhwIjoxNzIxOTEwMDc5fQ.R7fqfz5hJ-rfFwfcXt2KceQ4gFwArWLdb9NB2YnhAsg"
    const token = authToken.split("Bearer ")[1] // ["", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]
    const payload = jwt.verify(token, JWT_SECRET) as { id: string }

    const user = await UserModel.findById(payload.id)
    if(!user) return sendErrorRes(res, "unauthorized request!", 403)
    
        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            verified: user.verified,
            avatar: user.avatar?.url,

        };
        next();
   } catch (error) {
     if(error instanceof TokenExpiredError){
        return sendErrorRes(res,"Sessions expired",401)
     }
     if(error instanceof JsonWebTokenError){
        return sendErrorRes(res,"Unauthorized assess",401)
     }
     next(error)
   }

    
}