const express = require("express");
const authController = require("./../controllers/authController");
const notebookController = require("./../controllers/notebookController");
const noteController = require("./../controllers/noteController");
const noteRouter = require("./../routers/noteRouter");
const router = express.Router();

//Neste routes
router.use("/:notebookId/notes", noteRouter);

//all notebook routes are only for logged in users
router.use(authController.protectRoute);

router
  .route("/")
  .get(notebookController.userNotebooksFilter, notebookController.getMyNotebooks)
  .post(notebookController.setUserId, notebookController.createNotebook);
router
  .route("/:id")
  .get(notebookController.getNotebook)
  .patch(notebookController.updateNotebook)
  .delete(
    noteController.deleteAllNotesInNotebook,
    notebookController.deleteNotebook
  );

module.exports = router;
