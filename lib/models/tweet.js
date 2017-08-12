var mongoose = require('mongoose');
mongoose.Promise = require('promise');
var tweetSchema = require('../schemas/tweet');
var Tweet = mongoose.model('tweets', tweetSchema);

module.exports = Tweet;
