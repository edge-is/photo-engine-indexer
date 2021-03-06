'use strict'
var fs = require('fs');
var path = require('path');
var walk = require('walk');
var async = require('async');
var u = require('./utils.js');
var pace = require('pace');
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

function replaceExt(filePath, fileType){

  var parts = filePath.split('.');

  parts[ parts.length - 1 ]=fileType;

  return parts.join('.');

}

function findModifiedFilesOrNonExisting(files, dstPath, fileType, callback){

  var splitter = dstPath.split(path.sep).pop();

  var modifiedFiles = [];
  var newFiles = [];

  async.forEachLimit(files, 4, function (item, next){


    var dst = item.path.split(splitter).pop();
    dst = path.join(dstPath, dst);

    dst = replaceExt(dst, fileType);

    u.exist(dst, function (err, stats){
      if (err) {
        newFile('New: \t', item.path);
        newFiles.push({ path : item.path });
        return next();
      }
      // console.log(item.path, dstPath)

      var srcEpocc = item.stats.mtime.getTime();
      var dstEpoch = stats.mtime.getTime();

      if (srcEpocc > dstEpoch){
        modifiedFiles.push({ path : item.path });
        modifiedFile('Modified:', item.path);
      }
      next();
    });


  }, function (){
    callback(null, {
      newFiles : newFiles,
      modifiedFiles : modifiedFiles
    });

  });
}


var index = {
  compareThumbs : function (src, dst, options, callback){
    var self = this;

    var fileType = options.fileType || 'jpg';
    var modifiedFiles = [];
    var newFiles = [];

    // console.log('Building source file list')
    self.scan(src, false, function (err, list){
      var _p = pace(list.files.length);
      // console.log('source done, comparing')
      async.forEachLimit(list.files, 1, function (item, next){


        var parts = item.path.split(path.sep);
        var filename = parts.pop();

        var ext = filename.split('.');
            ext  = ext.pop();

        if (!u.isImage(ext)){
           _p.op();
          return next();
        }

        var location = u.thumbLocation(filename);

        var dstPath = path.join(dst, location);

        u.exist(dstPath, function (err, status){
          if(err){
            newFiles.push(item.path);
            newFile('New: \t', dst);

          }
          _p.op();
          next();
          //
          // modifiedFile('Modified:', dst);
          // console.log(err, status);
        });
        //next();

      }, function (){
        callback(null, {
          src : src,
          dst : dst,
          newFiles : newFiles //,
          // modifiedFiles : modifiedFiles
        })
      });
    });



  },
  compare : function (src, dst, options, callback){
    var self = this;

    var modifiedFiles = [];
    var newFiles = [];

    var fileType = options.fileType || 'jpg';
    // console.log('Building source file list')

    self.scan(src, false, function (err, list){
      var _p = pace(list.files.length);

      // console.log('source done, comparing folder timestamps');
      async.forEachLimit(list.folders, 4, function (item, next){

        var folder = item.path.split(path.sep).pop();


        var files = findFilesInFolder(list.files, folder);

        //console.log(files.length);
        //console.log('comparing', folder, files.length);


        var rel = path.relative(src, item.path);

        var dstPath = path.join(dst, rel);

        u.exist(dstPath, function (err, stats){
          if (err){
            newFile('Dir does not exists, need to create and full sync', dstPath);
            files.forEach(function (file){
              newFiles.push({ path : file.path });
              _p.op();
            });
            //_p.op(files.length);
            return next();
          }

          var srcEpoch = item.stats.mtime.getTime();
          var dstEpoch = stats.mtime.getTime();

          findModifiedFilesOrNonExisting(files, dstPath, fileType, function (err, resp){
            modifiedFiles = modifiedFiles.concat(resp.modifiedFiles);
            newFiles = newFiles.concat(resp.newFiles);

            var len = modifiedFiles.length + newFiles.length;

            for (var i = 0; i < files.length; i++ ){
              _p.op();
            }

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

      W.on('nodeError', function (err, stats, next){
        console.log('nodeError', err);

        return next();
      });

      W.on('directoryError', function (err, stats, next){
        console.log('directoryError', err);

        return next();
      });

      W.on("errors", function (file, nodeStatsArray, next){
        AllErrors = nodeStatsArray;
        console.log('Error, will continue', file);
        next();
      });

      W.on('end', function (){
        console.log('end for scanning');
        callback(null, {
          files : AllFiles,
          folders : AllDirectorys,
          logfile : logfile
        });
      });


  }
};


module.exports = index;
