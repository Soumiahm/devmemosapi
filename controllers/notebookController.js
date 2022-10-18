const AppError = require("../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./factoryHandler");
const Notebook = require("./../models/notebookModel");
const Note = require("../models/noteModel");

//Middleware to set user Id when creating a new notebook
exports.setUserId = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;
  next();
};
//Middleware to find notebooks per user, didn't we do populate users with notebooks?? :: model is Notebook 
exports.userNotebooksFilter = (req, res, next) => {
  req.filter = { user: req.user._id}; 
  next();
};

exports.getMyNotebooks = factory.getAll(Notebook);

exports.createNotebook = factory.createOne(Notebook);

exports.getNotebook = factory.getOne(Notebook, {
  path: "notes",
  select: "-__v",
});

exports.updateNotebook = factory.updateOne(Notebook);

exports.deleteNotebook = factory.deleteOne(Notebook);
