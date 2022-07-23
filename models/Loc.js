const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    location: {type: Object, required: true},
  });

const Test = new mongoose.model("test", testSchema);

module.exports = Test;
