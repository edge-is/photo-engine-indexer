

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

var u = require('./lib/utils.js');

exif = new exifjs(config.exiftool);


var now = new Date().toISOString().replace(/:/g, '_');

var workLogFile = ['logs/', 'worklog-', now, '.log'].join('');

var scanLogFile = ['logs/', 'scan-all-', now, '.log'].join('');

var crypto = require('crypto');

function md5(string){
  return crypto.createHash('md5')
               .update(string)
               .digest('hex');
}


var expected_epochs = [
  "ProfileDateTime",
  "ReleaseDate",
  "DateCreated",
  "FileAccessDate",
  "FileCreateDate",
  "FileModifyDate"
];

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

function es_errors(data, callback){
  var now = new Date().toISOString();
  var log = { time : now, data : data };

  var json = JSON.stringify(log)  + '\n';

  fs.appendFile('logs/es-errors.log', json, function (err, res){
    if (err) console.log('Error reporting error', err);

    callback();
  })


}

function AddToWorklog(data, callback){
  worklog = worklog || workLogFile;
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
  logfile = logfile || scanLogFile;

  if (typeof scanDir !=='string') return console.log('path needs to be string');

  if (!exists(scanDir)) return console.log('Path does not exist', scanDir);

  indexer.scan(scanDir, logfile, function (err, stats){
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
  var workers = config.workers || 4;

  callback = callback || function (){};
  console.log('Starting indexing files with workers', workers , array.length);

  async.forEachLimit(array, workers, function (item, next){
    var file = item.path;
    var parsed = path.parse(file);

    var fileId = u.slug(parsed.name);
    if (isImage(parsed.ext)){


      var archive = getArchivename(file);


      exif.get(file, function (err, metadata){
        if (err) {
          console.log('error getting metadata', file, err);
          return next();
        }

        var obj = metadata.pop();
        var now = new Date().getTime();
        if (obj){
          obj.indexed_epoch = now;
          obj.archive = archive;
          obj.filename = parsed.name;
        }

        indexToElasticsearch(obj, fileId, function (err, resp){
          console.log('Indexed', [archive, parsed.base].join('/'), fileId );
          var now = + new Date();
          AddToWorklog({ file : file, date : now }, next);
        });
      });
    }else{
      next();
    }

  }, function (){
    console.log('Array is done', {
      worklog : workLogFile,
      scanlog : scanLogFile
    });
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

function isNumber(input){
  var numb = parseInt(input);

  if (!isNaN(numb)){
    return numb;
  }

  return false;

}

function enforceEpochs(data){
  expected_epochs.forEach(function (key){

    var value = data[key];
    var numb = isNumber(value);
    if(!numb){
      numb = 0;
      data[key + '-original'] = value;
    }

    data[key] = numb;

  });

  return data;
}

function indexToElasticsearch(data, id,  callback){

  data = deleteNoIndexFields(data);

  data = enforceEpochs(data);
  var body = {
    index: config.index || 'images',
    type: 'image',
    body: data,
    id : id
  };

  client.index(body, function (err, data){
    if (err) {
      console.log(err);
      return  es_errors(body, callback)
    }

    callback(null, data);

  });
}
