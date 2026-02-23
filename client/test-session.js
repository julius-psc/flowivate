const mongoose = require('mongoose');
async function run() {
  await mongoose.connect('mongodb://localhost:27017/productivity-dashboard');
  const session = await mongoose.startSession();
  console.log("Is Mongoose session the native session?", session.constructor.name === "ClientSession");
  try {
    const db = mongoose.connection.db;
    // try to delete with session on db.collection
    console.log(Object.keys(mongoose.connection));
  } finally {
    session.endSession();
    mongoose.disconnect();
  }
}
run();
