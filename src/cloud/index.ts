import { v2 as cloudinary } from 'cloudinary'

const CLOUD_NAME = process.env.CLOUD_NAME!
const CLOUD_KEY = process.env.CLOUD_KEY!
const CLOUD_SECRET = process.env.CLOUD_SECRET!
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_KEY,
    api_secret: CLOUD_SECRET,
    secure: true,
    // use_https: true,
    // timeout: 5000,
    // connectTimeout: 5000,
    // retryAttempts: 3,
});
const cloudUploader = cloudinary.uploader;
export const cloudApi = cloudinary.api;
export default cloudUploader;