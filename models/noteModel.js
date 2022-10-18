const mongoose = require("mongoose");
const idvalidator = require("mongoose-id-validator");

const noteSchema = new mongoose.Schema(
  {
    //should i add note description?
    title: {
      type: String,
    default: "Untitled",
      required: [true, "A note must contain at least a title"],
      maxLength: [
        100,
        "A note title must have less or equal than 100 characters",
      ],
    },
    description: {
      type: String,
      maxLength: [200, "A note description cannot exceed 200 characters"],
    },
    content: {
      type: String,
      maxLength: [70000, "A note cannot exceed 6000 characters"],
    },
    location: {
      type: { type: String, default: "Point", enum: ["Point"] },
      coordinates: [Number],
    },
    favorite: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    active: { type: Boolean, default: true, select: false },

    notebook: {
      type: mongoose.Schema.ObjectId,
      ref: "Notebook",
      required: [true, "Note must belong to a notebook"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Note must belong to a user"],
    },
    //Adding properties so that virtual objects also show up in json and objects outputs
    //All this does in to make sure when we have a virtual property - a field that is not stored in the database
    // but only calculated using some other value, so we want this to also show up whenever there is an output
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

noteSchema.plugin(idvalidator);
//Set index for search queries
noteSchema.index({content: 'text'});

//In case we wanted to populate the notebook field when getting notes
// noteSchema.pre(/^find/, function (next) {
//   this.populate({path: "notebook", select: "title"});
//   next();
// });

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
