import { RequestHandler } from "express";
import UserModel from "src/models/users";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import AuthVerificationTokenModel from "src/models/authVeirficationToken";
import { sendErrorRes } from "src/utils/helper";
import mail from "src/utils/mail";
import { access } from "fs";
import PasswordResetTokenModel from "src/models/passwordResetToken";
// import { v2 as cloudinary } from 'cloudinary'
import { isValidObjectId } from "mongoose";
import cloudUploader from "src/cloud";
// export const createNewUser: RequestHandler = async (req, res, next) => {
const VERIFICATION_LINK = process.env.VERIFICATION_LINK
const JWT_SECRET = process.env.JWT_SECRET!
const PASSWORD_RESET_LINK = process.env.PASSWORD_RESET_LINK
// const CLOUD_NAME = process.env.CLOUD_NAME!
// const CLOUD_KEY = process.env.CLOUD_KEY!
// const CLOUD_SECRET = process.env.CLOUD_SECRET!
// cloudinary.config({
//     cloud_name: CLOUD_NAME,
//     api_key: CLOUD_KEY,
//     api_secret: CLOUD_SECRET,
//     secure: true,
//     // use_https: true,
//     // timeout: 5000,
//     // connectTimeout: 5000,
//     // retryAttempts: 3,
// })
export const createNewUser: RequestHandler = async (req, res) => {

    //  try{
    const { email, password, name } = req.body;
    if (!name)
        return sendErrorRes(res, "Name is missing!", 422);
    if (!email)
        return sendErrorRes(res, "Email is missing!", 422);
    if (!password)
        return sendErrorRes(res, "Password is missing!", 422);
    const existingUser = await UserModel.findOne({ email })
    if (existingUser)
        return sendErrorRes(res, "Unauthorized request, email is already in use!", 401);

    const user = await UserModel.create({ name, email, password });
    const token = crypto.randomBytes(36).toString('hex')
    await AuthVerificationTokenModel.create({ owner: user._id, token })
    // const link = `http://localhost:8000/verify.html?id=${user._id}&token=${token}`;
    const link = `${VERIFICATION_LINK}id=${user._id}&token=${token}`;

    // const transport = nodemailer.createTransport({
    //     host: "sandbox.smtp.mailtrap.io",
    //     port: 2525,
    //     auth: {
    //        user: "70eb1090c447e8",
    //        pass: "685533b4a05868"
    //     }
    //   });
    //  await transport.sendMail({
    //     from: "subhasishsinghavolitionllp@gmail.com",
    //     to: user.email,
    //     html: `<h1>Please click on <a href="${link}">this link</a> to verify your account.</h1>`
    //  })
    await mail.sendVerification(user.email, link)
    res.json({ message: "Please check your indox." })
    //  }catch(error){
    //     next(error);
    //  }


}

export const verifyEmail: RequestHandler = async (req, res) => {

    const { id, token } = req.body


    const authToken = await AuthVerificationTokenModel.findOne({ owner: id })
    if (!authToken) return sendErrorRes(res, "Unauthorized request!", 403)

    const isMatched = await authToken.compareToken(token)
    if (!isMatched) return sendErrorRes(res, "Unauthorized request, invalid token!", 403)
    await UserModel.findByIdAndUpdate(id, { verified: true })

    await AuthVerificationTokenModel.findByIdAndDelete(authToken._id);

    res.json({ message: "Thanks for joining us, your email is verified!" });
};
export const generateVerificationLink: RequestHandler = async (req, res) => {
    const { id } = req.user
    const token = crypto.randomBytes(36).toString('hex')
    // const link = `http://localhost:8000/verify.html?id=${id}&token=${token}`;
    const link = `${VERIFICATION_LINK}id=${id}&token=${token}`;
    await AuthVerificationTokenModel.findOneAndDelete({ owner: id })
    await AuthVerificationTokenModel.create({ owner: id, token })
    await mail.sendVerification(req.user.email, link)
    res.json({ message: "Please check your indox." })
}

export const signIn: RequestHandler = async (req, res) => {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email })
    if (!user) return sendErrorRes(res, "Email/Password mismatch!", 403)
    const isMatched = user.comparePassword(password)
    if (!isMatched) return sendErrorRes(res, "Email/Password mismatch!", 403)

    const payload = { id: user._id }
    const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: "15m"
    })
    const refreshToken = jwt.sign(payload, JWT_SECRET)

    if (!user.tokens) user.tokens = [refreshToken]
    else user.tokens.push(refreshToken)

    await user.save()

    res.json({
        profile: {
            id: user._id,
            email: user.email,
            name: user.name,
            verified: user.verified
        },
        tokens: { refresh: refreshToken, acess: accessToken }
    })
};

