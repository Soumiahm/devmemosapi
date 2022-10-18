/** This file is for catching errors in async methods of the controller in order to simplify the code and replace try/catch in controller **/

module.exports = catchAsync = (fn) => {
  return (req, res, next) => fn(req, res, next).catch(err => next(err)); 
};