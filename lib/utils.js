
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

function md5(string){
  return crypto.createHash('md5')
               .update(string)
               .digest('hex');
}



var slug = require('slug');

slug.defaults.modes['pretty'] = {
    replacement: '-',
    symbols: true,
    remove: /[.]/g,
    lower: true,
    charmap: slug.charmap,
    multicharmap: slug.multicharmap
};
var utils = {
  existSync : function (filename){
    try {
      fs.statSync(filename);
      return true;
    } catch (e) {
      return false;
    }
  },
  slug : function (string){
    return slug(string);
  },
  exist : function (filename, callback){

    fs.stat(filename, callback);
  },
  isImage : function (extension){
    if (extension.charAt(0) !== '.'){
      extension = '.' + extension;
    }

    var extensions = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp'];

    if (extensions.indexOf(extension) > -1){
      return true;
    }

    return false;

  },
  thumbLocation : function(filename){

    var parts = filename.split('.');

    var filenameToHash = parts.shift();

    var hash = md5(filenameToHash);

    var arr = hash.split('');

    var l1 = arr.pop();
    var l2 = arr.slice(arr.length -2, arr.length).join('');

    var location = [l1,l2, filename].join(path.sep);

    return location;

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
