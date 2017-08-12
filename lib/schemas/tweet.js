var mongoose = require('mongoose');
mongoose.Promise = require('promise');
var Schema = mongoose.Schema;
var Tweet = require('../models/tweet');

var tweet = new Schema({
  id_str: {
    type: String,
    unique: true
  },
  sentiment: {
    score: Number,
    comparative: Number
  },
  created_at: String
});

module.exports = tweet;
