// The notebookSchema will be embeded inside the user schema
const mongoose = require("mongoose");
const idvalidator = require("mongoose-id-validator");

notebookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a notebook title"],
      maxLength: [
        35,
        "A notebook title must have less or equal than 35 characters",
      ],
    },
    color: { type: String, default: "#FFA500" },
    active: { type: Boolean, default: true, select: false },
    createdAt: { type: Date, default: Date.now },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A notebook must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//We will be using virtual populating of the notes, so when we get a notebook, we also get the notes associated with it
//virtual populate
notebookSchema.virtual("notes", {
  ref: "Note",
  foreignField: "notebook",
  localField: "_id",
});

//Verify that a document which references other documents by their ID is referring to documents that actually exist.
notebookSchema.plugin(idvalidator);

const Notebook = mongoose.model("Notebook", notebookSchema);

module.exports = Notebook;
