const rp = require('request-promise');
const async = require('async');
const $ = require('cheerio');
const dwnldr = require('./tvpdown');


module.exports = {
	parse: async function () {
		parse();
	},
	vidUrls: [],
}


//const url = 'https://vod.tvp.pl/website/ojciec-mateusz,1667840/video';
let url = 'https://vod.tvp.pl/website/pucul-i-grzechu,252375/video';
const vidUrls = [];

var basePageUrl = url + "?order=oldest&page="
var pagesCount = 0;
var vidCount = 0;

var passedArgs = process.argv.slice(2);
let dwnldUrl = passedArgs[0];
let singleVideoURL = "";

// get pages count and return all videos IDs
const parse = async _ => {
	//url = singleVideoURL;
	await rp(url)
		.then(async function (html) {

			//success!
			pagesCount = $('.pagination > li.lastItem > a', html)[0].attribs.href.split('=')[1];
			//console.log($('.pagination > li.lastItem > a', html)[0].attribs.href.split('=')[1]);
			//for (let i = 0; i < 50; i++) {
			//   vidUrls.push($('.strefa-abo__item-link', html)[i].attribs.href);
			//}
			console.log("Pages count: " + pagesCount);

			// get all video urls
			for (let i = 1; i <= pagesCount; i++) {
				await rp(basePageUrl + i)
					.then(async function (html) {


						//success!
						vidCount = $('.strefa-abo__item-link', html).length;
						//console.log($('.pagination > li.lastItem > a', html)[0].attribs.href.split('=')[1]);
						for (let i = 0; i < vidCount; i++) {
							vidUrls.push($('.strefa-abo__item-link', html)[i].attribs.href.substring(7));
						}
						console.log("Vids on page " + i + ": " + vidCount);
					})
					.catch(function (err) {
						console.error(err);
					});

			}

		})
		.catch(function (err) {
			console.error(err);
		});
	console.log("All videos count: " + vidUrls.length);
	//console.log(vidUrls);


	dwnldr.checkDirectory(vidUrls);
	dwnldr.downloadAll(vidUrls);

	//return 1;
	return vidUrls;
};


//parse();



 	   //vidUrls.push($('.strefa-abo__item-link', html)[i].attribs.href);

 //console.log("All videos count: " + vidUrls.length);
//console.log(vidUrls);

