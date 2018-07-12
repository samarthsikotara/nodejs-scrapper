var request = require('request');
var Promise = require('bluebird');
var getPromisify = Promise.promisify(request.get);
var htmlparser = require("htmlparser2");
var fs = require('fs');

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
							fs.appendFile('test.txt', attribs.href+'\n', function(err) {
								if(err) {
						      return console.log(err);
						    }
						  })
							console.log("Url!========> "+attribs.href);
						}
					}
				}
			}, {decodeEntities: true});
			parser.write(body);
			parser.end()
			console.log(all_urls)

			//awaits for returned promises
			return Promise.map(all_urls, module.exports.fetchData, { concurrency: maxAllowedConnections })
      .then((final_results) => {
	var data = {};
	for (var i = 0; i < final_results.length; i++)
	   data[all_urls[i]] = final_results[i];
	
	return data;
      });
		})

	}
}

module.exports.fetchData('https://medium.com').then((success) => {
	console.log(success)
	process.exit(1);	
})
