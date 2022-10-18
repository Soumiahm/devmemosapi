const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Routers
const userRouter = require("./routers/userRouter");
const notebookRouter = require("./routers/notebookRouter");
const noteRouter = require("./routers/noteRouter");

// Error handler
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

//Enable CORS for a Single Route
const corsOptions ={
  origin:'http://localhost:3000', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200
}
app.use(cors(corsOptions));

// 1)GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet()); //Should be right at the beginning to ensure security headers are set

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "5mb" })); // here we can also limit the data in the body
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Data sanitization against NoSQL query injections
app.use(mongoSanitize());

// Data sanitization against XSS - Cross-site scripting
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({ whitelist: ["search", "text", "ratingQuantity", "ratingAverage", ""] })
);

// Limit requests from same IP
// Setting a rate limit in order to prevent brute force attacks and denial of service
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: "Too many requests coming from this IP, please try again in an hour",
});

app.use(limiter);
// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  // console.log(req.headers)
  console.log(req.cookies);
  next();
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/notebooks", notebookRouter);
app.use("/api/v1/notes", noteRouter);

//Middleware is added to the middleware stack in the order that is defined in this code
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
