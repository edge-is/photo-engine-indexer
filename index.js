

var indexer = require('./lib/indexer.js');

var fs = require('fs');
var path = require('path');
var async = require('async');
var argv = require('yargs').argv;

var scanDir = argv.s || false;

var logfile = argv.f || false;

var worklog = argv.w || false;

var conf = argv.c || './config.js';

var indexAfterScan = argv.i || false;

var exifjs = require('exifjs');

var config = GetConfig(conf) || {};

exif = new exifjs(config.exiftool);

var crypto = require('crypto');

function md5(string){
  return crypto.createHash('md5')
               .update(string)
               .digest('hex');
}


var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client(config.elasticsearch);

if (!logfile && !scanDir && !worklog){
  return console.log('Need to set scan directory(s), worklog(w) or logfile(f)');
}
function GetConfig(path){
  try {
    return require(path);
  } catch (e) {
    return false;
  }
}

function AddToWorklog(data, callback){
  worklog = worklog || 'worklog.log';
  var string = JSON.stringify(data) + '\n';
  fs.appendFile(worklog, string, callback);
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

if (scanDir){
  logfile = logfile || 'scanlog.log';
  indexer.scan('./img/', logfile, function (err, stats){
    if (!indexAfterScan){
      var total  = stats.folders.length + stats.files.length;
      return console.log([
        '',
        'All done, log file is: ' + logfile,
        'Total files and folders ' + total
      ].join('\n'));
    }

    IndexArray(stats.files);
  });
}else if ((typeof worklog === 'string') && !scanDir){
  console.log('Starting from crash reading', worklog);

  var array = ReadLogFileSync(worklog);
  /**FIXME need to finish this part**/
}else if ((typeof logfile === 'string') && !scanDir ){
  console.log('Starting from logfile...', logfile);
  var array = ReadLogFileSync(logfile);
  if (array && array.length > 0){
    IndexArray(array);
  }
}
function isImage(extension){
  extension = extension.toLowerCase();
  var extensions = ['.jpg', '.jpeg', '.png', '.tif', '.gif'];
  if (extensions.indexOf(extension) >= 0){
    return true;
  }
  return false;
}
function getArchivename(filepath){

  var parts = path.dirname(filepath).split(path.sep)

  return parts.pop();
}

function IndexArray(array, callback){

  callback = callback || function (){};
  console.log('Starting indexing files', array.length);

  async.forEachLimit(array, 4, function (item, next){
    var file = item.path;
    var parsed = path.parse(file);

    var fileId = md5(parsed.name);
    if (isImage(parsed.ext)){


      var archive = getArchivename(file);

      console.log('file', archive, '/', parsed.base);
      exif.get(file, function (err, metadata){
        if (err) {
          console.log('error getting metadata', err);
          return next();
        }

        var obj = metadata.pop();

        if (obj){
          obj.archive = archive;
          obj.filename = parsed.name;
          obj._id = fileId;
        }


        IndexToElasticsearch(obj, fileId, function (err, resp){
          var now = + new Date();
          AddToWorklog({ file : file, date : now }, next);
        });
      });
    }else{
      next();
    }

  }, function (){
    console.log('Array is done');
  });
}

function deleteNoIndexFields(data){
  if (!config.metadata) return data;
  var noIndex = config.metadata.noindex || [];

  noIndex.forEach(function (key){
    if (data[key]) delete data[key];
  });

  return data;
}

function IndexToElasticsearch(data, id,  callback){


  data = deleteNoIndexFields(data);

  client.index({
    index: config.index || 'images',
    type: 'image',
    body: data
  }, callback);
}
