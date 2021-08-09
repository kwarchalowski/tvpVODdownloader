const rp = require('request-promise');
const async = require('async');
const $ = require('cheerio');
const dwnldr = require('./cli');


module.exports = {
	parse: async function (wideourl) {
		parse(wideourl);
	},
	vidUrls: [],
}

const vidUrls = [];

// get pages count and return all videos IDs
const parse = async function parse(wideourl) {

	var basePageUrl = wideourl + "?order=oldest&page="
	var pagesCount = 0;
	var vidCount = 0;

	await rp(wideourl)
		.then(async function (html) {
			pagesCount = $('.pagination > li.lastItem > a', html)[0].attribs.href.split('=')[1];

			console.log("Pages count: " + pagesCount);

			// get all video urls
			for (let i = 1; i <= pagesCount; i++) {
				await rp(basePageUrl + i)
					.then(async function (html) {
						vidCount = $('.strefa-abo__item-link', html).length;

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

	//! check if directory exists and/or create it:
	dwnldr.checkDirectory(vidUrls);

	//! try downloading to the created dir:
	try {
		await dwnldr.downloadAll(vidUrls)
			.then(() => {
				console.log("\x1b[34m%s\x1b[0m", "... all should be fine now ...\n\n");
				console.log("\x1b[36m%s\x1b[0m", "/------------------------------------/\n!!  WAIT FOR ALL DOWNLOADS TO FINISH\n/------------------------------------/\n\n");
			})
	} catch (err) {
		console.error(err);
	} finally {
		return 1;
	}
};