


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

function md5(string){
  return crypto.createHash('md5')
               .update(string)
               .digest('hex');
}

var scanDir = argv.s || false;

var logfile = argv.f || false;

index = (typeof argv.i === 'string') ? argv.i : index;


var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client(config.elasticsearch);

if (typeof scanDir === 'string'){
  //return console.log('Starting scan of dir.. not implemented');


  indexer.scan(scanDir, scanlog, function (err, stats){
    var total  = stats.folders.length + stats.files.length;
    console.log([
      '',
      'All done, log file is: ' + scanlog,
      'Total files and folders ' + total
    ].join('\n'));

    syncStart(stats.files, function (err, res){
      console.log('Done',  err, res);
    });
  });
}else{

  if (!logfile) return console.log('Logfile is required if no scan is set');

  var array = ReadLogFileSync(logfile);

  syncStart(array, function (err, res){
    console.log('Done', err, res);
  })

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
  client.get({
    index: index,
    type: type,
    id: id
  }, function (error, response) {
    if(error) return callback('exists', error, response);
    callback(error, response);
  });
}

function syncStart(array, callback){
  callback = callback || function (){};
  async.forEachLimit(array, 4, function (item, next){

    if (item.type === 'directory') return next();

    var filename = item.stats.name.split('.').shift();

    var id_hash = md5(filename);

    es_exists(index, 'image', id_hash, function (err, res){
      if (!err) return next();
      console.log(filename, 'does not exist');
      logToFile(item, next);
    })

    // next();
  }, function (){
    console.log('Done with:', array.length)
    callback(null, array.length);
  })
}
