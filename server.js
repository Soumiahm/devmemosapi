const mongoose = require("mongoose");
const dotenv = require("dotenv");

//Uncaught exception handler, implemented before requiring the main app 
//The implemented error controller will handle uncaught exceptions from routes/controllers
process.on("uncaughtException", err => {
  console.log("UNCAUGHT EXCEPTION! 💥 .. SHUTTING DOWN ...");
  console.log(err.name, err.message);
  process.exit(1);

});

dotenv.config({ path: "./config.env" });
//Require the app file after our environment variables are read from the config file
const app = require("./app");

//console.log(app.get('env'));
//console.log(process.env);


//Database connection
db = process.env.DATABASE_LOCAL;
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("connection successful"));

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 .. SHUTTING DOWN ...");
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});
