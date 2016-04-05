
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

function md5(string){
  return crypto.createHash('md5')
               .update(string)
               .digest('hex');
}

var utils = {
  existSync : function (filename){
    try {
      fs.statSync(filename);
      return true;
    } catch (e) {
      return false;
    }
  },
  exist : function (filename, callback){

    fs.stat(filename, callback);
  },

  jsonParse : function (string){
    try {
      return JSON.parse(string);
    } catch (e) {
      return false;
    }
  },

  readLogFileSync: function (filename){

    if (!exists(filename)){
      console.log('File does not exists', filename);
      return false;
    }

    var content = fs.readFileSync(filename).toString('utf8');

    return content.split('\n').map(jsonParse).filter(function (e){return e});

  }
};


module.exports = utils;
