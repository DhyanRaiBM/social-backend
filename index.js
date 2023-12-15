import express from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import router from "./routes/index.js";
import path from "path";
import ejs from "ejs";



//-security packages:
import helmet from "helmet";
import dbConnection from "./dbConfig/index.js";
import errorMiddleware from "./middleware/errorMIddleware.js";

dotenv.config();

const __dirname = path.resolve(path.dirname(""));

const app = express();
// app.use(express.static(path.join(__dirname, "views")));

const PORT = process.env.PORT || 8800;

//- Set the view engine to EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//-DB configuration:
dbConnection();

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));


app.use(morgan("dev"));
app.use(router);

//-Error Middleware:
app.use(errorMiddleware)




app.listen(PORT, () => {
    console.log(`The server is running at http://localhost:${PORT}`);
});