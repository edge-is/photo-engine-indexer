
var config = require('../config.js');

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client(config.elasticsearch);

var mappings = require('../lib/mappings.js');

var argv = require('yargs').argv;

var index = argv.i || false;
var force = argv.f || false;

if (!index || (typeof index !== 'string')){
  return console.log('No index specified, use -i [indexname]')
}



var options = {
  index : index,
  type : 'image',
  body : mappings
};


function indexExists(index, callback){
  client.indices.get({ index : index}, function (err, res){
    if (err) return callback(null, res);

    callback('Index does exists', res);
  })
}

indexExists(index, function (err, res){
  if (err){
    console.log('Index exists', index);

    if (!force) return console.log('Use -f to force (it will delete the index)');

    return client.indices.delete({index : index}, function (err, res){
      if (err) return console.log('Error deleteing index', index, err);
      initIndex(index);
    });

  }

  initIndex(index);

});

function initIndex(index){
  client.indices.create({
    index: index
  }, function (error, response) {

    if (error) return console.log('CANNOT CREATE INDEX', error);

    client.indices.putMapping(options, function (err, res){
      if (err) return console.log('CANNOT PUT MAPPINGS', err);

      console.log('Success!', res);
    });
    // ...
  });
}
