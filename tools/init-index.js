
var config = require('../config.js');

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client(config.elasticsearch);

var mappings = require('../lib/mappings.js');

var argv = require('yargs').argv;

var index = argv.i || false;

if (!index || (typeof index !== 'string')){
  return console.log('No index specified, use -i [indexname]')
}



var options = {
  index : index,
  type : 'image',
  body : mappings
};



client.indices.create({
  index: index
}, function (error, response) {
  console.log(error, response);

  if (error) return console.log('CANNOT CREATE INDEX', error);


  client.indices.putMapping(options, function (err, res){
    if (err) return console.log('CANNOT PUT MAPPINGS', err);

    console.log('Alright', res);
  });
  // ...
});
