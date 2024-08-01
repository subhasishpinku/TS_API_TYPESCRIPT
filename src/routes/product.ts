import { Router } from "express";
import { deleteProduct, deleteProductImage, getLatestProducts, getListings, getProductDetail, getProductsByCategory, listNewProduct, updateProduct } from "src/controllers/product";
import { isAuth } from "src/middleware/auth";
import fileParser from "src/middleware/fileParser";
import validate from "src/middleware/validator";
import { newProductSchema } from "src/utils/validationSchema";

const productRouter = Router();
productRouter.post("/list", isAuth, fileParser, validate(newProductSchema), listNewProduct);
//http://localhost:8000/product/list 
// name:Mobile Phone
// description:My fav mobile phone
// price:1888
// purchasingDate:2024-07-31T09:19:50.019Z
// category:Electronics
// //quantity:3.0

// Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YTc0OWU4Y2Y1ZGNkODkwZjM0M2JkMyIsImlhdCI6MTcyMjQxODk3NCwiZXhwIjoxNzIyNDE5ODc0fQ.wyeJ0QAj1nvPv-7qDy2axQyNrqimpqr0IxWPxUzEGzA
productRouter.patch("/:id",isAuth, fileParser, validate(newProductSchema),updateProduct);
//http://localhost:8000/product/66aa075901f7ad75a425742f
// name:new Mobile Phone
// description:My fav mobile phone
// price:1888
// purchasingDate:2024-07-31T09:19:50.019Z
// category:Electronics
// //quantity:3.0
// thumbnail:https://console.cloudinary.com/pm/c-e9b088b5cd2f6470d069fcd36631c9/media-explorer?assetId=f317e1cae7ae0afd0ca988209d39fa9c

// Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YTc0OWU4Y2Y1ZGNkODkwZjM0M2JkMyIsImlhdCI6MTcyMjQyNDEzMiwiZXhwIjoxNzIyNDI1MDMyfQ.sRpHgDCOpFdniSkYVw3aWzDsXZ0UCx-HeszIYKHpYTY

productRouter.delete("/:id",isAuth,deleteProduct);
//http://localhost:8000/product/66aa075901f7ad75a425742f
// Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YTc0OWU4Y2Y1ZGNkODkwZjM0M2JkMyIsImlhdCI6MTcyMjQyODI3MCwiZXhwIjoxNzIyNDI5MTcwfQ.PAff7oU6Lmf5F2-NCoVCpdIsIs5Dt2EOw4rneej2ELw
productRouter.delete("/image/:productId/:imageId",isAuth, deleteProductImage);
//http://localhost:8000/product/image/66aa08ff01f7ad75a4257432/bsmrqcbs7ze9wanopk24
//// Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YTc0OWU4Y2Y1ZGNkODkwZjM0M2JkMyIsImlhdCI6MTcyMjUxNTU2MCwiZXhwIjoxNzIyNTE2NDYwfQ.uDL7Svb9RdgJ2awcZ8QKWveNA7feDiEuwh57YFJz0Ac

productRouter.get("/detail/:id",isAuth, getProductDetail);
//http://localhost:8000/product/66aa08ff01f7ad75a4257432
// Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YTc0OWU4Y2Y1ZGNkODkwZjM0M2JkMyIsImlhdCI6MTcyMjUxNTU2MCwiZXhwIjoxNzIyNTE2NDYwfQ.uDL7Svb9RdgJ2awcZ8QKWveNA7feDiEuwh57YFJz0Ac
productRouter.get("/by-category/:category",isAuth, getProductsByCategory);
//http://localhost:8000/product/by-category/Electronics
//Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YTc0OWU4Y2Y1ZGNkODkwZjM0M2JkMyIsImlhdCI6MTcyMjUxNzE1OCwiZXhwIjoxNzIyNTE4MDU4fQ.PB--MDjYFaoFQf909ACRySaGl5RcE6uFUUKODQOsTmw
productRouter.get("/latest", getLatestProducts);
productRouter.get("/listings",isAuth, getListings);

export default productRouter;
