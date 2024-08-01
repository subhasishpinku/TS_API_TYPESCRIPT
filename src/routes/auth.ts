import { Router } from "express";
import { createNewUser, generateForgetPassLink, generateVerificationLink, grantAccessToken, grantValid, isValidPassResetToken, sendProfile, sendPublicProfile, signIn, signOut, updateAvatar, updatePassword, updateProfile, verifyEmail } from "controllers/auth";
import validate from "src/middleware/validator";
import { newUserSchema, restPassSchema, verifyTokenSchema } from "src/utils/validationSchema";
import { verify } from "crypto";
import { isAuth } from "src/middleware/auth";
import { isValidObjectId } from "mongoose";
import fileParser from "src/middleware/fileParser";

const authRouter = Router();

authRouter.post('/sign-up',validate(newUserSchema),createNewUser)
//http://localhost:8000/auth/sign-up
//{
//     "name" : "ABC",
//      "email" : "pinkuss.subhasish@gmail",
//      "password": "@$*12Pinku"
// }
authRouter.post('/verify',validate(verifyTokenSchema),verifyEmail); 
//http://localhost:8000/auth/verify
//{
//     "id" : "pinku1.subhasish@gmail.com",
//      "token" : "14334aa3daf2b2569c544716234fe349047b720a12a4ca0d6113eaef80c6ca6459e0c244"
// }
authRouter.get('/verify-token',isAuth,generateVerificationLink); 
//http://localhost:8000/auth/verify-token  // headers Authorization  Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YTM2YmZiOTJiMTIwZTRhM2I3YjEyMCIsImlhdCI6MTcyMTk4ODAwOSwiZXhwIjoxNzIxOTg4OTA5fQ.wHgaAlW4wCoE3DHY6SSsjZog0a4eoB5n8cHpgrh--NY
authRouter.post('/sign-in',signIn); 
//http://localhost:8000/auth/sign-in
//  {
//     "email" : "pinku1.subhasish@gmail.com",
//      "password" : "123456789"
// }
authRouter.get('/profile',isAuth, sendProfile);
//http://localhost:8000/auth/profile
authRouter.post('/refresh-token', grantAccessToken)
authRouter.post('/sign-out',isAuth,signOut); 
authRouter.post('/forget-pass',generateForgetPassLink); 
//http://localhost:8000/auth/forget-pass
// {
//     "email" : "subhasishsinghaapp@gmail.com"

// }
authRouter.post('/verify-pass-reset-token',
    validate(verifyTokenSchema),
    isValidPassResetToken,
    grantValid
); 

authRouter.post('/reset-pass',
    validate(restPassSchema),
    isValidPassResetToken,
    updatePassword
); 

authRouter.patch('/update-profile',
    isAuth,
    updateProfile
);
//http://localhost:8000/auth/update-profile
// Authorization Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YTc0OWU4Y2Y1ZGNkODkwZjM0M2JkMyIsImlhdCI6MTcyMjI0NjI0MSwiZXhwIjoxNzIyMjQ3MTQxfQ.pYcWwjTNaqpe29WedqVoulJxiTDz6m94NULzJc0S-VU
// {
//     "name" : "New ABC"
// }
//http://localhost:8000/upload-file  //my-file 
//https://cloudinary.com/users/login
authRouter.patch('/update-avatar',
    isAuth,
    fileParser, updateAvatar
);
//http://localhost:8000/auth/update-avatar avatar
// Headers Authorization Bearer token
authRouter.get('/profile/:id',
    isAuth,
    sendPublicProfile
);
//http://localhost:8000/auth/profile/66a749e8cf5dcd890f343bd3
// Headers Authorization Bearer token
export default authRouter;
