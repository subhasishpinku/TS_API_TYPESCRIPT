import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { describe } from "node:test";
import cloudUploader, { cloudApi } from "src/cloud";
import ProductModel from "src/models/product";
import { UserDocument } from "src/models/users";
import categories from "src/utils/categories";
import { sendErrorRes } from "src/utils/helper";
const uploadImage = (filePath: string): Promise<UploadApiResponse> => {
    return cloudUploader.upload(filePath, {
        width: 1280,
        height: 720,
        crop: "fill",
        // quality:90
    })
}
export const listNewProduct: RequestHandler = async (req, res) => {
    const { name, price, category, description, purchasingDate, thumbnail } = req.body;
    const newProduct = new ProductModel({
        owner: req.user.id,
        name,
        price,
        category,
        description,
        purchasingDate,
        thumbnail
    })
    const { images } = req.files
    const isMultipleImages = Array.isArray(images);
    if (isMultipleImages && images.length > 5) {
        return sendErrorRes(
            res,
            "Image Files can not be more than 5!",
            422
        );
    }

    let invalidFileType = false
    if (isMultipleImages) {
        for (let img of images) {
            if (!img.mimetype?.startsWith("image")) {
                invalidFileType = true;
                break;
            }

        }
        // newProduct.save()
    } else {
        if (images) {
            if (!images.mimetype?.startsWith("image")) {
                invalidFileType = true;
            }
        }

    }

    if (invalidFileType)
        return sendErrorRes(
            res,
            "Invalid file type, files must be image type!",
            422
        );
    if (isMultipleImages) {
        const uploadPromise = images.map(file => uploadImage(file.filepath));
        const uploadResults = await Promise.all(uploadPromise);
        newProduct.images = uploadResults.map(({ secure_url, public_id }) => {
            return { url: secure_url, id: public_id }
        });
        newProduct.thumbnail = newProduct.images[0].url
    } else {
        if (images) {
            const { secure_url, public_id } = await uploadImage(images.filepath);
            newProduct.images = [{ url: secure_url, id: public_id }];
            newProduct.thumbnail = secure_url
        }
    }
    await newProduct.save();

    res.status(201).json({ message: "Added new Product!" });
};
export const updateProduct: RequestHandler = async (req, res) => {
    const { name, price, category, description, purchasingDate, thumbnail } = req.body;
    const productId = req.params.id;
    if (!isValidObjectId(productId))
        return sendErrorRes(res, "Invalid product id!", 422);

    const product = await ProductModel.findOneAndUpdate({ _id: productId, owner: req.user.id }, {
        name,
        price,
        category,
        description,
        purchasingDate
    }, {
        new: true,
        // runValidators: true
    })

    if (!product) return sendErrorRes(res, "Product not found!", 404);

    if (typeof thumbnail === "string") product.thumbnail = thumbnail

    const { images } = req.files
    const isMultipleImages = Array.isArray(images);

    // if (product.images.length >= 5) {
    //     return sendErrorRes(
    //         res,
    //         "Image Files can not be more than 5!",
    //         422
    //     );
    // }
    if (isMultipleImages) {
        const oldImages = product.images?.length || 0

        if (oldImages + images.length > 5)
            return sendErrorRes(
                res,
                "Image Files can not be more than 5!",
                422
            );
    }
    let invalidFileType = false
    if (isMultipleImages) {
        for (let img of images) {
            if (!img.mimetype?.startsWith("image")) {
                invalidFileType = true;
                break;
            }

        }
        // newProduct.save()
    } else {
        if (images) {
            if (!images.mimetype?.startsWith("image")) {
                invalidFileType = true;
            }
        }

    }
    // product.name = name;
    // product.descriptions = description;

    // const newProduct = new ProductModel({
    //     owner: req.user.id,
    //     name,
    //     price,
    //     category,
    //     description,
    //     purchasingDate
    // })




    if (invalidFileType)
        return sendErrorRes(
            res,
            "Invalid file type, files must be image type!",
            422
        );
    if (isMultipleImages) {
        const uploadPromise = images.map(file => uploadImage(file.filepath));
        const uploadResults = await Promise.all(uploadPromise);
        const newImages = uploadResults.map(({ secure_url, public_id }) => {
            return { url: secure_url, id: public_id }
        });
        if (product.images)
            product.images.push(...newImages);
        else product.images = newImages
        // product.thumbnail = product.images[0].url
    } else {
        if (images) {
            const { secure_url, public_id } = await uploadImage(images.filepath);
            // product.images = [{ url: secure_url, id: public_id }];
            // product.thumbnail = secure_url
            if (product.images)
                product.images.push({ url: secure_url, id: public_id })
            else product.images = [{ url: secure_url, id: public_id }]
        }
    }
    await product.save();

    res.status(201).json({ message: "Product update Successfully!" });

};

