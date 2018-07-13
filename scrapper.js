var request = require('request');
var Promise = require('bluebird');
var getPromisify = Promise.promisify(request.get);
var htmlparser = require("htmlparser2");
var fs = require('fs');
var _ = require('lodash')
var csv = require("fast-csv");
var readline = require('readline');

var maxAllowedConnections = 5;

module.exports = {

  fetchData : function(url){
    return getPromisify(url).then((url_res) => {
      var all_urls = []
      var body = url_res.body;
      console.log(url)
      console.log('========')
      var parser = new htmlparser.Parser({
        onopentag: function(name, attribs){
          if(name === "a" && attribs.href){
            if(attribs.href.indexOf('medium.com') >= 0){
              all_urls.push(attribs.href)
            }
          }
        }
      }, {decodeEntities: true});
      parser.write(body);
      parser.end()
      var all_urls = _.uniq(all_urls);
      console.log(all_urls)
      all_urls.forEach(function(url){
        module.exports.readFile('test.csv', url).then((file_url_present) => {
          if(file_url_present){
          }else{
            fs.appendFile('test.csv', url+'\n', function(err) {
              if(err) {
                return console.log(err);
              }
            })
          }
        })
      })
      //awaits for returned promises
      return Promise.map(all_urls, module.exports.fetchData, { concurrency: maxAllowedConnections })
      .then((final_results) => {
        var data = {};
        for (var i = 0; i < final_results.length; i++)
           data[all_urls[i]] = final_results[i];
        
        return data;
      });
    })

  },

  readFile : function (file, url) {
    return new Promise(function (resolve, reject) {
        var lines = [];
        var rl    = readline.createInterface({
            input: fs.createReadStream(file)
        });

        rl.on('line', function (line) {
          lines.push(line)
        });

        rl.on('close', function () {
          if(lines.indexOf(url) > 0){
            resolve(true)
          }else{
            resolve(false)
          }
        });
    });
  }

}


module.exports.fetchData('https://medium.com').then((success) => {
  console.log(success)
  process.exit(1);  
})
