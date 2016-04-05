var indexer = require('./lib/indexer.js');

var fs = require('fs');
var path = require('path');
var async = require('async');
var argv = require('yargs').argv;

var src = argv._[0];
var dst = argv._[1];


indexer.compare(src, dst, function (err, resp){
  console.log(err, resp);
})
