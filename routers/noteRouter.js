const express = require("express");
const noteController = require("../controllers/noteController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });
// we need this mergeParams because by default each router has access to the params of their specfic routes
//here we need to access to the notebookId from the notebook router

//all note routes are only for logged in users
router.use(authController.protectRoute);

router
  .route("/favorites")
  .get(
    noteController.favoritNotesFilter,
    noteController.aliasFavoriteNotes,
    noteController.getAllNotes
  );

  router.route("/analytics").get(noteController.getNotesStats);
    
    
  router.route("/search-notes").get(noteController.setSearchfilter, noteController.getAllNotes );


router
  .route("/")
  .post(noteController.setNotebookUserId, noteController.createNote)
  .get(noteController.notesPerNotebookFilter, noteController.getAllNotes)
  // .get(noteController.getAllNotes);

router
  .route("/:id")
  .get(noteController.getNote)
  .patch(noteController.updateNote)
  .delete(noteController.deleteNote);

module.exports = router;