export const sendProfile: RequestHandler = async (req, res) => {
    res.json({
        profile: req.user
    })
}
export const grantAccessToken: RequestHandler = async (req, res) => {

    const { refreshToken } = req.body;
    if (!refreshToken) return sendErrorRes(res, "Unauthorized required!", 403)
    const payload = jwt.verify(refreshToken, JWT_SECRET) as { id: string }
    // if(payload.id) return sendErrorRes(res, "Unauthorized required!",401)

    if (payload.id) {
        const user = await UserModel.findOne({
            _id: payload.id,
            tokens: refreshToken
        })

        if (!user) {
            await UserModel.findByIdAndUpdate(payload.id, { tokens: [] })
            return sendErrorRes(res, "Unauthorized required!", 401)
        }

        const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, {
            expiresIn: "15m"
        })
        const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET)

        const filteredTokens = user.tokens.filter((t) => t !== refreshToken)
        user.tokens = filteredTokens
        await user.save()
        res.json({ refresh: newRefreshToken, access: newAccessToken })
    }

};
export const signOut: RequestHandler = async (req, res) => {
    const { refreshToken } = req.body;
    const user = await UserModel.findOne({ _id: req.params.id, tokens: refreshToken });
    if (!user) return sendErrorRes(res, "Unauthorized request, user not found!", 403);

    const newTokens = user.tokens.filter((t) => t !== refreshToken)
    user.tokens = newTokens;
    await user.save();
    res.send();
};
export const generateForgetPassLink: RequestHandler = async (req, res) => {
    const { email } = req.body
    const user = await UserModel.findOne({ email })
    if (!user) return sendErrorRes(res, "Account not found!", 404);

    await PasswordResetTokenModel.findOneAndDelete({ owner: user._id })
    const token = crypto.randomBytes(36).toString('hex')
    await PasswordResetTokenModel.create({ owner: user._id, token })
    const passResetLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`
    await mail.sendPasswordResetLink(user.email, passResetLink)

    res.json({ message: "Please check your email." })
};
export const isValidPassResetToken: RequestHandler = async (req, res, next) => {
    const { id, token } = req.body
    const resetPassToken = await PasswordResetTokenModel.findOne({ owner: id });
    if (!resetPassToken) return sendErrorRes(res, "Unauthorized request ,invalid token!", 403)
    const matched = await resetPassToken.compareToken(token)
    if (!matched) return sendErrorRes(res, "Unauthorized request ,invalid token!", 403);
    next();
};

export const grantValid: RequestHandler = async (req, res) => {
    res.json({ valid: true });
};
export const updatePassword: RequestHandler = async (req, res) => {
    const { id, password } = req.body

    const user = await UserModel.findById(id)
    if (!user) return sendErrorRes(res, "Unauthorized request!", 403)
    const matched = await user.comparePassword(password)
    if (matched) return sendErrorRes(res, "The new password must be different!", 422)
    user.password = password
    await user.save();

    await PasswordResetTokenModel.findOneAndDelete({ owner: user._id })

    await mail.sendPasswordUpdateMessage(user.email)
    res.json({ message: "Password rest successfully!" });
};

export const updateProfile: RequestHandler = async (req, res) => {
    const { name } = req.body
    if (typeof name !== "string" || name.trim().length < 3) {
        return sendErrorRes(res, "Invalid name!", 422)
    }
    await UserModel.findByIdAndUpdate(req.user.id, { name })
    res.json({ profile: { ...req.user, name } });
};
export const updateAvatar: RequestHandler = async (req, res) => {
    const { avatar } = req.files;
    if (Array.isArray(avatar)) {
        return sendErrorRes(res, "Multiple files are not allowed!", 422)
    }
    if (!avatar.mimetype?.startsWith("image")) {
        return sendErrorRes(res, "Invalid image file!", 422);
    }


    const user = await UserModel.findById(req.user.id)
    if (!user) {
        return sendErrorRes(res, "User not found!", 404)
    }
    if (user.avatar?.id) {
        await cloudUploader.destroy(user.avatar.id)
    }
    const { secure_url: url, public_id: id } = await cloudUploader.upload(avatar.filepath,
        {
            width: 300,
            height: 300,
            crop: "thumb",
            gravity: "face"
        }

    )
    user.avatar = { url, id }
    await user.save()
    res.json({ profile: { ...req.user, avatar: user.avatar.url } })
};

export const updateAvatarr: RequestHandler = async (req, res) => {
    const avatar = req.files?.avatar;

    if (!avatar) {
        return sendErrorRes(res, "No file uploaded!", 400);
    }

    if (Array.isArray(avatar)) {
        return sendErrorRes(res, "Multiple files are not allowed!", 422);
    }

    if (!avatar.mimetype?.startsWith("image")) {
        return sendErrorRes(res, "Invalid image file!", 422);
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
        return sendErrorRes(res, "User not found!", 404);
    }

    try {
        if (user.avatar?.id) {
            await cloudUploader.destroy(user.avatar.id);
        }

        const cloudRes = await cloudUploader.upload(avatar.filepath);

        user.avatar = {
            url: cloudRes.secure_url,
            id: cloudRes.public_id,
        };

        await user.save();

        res.json({
            message: "Avatar updated successfully!",
            avatar: user.avatar,
        });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        sendErrorRes(res, "Failed to update avatar!", 500);
    }
};
export const sendPublicProfile: RequestHandler = async (req, res) => {
   const profileId = req.params.id
   if(!isValidObjectId(profileId)){
     return sendErrorRes(res, "Invalid profile id!", 422)
   }
   const user = await UserModel.findById(profileId)
   if(!user){
    return sendErrorRes(res, "Profile not found!", 404)
  }
  res.json({profile: {id: user._id, name: user.name, avatar: user.avatar?.url}})
}

