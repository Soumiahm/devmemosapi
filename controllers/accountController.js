//To reimplement - example for subdocument => change that

const AppError = require("../utils/appError");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");

exports.createNotebook = catchAsync(async (req, res, next) => {
  // The request has the logged in user
  const user = req.user;
  user.notebooks.push(req.body);
  const notebook = user.notebooks.slice(-1)[0];
  // Manual validation of the subdocument
  const err = await notebook.validateSync();

  if (err) {
    return next(new AppError(err.errors["title"].message, 404));
  }

  user.save({ validateBeforeSave: false });

  res.status(201).json({
    status: "success",
    data: { notebook },
  });
});

exports.getNotebook = catchAsync(async (req, res, next) => {
  const user = await req.user.notebooks.id(req.params.id); 
  const notebook = await user.notebooks.id(req.params.id); //user needs to be logged in
  notebook.populate('notes'); 

  //const notebook = await req.user.notebooks.id(req.params.id); //user needs to be logged in

  if (!notebook) {
    return next(new AppError("no notebook found with that id", 404));
  }
  res.status(200).json({ status: "success", data: { notebook } });
});

exports.updateNotebook = catchAsync(async (req, res, next) => {
  const notebook = await req.user.notebooks.id(req.params.id); //user needs to be logged in
  if (!notebook) {
    return next(new AppError("no notebook found with that id", 404));
  }

  notebook.set(req.body);

  const err = await notebook.validateSync();

  if (err) {
    return next(new AppError(err.errors["title"].message, 404));
  }

  await req.user.save({ validateBeforeSave: false });

  res.status(201).json({ status: "success", data: { notebook } });
});

exports.deleteNotebook = catchAsync(async (req, res, next) => {
  const notebook = await req.user.notebooks.id(req.params.id); //user needs to be logged in
  if (!notebook) {
    return next(new AppError("no notebook found with that id", 404));
  }
  notebook.remove();

  req.user.save({ validateBeforeSave: false });
  res.status(204).json({ status: "success", data: null });
});
