import "dotenv/config";
import "express-async-errors";
import "src/db";
import express, { RequestHandler } from 'express';
import authRouter from 'routes/auth';
import formidable from 'formidable';
import path from "path";
import productRouter from "./routes/product";
console.log(process.env);
const app = express();
app.use(express.static('src/public'))
//  const bodyParser : RequestHandler = (req, res, next) => {
//     req.on("data",(chunk) =>{
//        req.body = JSON.parse(chunk);
//        next();
//     });
// }

// app.use(bodyParser)
app.use(express.json());
app.use(express.urlencoded({extended: true}));
// app.get('/', (req, res) => {
//     // res.send("<h1>Hello From Server</h1>")
//     //res.status(401).send("<h1>Hello From Server</h1>");
//      res.status(401).json({message: "This message is coming from Server."})
// });

// app.post('/' ,(req, res) => {
//     console.log(req.body);
//     res.json({message: "This message is coming from post request."});
// });
// app.post('/create-new-product',(req, res) => {
//     console.log(req.body);
//     res.json({message: "This message is coming from product create."});
// });
//http://localhost:8000/upload-file  //my-file
app.use("/auth",authRouter);
app.use("/product",productRouter);

console.log(__dirname, 'public');
app.post("/upload-file", async (req, res) => {
   const form = formidable({
        uploadDir: path.join(__dirname, 'public'),
        filename(name, ext , part, form){
            // console.log("name: " , name);
            // console.log("ext: " , ext);
            // console.log("part: " , part);

            return Date.now() + "_" + part.originalFilename
        },
    });
  await  form.parse(req);
  res.send("ok");
})
app.use(function(err,req, res, next) {
 res.status(500).json({message: err.message});
} as express.ErrorRequestHandler);

app.listen(8000, () => {
 console.log("The app is running on http://localhost:8000");
});