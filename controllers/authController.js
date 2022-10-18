const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const sendEmail = require("./../utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  //- using the standard HSA 256 encryption for the signature, the secret should be at least 32 characters long , but the longer the better
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === "production",
    httpOnly: true, //cookie cannot be accessed or modified by the browser. it will send it with every request
  };
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined; // set password to undefined before sending it to the client, we do not want to show

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  let newUser = await User.create({
    // Only allow the data that we need to be put into the new user / avoid a new user setting role to admin
    // To add a new admin. create a new user normally, and then manually change the role to admin from the database
    // Another alternative is to create a special new route just to create admins
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    // passwordChangedAt: req.body.passwordChangedAt, //TO BE REMOVED, ADDED FOR TESTING PURPOSES ONLYYYY
    //role: req.body.role //TO BE REMOVED, ADDED FOR TESTING PURPOSES ONLYYYY
  });

  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if user email and password exist
  if (!email || !password) {
    //use return in order to prevent the server from sending 2 responses( the error response with next, and the res.. response)
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Check if user exists and password is correct
  //here select('+password') is for also selecting the password, because in the user model, we had select set to false
  const user = await User.findOne({ email })
    .select("+password")
    .populate("notebooks");

  //for security reasons, we do not tell the user where the error come from (incorrect email or password)
  //await.verifyPassword... will only work if the user exists, that's the if statement checks forst if the user exists
  //if user doesn't exist, it won't run the verifyPassword function
  if (!user || !(await user.verifyPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything is OK, send the token to the user

  createAndSendToken(user, 200, res);
});

//authenticated user
exports.protectRoute = catchAsync(async (req, res, next) => {
  // 1) Check if the token exists

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    //Allow users authentication based on tokens sent via cookies as well
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("Please login to get access", 401));
  }

  // 2) Verification of token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does no longer exist", 401)
    );
  }

  // 4) Check if user did not update their password after the last token was issued
  // console.log(currentUser);
  const updatedPasswordAfter = currentUser.UpdatedPasswordAfter(decoded.iat); //iat -> issued at
  if (updatedPasswordAfter) {
    // console.log("user: ", currentUser);
    return next(
      new AppError(
        "User has recently changed their password, please login again!",
        401
      )
    );
  }
  // 5) Grant access to the protected route
  req.user = currentUser; // Put the entire user data on the request, as we might need it at some point in the future
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //roles is an array of users roles  passed this middleware ['admin', 'moderator'], default is 'user'
    if (!roles.includes(req.user.role)) {
      //we get the current user from the middleware before by storing the user into the request
      return next(
        new AppError("You do not have permission to perform this action", 403) //403 for forbidden
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(" There is no user with this email address", 404));
  }
  // 2) Generate a random token
  const resetPasswordToken = user.generateResetPasswordToken();

  //save user as user data was modified
  //validateBeforeSave is set to false, to avoid errors from not submiting all the data when saving the user to the db
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email address

  const resetPasswordURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetPasswordToken}`;
  try {
    await sendEmail({
      email: `${user.email}`,
      subject: "Reset your password (valid for 10 min)",
      message: `Hi ${user.name},\n We're sending you this email because you requested a password reset.
    Click on this link to create a new password:\n ${resetPasswordURL} \n
    If you didn't request a password reset, you can ignore this email. Your password will not be changed.
    Mindful Team`,
    });
    res.status(200).json({
      status: "success",
      message: "Token sent to email", //Token should not be in the response
    });
  } catch (err) {
    // In case of an error, we need to reset both the token and the expires properties
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Please try again later!",
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  if (!req.body.password || !req.body.passwordConfirm) {
    return next(
      new AppError("Password and passwordConfirm fields are required", 400)
    );
  }
  // 1) Get the user based on the token
  // All we need is to encrypt the token and compare it with the one stored in the db
  const resetToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // 2) If there is a user and token has not expired, set the new password
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordTokenExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // 3) Update changedPasswordAt property for the user
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiresAt = undefined;

  // user.changedPasswordAt = Date.now(); // we want to make this automatic so whenever the password is changed
  // we need to log in the time the password changed -> it will be implemented in the user model middleware

  //Save after modifying the document, Here we should not turn off the validators, because we need to validate
  await user.save();

  // 4) Log the user in, send the JWT token to the client
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // what's needed for the updating password: current password, new password, confirm new password
  // do i need to make sure these 3 fields exist?
  // next find the user based on their id as the req has passed through a middleware and select the password
  // if (!req.body.password || !req.body.passwordConfirm) {
  //   return next(
  //     new AppError("Password and passwordConfirm fields are required", 400)
  //   );
  // }
  // 1) Get user from collection
  // Only authenticated user have access to this action -> the current user is already on our req object
  const user = await User.findById(req.user._id).select("+password");

  // 2) Check if posted current password is correct
  if (!(await user.verifyPassword(req.body.currentPassword, user.password))) {
    return new AppError("Your current password is wrong", 401);
  }
  // console.log({
  //   currentPassword: req.body.currentPassword,
  //   userPassword: user.password,
  // });
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); //we do not turn off the validators because we want mongoose to check if passwordConfirm is same as password
  // User.findByIdAndUpdate will not work here <- user model validators only work during save + userSchema.pre("save" .. won't work in this case

  // 4) Log user in, send JWT
  createAndSendToken(user, 200, res);
});

// exports.updateUserData = catchAsync(async(req, res, next)=>{
//   //can be the user itself or the admin
//   //I'll make 2 routes :
//   //user: protectRoute, updateUserData or restrictTo(admin), updateUserData
//   //for the updateUserData steps:
//   //first authenticate - protectroute - then restrict route

//   const currentUser = await User.findById(req.user._id);
//   const user;
//   if(currentUser.role === 'user'){

//     user = currentUser;

//   } else if (user.role === 'admin'){
//     // should get the user with the id or name or email
//     user = await User.findById(req.body.userId);
//   }

//   user.name = req.body.name? req.body.name : user.name;
//   user.email = req.body.email? req.body.email : user.email;
//   user.photo = req.body.photo? req.body.photo : user.photo;

//   await user.save();

//   res.status(200).json({status: 'success', data: {user, message: 'user data updated successfuly!'}});

// });
