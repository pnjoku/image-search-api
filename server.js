'use strict';

var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Search = require('bing.search');
require('dotenv').config({
  silent: true
});

var historySchema = new Schema({
  term: String,
  when: String
});

var History = mongoose.model('History', historySchema);
var mongouri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/img-sal";
mongoose.Promise = global.Promise;
mongoose.connect(mongouri);


var app = require('express')();


app.listen(8080, function(){
  console.log("image-search started");
});

app.use(bodyParser.json());


app.get('/query/:query', handlePost);

  function handlePost(req, res) {
    // Get images and save query and date.
    var query = req.params.query;
    var size = req.query.offset || 10; // Number specified or 10
    console.log(process.env.API_KEY);
    var search = new Search(process.env.API_KEY);
    var history = {
      "term": query,
      "when": new Date().toLocaleString()
    };
    // Save query and time to the database
    if (query !== 'favicon.ico') {
      save(history);
    }

    // Query the image and populate results
    search.images(query, {
        top: size
      },
      function(err, results) {
        if (err) throw err;
        res.send(results.map(makeList));
      }
    );
  }


  app.get('/latest', getHistory);
  
    function getHistory(req, res) {
    // Check to see if the site is already there
    History.find({}, null, {
      "limit": 10,
      "sort": {
        "when": -1
      }
    }, function(err, history) {
      if (err) return console.error(err);
      console.log(history);
      res.send(history.map(function(arg) {
        // Displays only the field we need to show.
        return {
          term: arg.term,
          when: arg.when
        };
      }));
    });
  }
  
      function makeList(img) {
    // Construct object from the json result
    return {
      "url": img.url,
      "snippet": img.title,
      "thumbnail": img.thumbnail.url,
      "context": img.sourceUrl
    };
  }
  
    function save(obj) {
    // Save object into db.
    var history = new History(obj);
    history.save(function(err, history) {
      if (err) throw err;
      console.log('Saved ' + history);
    });
  }



