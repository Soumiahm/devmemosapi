const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email address!"],
    unique: [true, "Email already exists!"],
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email!"],
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  password: {
    type: String,
    required: [true, "Please provide a password"],
    minLength: [8, "Password must be more or equal to 8 characters"],
    select: false, //we do not want the password to be selected when we get the user(s) from the db
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm password"],
    validate: {
      validator: function (val) {
        //This only works on CREATE and SAVE !!
        //That's why we will always use save even when updating a user!
        return val === this.password;
      },
      message: "Confirm Password should match password",
    },
  },

  passwordChangedAt: Date,
  resetPasswordToken: String,
  resetPasswordTokenExpiresAt: Date,
  active: { type: Boolean, default: true, select: false }, //is the user's account still active
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
}
);

userSchema.virtual("notebooks", {
  ref: "Notebook",
  foreignField: "user",
  localField: "_id",
});

userSchema.pre("save", async function (next) {
  //  Only run this function if password is modified
  if (!this.isModified("password")) return next();
  // Hash password with cost of 12 - more than 12 will take longer to process
  this.password = await bcrypt.hash(this.password, 12);
  // Delete passwordConfirm field, no need to store it in the db
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  //Substracting 1 second is a little hack
  //sometimes the token is issued before the passwordChangeAt timestamp has been created
  //Because when the token is issued, we check if the password was modified after a token was issued
  // To ensure that the token is always created after the password has been changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  //This points to the query //req.params. query
  this.find({ active: { $ne: false } }); //Only documents with active set to true
  // $ne: not equal to false, so that we also include documents without the active field - the documents created
  // before we added this field to our user model.
  next(); //Call the next middleware
});

userSchema.methods.verifyPassword = async function (
  candidatePassword,
  userPassword
) {
  // We can't use this.password here because we set select to false!
  return await bcrypt.compare(candidatePassword, userPassword);
};

// To check if user had updated their password after a token was issued to them
userSchema.methods.UpdatedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    changedPasswordTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // const after = JWTTimeStamp < changedPasswordTimeStamp;
    // console.log(`${JWTTimeStamp} < ${changedPasswordTimeStamp} is ${after} because ${changedPasswordTimeStamp-JWTTimeStamp} > 0`)
    return JWTTimeStamp < changedPasswordTimeStamp;
  }
  return false; // false for not changed
};

userSchema.methods.generateResetPasswordToken = function () {
  //Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  //store encrypted token in the database - just like passwords, a plain token should not be stored in the db
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // console.log({ resetToken }, this.resetPasswordToken);
  this.resetPasswordTokenExpiresAt = Date.now() + 10 * 60 * 1000; //in milliseconds - token expires in 10 min
  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
