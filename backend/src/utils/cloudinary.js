import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  let normalizedPath;
  try {
    if (!localFilePath) return null;
    normalizedPath = path.normalize(localFilePath);
    
    const response = await cloudinary.uploader.upload(normalizedPath, {
      ///Upload the file on cloudinary
      resource_type: "auto",
    });
    console.log("Upload Result:", response);
    //File has been uploaded successfully, now we can remove the file from local storage
    if (fs.existsSync(normalizedPath)) {
      fs.unlinkSync(normalizedPath);
    }
    return response;
  } catch (error) {
    if (normalizedPath && fs.existsSync(normalizedPath)) {
      fs.unlinkSync(normalizedPath); // remove the locally saved temp file in case of an error as well
    }
    console.log("Error uploading to Cloudinary:", error);
    return null;
  }
};

const getPublicId = (url) => {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1];
  return fileName.split(".")[0];
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return null;

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return result;
  } catch (error) {
    console.error("Cloudinary deletion failed:", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary, getPublicId };
