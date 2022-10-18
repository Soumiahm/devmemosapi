const AppError = require("./../utils/appError");

// const handleDBCastError = (err) => {
//   return new AppError(`Invalid path ${err.path}: ${err.value}`, 400);
// };

const handleDbAndJwtError = (err) => {
  let message = "";
  let appErrorCode = 400;
  switch (err.name) {
    case "CastError": //db error
      message = `Invalid path ${err.path}: ${err.value}`;
      break;
    case "MongoError": //db error
      const duplicateValue = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
      if (err.code == 11000) {
        message = `Duplicate field value: ${duplicateValue}`;
      } else {
        message = `${err.message}`;
      }
      break;
    case "ValidationError": //db error
      message = `Invalid input data: ${err.message}`;
      break;
    case "JsonWebTokenError": //jwt error
      message = "Invalid token, please login again!";
      appErrorCode = 401;
      break;
    case "TokenExpiredError": //jwt error
      message = "Expired token, please login again!";
      appErrorCode = 401;
      break;

    default:
      // return Object.assign({}, err ); // better to return a copy of the object, but copying the object didn't work!
      return err;
  }
  return new AppError(message, appErrorCode);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  //Operational - trusted error: send details to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //Programming or an unknown error - don't leak error details
  } else {
    // 1) Log error - the error will be visible on the logs of the hosting platform that we're using
    console.error("ERROR: ", err);
    // 2) Send a generic message to client
    res
      .status(500)
      .json({ status: "error", message: "Something went very wrong!" });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV == "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV == "production") {
    // let error = { ...err };
    // if(error.name === "CastError") did not work! destructuring did not take up the name field of err!
    // if (err.name === "CastError") {
    //   error = handleDBCastError(error);
    // }
    const error = handleDbAndJwtError(err);
    sendErrorProd(error, res);
  }
};
