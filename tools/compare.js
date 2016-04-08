var indexer = require('../lib/indexer.js');

var fs = require('fs');
var path = require('path');
var async = require('async');
var argv = require('yargs').argv;

var src = argv._[0];
var dst = argv._[1];

var thumbs = argv.t || false;
var fileType = argv.e || 'jpg';

var now = new Date().toISOString().replace(/:/g, '_');


var logFileNew = ['../logs/compare-new-', now, '.log'].join('');
var logFileNewThumbs = ['../logs/compare-thumbs-new-', now, '.log'].join('');
var logFileModified = ['../logs/compare-modified-', now, '.log'].join('');

function writeLog(logfile, item, callback){
  var json = JSON.stringify(item) + '\n';

  fs.appendFile(logfile, json, callback);
}

function writeModified(array, callback){
  async.forEachLimit(array, 1, function (item, next){
    writeLog(logFileModified, item, next);
  },callback)
}
function writeNew(array, callback){
  async.forEachLimit(array, 1, function (item, next){
    writeLog(logFileNew, item, next);
  },callback)
}

if (!src || !dst){
  return console.log([
    'Src or dest neede',
    'compare, "src" "dst" args'
  ].join('\n'));
}


if (argv.h || argv.help){

  return console.log([
    'compare source destination',
    '[-e (jpg)]'
  ].join('\n'));
}


var options = {
  fileType : fileType
};


if (thumbs){
  return indexer.compareThumbs(src, dst, options, function (err, resp){
    if (err) return console.log('error', err);

    console.log('Done comparing, writing logfiles');
    writeNew(resp.newFiles, function (){
      console.log('Wrote', logFileNewThumbs, 'size:', resp.newFiles.length);
    });
  })
}

indexer.compare(src, dst, options, function (err, resp){
  if (err) return console.log('error', err);

  console.log('Done comparing, writing logfiles');
  writeNew(resp.newFiles, function (){
    console.log('Wrote', logFileNew, 'size:', resp.newFiles.length);
  });

  writeModified(resp.modifiedFiles, function (){
    console.log('Wrote', logFileModified, 'size:', resp.modifiedFiles.length);
  });

})
