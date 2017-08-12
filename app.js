require('dotenv').config()

const express = require('express')
const app = express()
const Rx = require('rxjs')
const Observable = Rx.Observable
const TwitterStream = require('twitter-stream-api')
const sentiment = require('sentiment')
const mongoose = require('mongoose')
const helmet = require('helmet')
const Tweet = require('./lib/models/tweet')

mongoose.Promise = require('promise');

let db = mongoose.connect('mongodb://localhost/tweet-analyze', {
  useMongoClient: true
})

let port = process.env.PORT || 3000
let filter = '@realDonaldTrump'
let in_reply_to = 'realDonaldTrump'
let keys = {
  consumer_key : process.env.CONSUMER_KEY,
  consumer_secret : process.env.CONSUMER_SECRET,
  token : process.env.ACCESS_TOKEN,
  token_secret : process.env.ACCESS_TOKEN_SECRET
}

let source$ = Observable.create(observer => {
  let Twitter = new TwitterStream(keys)

  Twitter.stream('statuses/filter', {
    track: filter
  })

  Twitter.on('data', function (obj) {
    observer.next(obj)
  })

  return () => {
    Twitter.close()
  }
})

function addTweet(tweet) {
  var s = sentiment(tweet.text)
  var newTweet = new Tweet({
    id_str: tweet.id_str,
    created_at: tweet.created_at,
    sentiment: {
      score: s.score,
      comparative: s.comparative
    }
  })

  newTweet.save()
  return newTweet
}

// Express
app.use(helmet())
app.use(express.static('public'))

app.get('/data', function (req, res) {
  Tweet
    .aggregate([{
      $group: {
        _id: '$sentiment.score',
        count: {$sum: 1}
      }
    }])
    .then(sums => {
      res.json(sums)
    })
})

app.get('/count', function (req, res) {
  Tweet
    .find({})
    .count()
    .then(count => {
      res.send(count.toString())
    })
})

// app.get('/worst-best-tweet', function (req, res) {
//   Tweet
//     .find({})
//     .remove(tweets => {
//       res.sendStatus(200)
//     })
// })

app.get('/clear', function (req, res) {
  Tweet
    .find({})
    .remove(tweets => {
      res.sendStatus(200)
    })
})

app.listen(port, function () {
  console.log('Example app listening on port', port)
})

// Db
db.then(function(db) {
  console.log('db connected!')

  // stream
  source$.filter(value => typeof value.id_str !== 'undefined')
  .filter(value => typeof value.text !== 'undefined')
  .filter(value => value.in_reply_to_screen_name === in_reply_to)
  // .throttleTime(500)
  // .throttleTime(1000 * 60 * 5)
  .subscribe(tweet => {
    addTweet(tweet)
  })
})