export const deleteProduct: RequestHandler = async (req, res) => {
    const productId = req.params.id;
    if (!isValidObjectId(productId))
        return sendErrorRes(res, "Invalid product id!", 422);

    const product = await ProductModel.findByIdAndDelete({ _id: productId, owner: req.user.id });

    if (!product)
        return sendErrorRes(res, "product not found!", 404);
    const images = product.images || []
    if (images.length) {
        const ids = images.map(({ id }) => id)
        await cloudApi.delete_resources(ids)
    }
    res.status(201).json({ message: "Product remove Successfully!" });
};
export const deleteProductImage: RequestHandler = async (req, res) => {
    const { productId, imageId } = req.params;
    if (!isValidObjectId(productId))
        return sendErrorRes(res, "Invalid product id!", 422);

    const product = await ProductModel.findOneAndUpdate({ _id: productId, owner: req.user.id }, {
        $pull: {
            images: { id: imageId },
        },

    }, { new: true });

    if (!product) return sendErrorRes(res, "product not found!", 404);

    if (product.thumbnail?.includes(imageId)) {
        const images = product.images
        if (images)
            product.thumbnail = images[0].url;
        else product.thumbnail = "";
        await product.save();
    }

    product?.thumbnail

    //remove from cloud storage
    await cloudUploader.destroy(imageId);
    res.json({ message: "Image remove successfully." })
};
export const getProductDetail: RequestHandler = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
        return sendErrorRes(res, "Invalid product id!", 422);

    const product = await ProductModel.findById(id).populate<{
        owner: UserDocument
    }>("owner");
    if (!product)
        return sendErrorRes(res, "product not found!", 404);
    res.json({
        product: {

            id: product._id,
            name: product.name,
            description: product.descriptions,
            thumbnail: product.thumbnail,
            category: product.category,
            date: product.purchasingDate,
            price: product.price,
            images: product.images?.map(({ url }) => url),
            seller: {
                id: product.owner._id,
                name: product.owner.name,
                avatar: product.owner.avatar?.url
                // email: product.owner.email,

            }
            // images: product.images?.map(({ url }) => url) || [],
        }
    })

};
export const getProductsByCategory: RequestHandler = async (req, res) => {
  //http://localhost:8000/product/by-category/Electronics?pageNo=1&limit=2
    const {category} = req.params
    const {pageNo="1", limit="10"} = req.query as {
        pageNo : string, 
        limit : string}
    if(!categories.includes(category))
        return sendErrorRes(res, "Invalid category!",422)
    const products = await ProductModel.find({category})
    .sort('-createdAt')
    .skip((+pageNo -1) * +limit)
    .limit(+limit);
    const listings = products.map(p => {
        return {
            id: p._id,
            name: p.name,
            thumbnail: p.thumbnail,
            category: p.category,
            price: p.price,     
        }
    })
    res.json({products : listings})
}

export const getLatestProducts: RequestHandler = async (req, res) => {
    const products = await ProductModel.find()
    .sort('-createdAt')
    .limit(10);
    const listings = products.map(p => {
        return {
            id: p._id,
            name: p.name,
            thumbnail: p.thumbnail,
            category: p.category,
            price: p.price,     
        }
    })
    res.json({products : listings})
}

export const getListings: RequestHandler = async (req, res) => {
    const {pageNo="1", limit="10"} = req.query as {
        pageNo : string, 
        limit : string}
  
    const products = await ProductModel.find({owner: req.query.id})
    .sort('-createdAt')
    .skip((+pageNo -1) * +limit)
    .limit(+limit);
    const listings = products.map(p => {
        return {
            id: p._id,
            name: p.name,
            thumbnail: p.thumbnail,
            category: p.category,
            price: p.price, 
            image: p.images?.map(i => i.url),
            date: p.purchasingDate,
            description: p.descriptions,
            seller: {
                id: req.user.id,
                name: req.user.name,
                avatar: req.user.avatar
                // email: product.owner.email,

            }
        }
    })
    res.json({products : listings})
}



