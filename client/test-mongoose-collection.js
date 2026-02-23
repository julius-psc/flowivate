const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/productivity-dashboard');
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const db = mongoose.connection.db;
    await db.collection("layouts").deleteMany({ userId: "test" }, { session });
    console.log("Success with native collection in transaction");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    session.endSession();
    mongoose.disconnect();
  }
}
run();
