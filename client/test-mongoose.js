const mongoose = require('mongoose');
try {
  mongoose.model("layouts");
} catch (e) {
  console.error("Error:", e.message);
}
