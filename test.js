var express = require('express'); //express handles routes
var http = require('http');
var request = require('request');
var app = express(); //starting express
app.set('port', process.env.PORT || 3000); //set port to cloud9 specific port or 3000
app.use(express.bodyParser()); //body parser used to parse request data
app.use(app.router);

var model = require('./model.js');

var doc = model.createEmptyQuestion();
doc.question = "TEST question";
doc.ranking = 5;
doc.area = 2;

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var dbUrl = "mongodb://" + process.env.IP + "/test";

MongoClient.connect(dbUrl, function(err, db) {
    assert.equal(null, err);
    model.indexDB(db, function() {
        console.log("index");
    });
  });
