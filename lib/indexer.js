'use strict'
var fs = require('fs');
var path = require('path');
var walk = require('walk');
var async = require('async');
var u = require('./utils.js');

var colors = require('colors');

var argv = require('yargs').argv;

var AllFiles = [];
var AllDirectorys = [];
var AllErrors;

function newFile(){
  return _log(arguments, 'yellow');

}
function modifiedFile(){
  return _log(arguments, 'green');

  var arr = [];

  for (var i in arguments){
    arr.push(arguments[i]);
  }
  if (argv.verbose)  console.log(colors.green.apply(this, arr))
}

function _log(args, color){
  var arr = [];

  for (var i in args){
    arr.push(args[i]);
  }

  if (argv.verbose)  console.log(colors[color].apply(this, arr))
}

function StatsTimesToEpoch(object){
  var _object = { };
  for (var key in object){
    var value = object[key];

    if (typeof value === 'function') continue;

    if (value instanceof Date){
      _object[key] = value.getTime();
    }else{
      _object[key] = value;
    }

  }

  return _object;
}

function findFilesInFolder(fileList, folder){
  return fileList.filter(function (item){
    if (item.path.indexOf(folder) > -1){
      return true;
    }
    return false;
  });

}

function findModifiedFilesOrNonExisting(files, dstPath, callback){

  var splitter = dstPath.split(path.sep).pop();

  var modifiedFiles = [];
  var newFiles = [];

  async.forEachLimit(files, 4, function (item, next){
    var dst = item.path.split(splitter).pop();
    dst = path.join(dstPath, dst);

    u.exist(dst, function (err, stats){
      if (err) {
        newFile('New: \t', dst);
        newFiles.push({ path : dst });
        return next();
      }
      // console.log(item.path, dstPath)

      var srcEpocc = item.stats.mtime.getTime();
      var dstEpoch = stats.mtime.getTime();

      if (srcEpocc > dstEpoch){
        modifiedFiles.push({ path : dst });
        modifiedFile('Modified:', dst);
      }

      next();
    })


  }, function (){
    callback(null, {
      newFiles : newFiles,
      modifiedFiles : modifiedFiles
    })

  })


}


var index = {
  compare : function (src, dst, callback){
    var self = this;

    var modifiedFiles = [];
    var newFiles = [];

    self.scan(src, false, function (err, list){
      async.forEachLimit(list.folders, 4, function (item, next){
        var rel = path.relative(src, item.path);

        var dstPath = path.join(dst, rel);

        u.exist(dstPath, function (err, stats){

          var folder = item.path.split(path.sep).pop();

          if (err){
            newFile('Dir does not exists, need to create and full sync', dstPath);
            var files = findFilesInFolder(list.files, folder);
            files.forEach(function (file){
              var _rel = path.relative(src, file.path);
              var filePath = path.join(dstPath, file.stats.name);
              newFiles.push({ path : filePath });
            })
            return next();
          }

          var srcEpoch = item.stats.mtime.getTime();
          var dstEpoch = stats.mtime.getTime();
          var files = findFilesInFolder(list.files, folder);

          findModifiedFilesOrNonExisting(files, dstPath, function (err, resp){
            modifiedFiles = modifiedFiles.concat(resp.modifiedFiles);
            newFiles = newFiles.concat(resp.newFiles);

            next();
          });
        });



      }, function (){
        callback(null, {
          src : src,
          dst : dst,
          newFiles : newFiles,
          modifiedFiles : modifiedFiles
        })
      });


      //console.log(err, list);
    });


  },
  scan : function (dir, logfile, callback){
      var self = this;
      var W = walk.walk(dir);

      W.on('file', function (root, stats, next){

        var filename = path.resolve(root, stats.name);

        var type = 'file';
        var object = {path : filename, stats : stats, type : type};
        AllFiles.push({path : filename, stats : stats});

        var _json = JSON.stringify({
            path : filename,
            type : type,
            stats : StatsTimesToEpoch(stats)
        });

        if (logfile) return  fs.appendFile(logfile, _json + '\n', next);

        next();
      });

      W.on('directory', function (root, stats, next){
        var directory = path.resolve(root, stats.name);

        var type = 'directory';

        var object = {path : directory, stats : stats, type : type};
        AllDirectorys.push({path : directory, stats : stats});

        var _json = JSON.stringify({
            path : directory,
            type : type,
            stats : StatsTimesToEpoch(stats)
        });
        if (logfile) return fs.appendFile(logfile, _json + '\n', next);

        next();
      });


      W.on("errors", function (file, nodeStatsArray, next){
        AllErrors = nodeStatsArray;
        console.log('Error, will continue', file);
        next();
      });

      W.on('end', function (){
        callback(null, {
          files : AllFiles,
          folders : AllDirectorys,
          logfile : logfile
        });
      });


  }
};


module.exports = index;
