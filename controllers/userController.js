const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const APIFeatures = require("./../utils/apiFeatures");
const AppError = require("./../utils/appError");
const factory = require("./factoryHandler");

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); //not for updating passwords
exports.deleteUser = factory.deleteOne(User);

exports.getMe =  (req, res, next) => {
  //so we can reuse the getUser function
  req.params.id = req.user._id;
  next();
}


exports.deleteMe = catchAsync(async (req, res, next) => {
  //When user deletes his/her account, we do not delete it, we just set the account to inactive
  // because we might need to access their acount in the future, only admin can permanently delete user, using delete user 
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({ status: "success", data: null });
});

exports.createUser = (req, res) => {
  res.status(400).json({
    status: "err",
    message: "This route is not defined, please use /signup instead",
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //Updating the user info only updating the password in another route
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for updating password. Please use /updatePassword instead",
        400
      )
    );
  }
  // const user = await User.findById(req.user._id);
  // Here we will use findByIdAndUpdate because we do not have to use user.save
  // save has to be used when we need to run pre-save methods from the User model.
  // we should filter the fields that need to be saved
  const filteredReqBody = filterObj(req.body, ["name", "email", "photo"]);
  console.log(
    { reqBody: req.body },
    { filteredReqBody },
    { userId: req.user._id }
  );

  const user = await User.findByIdAndUpdate(req.user._id, filteredReqBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

const filterObj = (obj, valuesArray) => {
  const asArray = Object.entries(obj);
  const filteredArray = asArray.filter(([key, value]) =>
    valuesArray.includes(key)
  );
  const filteredObj = Object.fromEntries(filteredArray);
  return filteredObj;
};
