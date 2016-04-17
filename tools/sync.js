


var indexer = require('../lib/indexer.js');

var fs = require('fs');
var path = require('path');
var async = require('async');
var argv = require('yargs').argv;

var now = new Date().toISOString().replace(/:/g, '_');

var config = require('../config.js');

var index = config.index;

var crypto = require('crypto');

var filename = ['../logs/', 'es-sync-', now, '.log'].join('');

var scanlog = ['../logs/', 'all-files-', now, '.log'].join('');

var moment = require('moment');



var slug = require('slug');

slug.defaults.modes['pretty'] = {
    replacement: '-',
    symbols: true,
    remove: /[.]/g,
    lower: true,
    charmap: slug.charmap,
    multicharmap: slug.multicharmap
};

function md5(string){
  return crypto.createHash('md5')
               .update(string)
               .digest('hex');
}

var scanDir = argv.s || false;

var logfile = argv.f || false;

index = (typeof argv.i === 'string') ? argv.i : index;


var fromTimestamp = argv.t || false;


fromTimestamp = parseTimestmap(fromTimestamp);


var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client(config.elasticsearch);

if (typeof scanDir === 'string'){
  //return console.log('Starting scan of dir.. not implemented');

  console.log('Starting scan of:', scanDir);
  indexer.scan(scanDir, scanlog, function (err, stats){
    if (err) return console.log('Error reading files', err);

    var total  = stats.folders.length + stats.files.length;
    console.log([
      '',
      'All done, log file is: ' + scanlog,
      'Total files and folders ' + total
    ].join('\n'));

    console.log('Found:', stats.files, 'files');
    syncStart(stats.files, function (err, res){
      console.log('Done', err);
    });
  });
}else{

  if (!logfile) return console.log('Logfile is required if no scan is set');

  var array = ReadLogFileSync(logfile);

  syncStart(array, function (err, res){
    console.log('Done', err, res);

    console.log({
      filename :filename,
      scanlog : scanlog
    })
  })

}

function parseTimestmap(timestamp){

  if (!moment(timestamp).isValid()){
    return false;
  }

  return +moment(timestamp);
}

function onlyNewItems(array, fromTimestamp){
  var newFiles = array.filter(function (item){
    var epoch = ((+item.stats.mtime) >= (+item.stats.ctime)) ? item.stats.mtime : item.stats.ctime;

    var modified = epoch.getTime();

    if (modified > fromTimestamp){
      return true;
    }

    return false;

  });
}


function exists (filename){
  try {
    fs.statSync(filename);
    return true;
  } catch (e) {
    return false;
  }
}

function jsonParse (string){
  try {
    return JSON.parse(string);
  } catch (e) {
    return false;
  }
}

function ReadLogFileSync(filename){

  if (!exists(filename)){
    console.log('File does not exists', filename);
    return false;
  }

  var content = fs.readFileSync(filename).toString('utf8');

  return content.split('\n').map(jsonParse).filter(function (e){return e});

}

function logToFile(data, callback){
  var json = JSON.stringify(data)  + '\n';
  fs.appendFile(filename, json, function (err, res){
    if (err) console.log('Error reporting error', err);
    callback();
  });
}

function es_exists(index, type, id, callback){

  client.exists({
    index: index,
    type: type,
    id: id
  }, function (error, exists) {
    if(error) return callback(error);
    if (exists === true) {
      return callback(null, true);
    }
    callback(null, false);
  });
}

function syncStart(array, callback){
  callback = callback || function (){};

  if (fromTimestamp){
    array = onlyNewItems(array, fromTimestamp);
  }

  var noneExisting = [];

  console.log('Starting', array.length);

  async.forEachLimit(array, 4, function (item, next){

    if (item.type === 'directory') return next();

    var filename = item.stats.name.split('.').shift();
    var slugged = slug(filename);
    es_exists(index, 'image', slugged, function (err, res){
      if (err) return next(err);

      if(res === false){
        console.log(filename, slugged, 'does not exist');
        noneExisting.push(item);
        return logToFile(item, next);
      }
      return next();

    });

    // next();
  }, function (){
    console.log('None existing', noneExisting.length);
    callback(null, {
      totalItems : array.length,
      noneExisting : noneExisting
    });
  })
}
