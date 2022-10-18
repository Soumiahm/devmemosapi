const Note = require("../models/noteModel");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const factory = require("./factoryHandler");
const catchAsync = require("../utils/catchAsync");
const auth = require("./authController");

exports.updateNote = factory.updateOne(Note);

exports.deleteNote = factory.deleteOne(Note);

exports.createNote = factory.createOne(Note);

exports.getNote = factory.getOne(Note);

//Middleware
//to find notes per notebook and user, if no notebook param -> return all notes for the current user
exports.notesPerNotebookFilter = async (req, res, next) => {
  if (req.params.notebookId) {
    req.filter = { user: req.user._id, notebook: req.params.notebookId };
  } else {
    req.filter = { user: req.user._id };
  }
  next();
};
//To find favorite notes per user
exports.favoritNotesFilter = (req, res, next) => {
  req.filter = { user: req.user._id, favorite: true };
  next();
};

//Middleware to delete all notes belonging to a notebook
exports.deleteAllNotesInNotebook = catchAsync(async (req, res, next) => {
  await Note.deleteMany({ notebook: req.params.id });
  next();
});

//Middleware to set notebook and user ids when creating a note
exports.setNotebookUserId = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;
  if (!req.body.notebook) req.body.notebook = req.params.notebookId;
  next();
};

exports.getAllNotes = factory.getAll(Note);

// ALIASING
exports.aliasFavoriteNotes = (req, res, next) => {
  req.query.favorite = true;
  req.query.sort = "-createdAt";
  next();
};

exports.setSearchfilter = (req, res, next) => {
  req.filter = { user: req.user._id, $text: { $search: req.query.search } };
  //If search query is empty or contains just whitespace, we want to return all current user notes
  if (!req.query.search || !req.query.search.trim())
    req.filter = { user: req.user._id };
  next();
};

// Get notes analytics using AGGREGATION
exports.getNotesStats = catchAsync(async (req, res, next) => {
  const totalNumNotes = await Note.countDocuments({ user: req.user._id });
  const stats = await Note.aggregate([
    {
      $match: { user: req.user._id },
    },
    {
      $lookup: {
        from: "notebooks",
        localField: "notebook",
        foreignField: "_id",
        as: "title",
      },
    },
    {
      $unwind: "$title",
    },
    {
      $project: { notebook: "$notebook", notebookTitle: "$title.title" },
    },
    {
      $group: { _id: "$notebookTitle", numNotes: { $sum: 1 } },
    },
    {
      $project: {
        _id: 0,
        notebookTitle: "$_id",
        numberOfNotes: "$numNotes",
      },
    },
  ]);
  res.status(200).json({ status: "success", data: { totalNumNotes, stats } });
});
