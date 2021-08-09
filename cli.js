// TVP VOD DOWNLOADER
// Karol Warchalowski, Dec 2020 --> Aug 2021
//---------------------

module.exports = {
	checkDirectory: function (videos) {
		checkDirectory(videos);
	},
	downloadAll: function (videos) {
		return downloadAll(videos);
	}
}

const fetch = require("node-fetch");
const fs = require('fs');
const allVids = require('./allVidsIdScraper');
const vodDelayTimeInSecs = 3;

// URL to the VOD API, where:
// VIDEO = single video number
// JSONCALLBACK = whatever, just name of the returned JSON structure
const vodAPIurl = 'https://vod.tvp.pl/sess/TVPlayer2/api.php?id=VIDEO&@method=getTvpConfig&@callback=JSONCALLBACK';

// passedArgs -
// 0 - site URL
// 1 - downloads folder name (dirName) at place
// 2 - batch download (all/none)
let passedArgs = process.argv.slice(2);

let url = passedArgs[0];
let videoNum = url.split(',').slice(-1); // get the last part of URL (video number)
let dirName = passedArgs[1];
let redownloading = false; // initial re-downloading state is false (assumption that everything works)
let APIresponse;
let chosenBitrate = "min";

//!  parse URLs
//! ----------------------------------
console.log("\x1b[33m%s\x1b[0m", "\n\n-- PASSED ARGS --");
console.log("URL: " + "\x1b[33m%s\x1b[0m", url);
console.log("dir: ./" + "\x1b[33m%s\x1b[0m", dirName);
passedArgs[2] ? console.log("bitrate: " + "\x1b[33m%s\x1b[0m", chosenBitrate = passedArgs[2]) : console.log("\x1b[33m%s\x1b[0m", "-- no bitrate chosen, downloading with the lowest one --"); // min/max
passedArgs[3] ? console.log("first ep: " + "\x1b[33m%s\x1b[0m", passedArgs[3]) : null;
passedArgs[4] ? console.log("last ep: " + "\x1b[33m%s\x1b[0m", passedArgs[4]) : null;

console.log("\x1b[33m%s\x1b[0m", "-- -- -- -- --\n\n");

allVids.parse(url);
//! ----------------------------------

async function downloadSingleURL(singleVideoURL) {

	console.log('\nPreparing URL...');
	url = singleVideoURL;
	videoNum = url.split(',');
	//videoNum = url.split(',').slice(-1);

	//! husk video ID from given URL
	for (let i = 0; i < videoNum.length; i++) {

		//! parse URL slices to Int
		videoNum[i] = parseInt(videoNum[i]);

		//! get only video ID from URL and set it on first place (videoNum[0])
		if (!isNaN(videoNum[i])) {
			videoNum[0] = videoNum[i];
		}
	}

	//! crucial - video number passed to the API - it's the particular video/series interior number (from URL)
	let vodAPIurlWithVideoNumber = vodAPIurl.replace('VIDEO', videoNum[0]);
	let maxBitrateIndex;

	fetch(vodAPIurlWithVideoNumber)
		.then(function (response) {

			response.text()
				.then(async function (text) {
					APIresponse = text;

					// try downloading:
					try {

						let vidTitle = escape(APIresponse.match(/"title":.*/)[0].slice(10, -2));  // returning video (program) name
						console.log("Video title: " + "\x1b[33m%s\x1b[0m", vidTitle);

						let vidSubtitle = escape(APIresponse.match(/"subtitle":.*/)[0].slice(13, -2).replace("\\", "")); // returning video (subtitle) name
						console.log("Video subtitle: " + "\x1b[33m%s\x1b[0m", vidSubtitle);

						let vidURLs = APIresponse.match(/"url":.*(mp4|m3u8)/g); // all video URLs
						let vidBitrates = APIresponse.match(/"bitrate":.*/g); // videos bitrates

						//! getting maxBitate video's index from matches
						for (let i = 0; i < vidBitrates.length; i++) {
							vidBitrates[i] = parseInt(vidBitrates[i].slice(11, -1));
						}

						//! getting maximum/minimum bitrate from all URLs
						//! change '<' to '>' to get max. bitrate, if '<' left - download the lowest bitrate file

						if (chosenBitrate == "min") {
							if (!redownloading) {
								maxBitrateIndex = vidBitrates.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0); // get highest bitrate video index
							} else {
								maxBitrateIndex = vidBitrates.reduce((iMax, x, i, arr) => x < arr[iMax + 1] ? i : iMax, 0); // get second highest bitrate video index
							}
						} else if (chosenBitrate == "max") {
							if (!redownloading) {
								maxBitrateIndex = vidBitrates.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0); // get highest bitrate video index
							} else {
								maxBitrateIndex = vidBitrates.reduce((iMax, x, i, arr) => x > arr[iMax + 1] ? i : iMax, 0); // get second highest bitrate video index
							}
						}


						//! getting video URLs
						let vidURLtoDownload = vidURLs[maxBitrateIndex].replace(/\\\//g, "\/").slice(8);

						//! Downloading a file (creating/downloading)
						const https = require('https');

						let filename = vidTitle + " - " + vidSubtitle + ".[" + Date.now() + "].mp4";
						console.log("- Created file: " + "\x1b[32m%s\x1b[0m", filename + "\x1b[0m", " in directory " + "\x1b[32m", dirName);
						console.log("\x1b[32m%s\x1b[0m", "-- Downloading file... (bitrate: " + vidBitrates[maxBitrateIndex] + ")");
						const file = fs.createWriteStream(dirName + "/" + filename);
						const request = https.get(vidURLtoDownload, function (response) {
							response.pipe(file);
						});

						request.on('response', function (data) {

							// get filesize:
							let fileSize = parseFloat(data.headers['content-length'] / 1048576).toFixed(2); // 1048576 = 1024 squared, bytes in 1 Megabyte

							// print fileSize if different to 0 MB:
							(fileSize != 0) ? console.log('Total filesize: ' + "\x1b[33m%s\x1b[0m", fileSize + " MB") : null;

							//! redownloading?
							if (fileSize == 0) {
								console.error("\x1b[31m%s\x1b[0m", "-- Filesize of this file is 0 MB, something went wrong, re-downloading!");
								redownloading = true;

								//! removing old file:
								fs.unlink(dirName + "/" + filename, function (err) {
									if (err && err.code == 'ENOENT') {
										// file doens't exist
										console.info("\x1b[31m%s\x1b[0m", "File doesn't exist, won't remove it.");
									} else if (err) {
										// other errors, e.g. maybe we don't have enough permission
										console.error("\x1b[31m%s\x1b[0m", "Error occurred while trying to remove file");
									} else {
										console.log("\x1b[34m%s\x1b[0m", filename + " removed!"); // feedback that broken file was removed
									}
								});

								//! redownloading:
								try {
									setTimeout(() => {
										downloadSingleURL(url);
									}, 1000); //! try re-downloading in 1 sec intervals

								} catch (e) {
									console.error(e);
								}
							} else {
								redownloading = false;
							}
						});



					} catch (err) {
						// Errors in red...~
						console.log("\x1b[31m%s\x1b[0m", "--- Error as fvk:\n" + err);
					}
				});
		});

	return Promise.resolve(1);
};

async function downloadAll(videos) {

	let parallelDownloads = 2;

	//console.log("\x1b[32m%s\x1b[0m", '\nSuccesfully got data from TVP API!\n');

	let firstEpisodeNum = 0;
	let lastEpisodeNum = 0;

	//! queue consts and other variables to handle downloading queue
	const Queue = require('async-await-queue');
	const queue = new Queue(parallelDownloads, vodDelayTimeInSecs * 1000); // (x, y) - where x = num of parallel downloads, y = time between them
	let p = [];

	//! download particular episodes (X to Y passed as arguments) --
	// first episode number
	if (!isNaN(passedArgs[3])) {
		firstEpisodeNum = passedArgs[3];
	} else {
		firstEpisodeNum = 1;
	}

	// last episode number
	if (!isNaN(passedArgs[4])) {
		lastEpisodeNum = passedArgs[4];
		// if given ep number is greater than available
		if (lastEpisodeNum > videos.length) {
			lastEpisodeNum = videos.length;
		}
	} else {
		lastEpisodeNum = videos.length;
	}
	//! --

	//! go through all episodes user wants to download and try to download them:
	for (let i = firstEpisodeNum - 1; i < lastEpisodeNum; i++) {

		/* Generate a queue ID */
		const me = Symbol();
		/* 0 is the priority, -1 is higher priority than 0 */
		p.push(queue.wait(me, 0)
			.then(async function (xd) {
				await downloadSingleURL("https://vod.tvp.pl/website/" + videos[i])
				console.log("\x1b[35m%s\x1b[0m", '... downloading (there\'s ' + vodDelayTimeInSecs + ' seconds between download requests):');
			})
			.catch((e) => console.error(e))
			/* don't forget this or you will end up freezing */
			.finally(() => {
				queue.end(me);
			})

		)
	};

	// wait at the end for delayInSecs seconds:
	let delayInSecs = 8;

	//! wait for all Promises from queue returned?
	await Promise.allSettled(p)
		.then(() => {
			//! return THIS promise?
			return new Promise((resolve, _reject) => {
				setTimeout(() => {
					console.log("\x1b[36m%s\x1b[0m", ".... i\'ve waited for " + delayInSecs + " seconds ....");
					resolve(1);
				}, delayInSecs * 1000); //! 'delayInSecs' seconds after finishing
			});
		})

}

//check if directory exists, create one if not
function checkDirectory(_videos) {

	if (fs.existsSync(dirName)) {
		console.log('\nDirectory ' + dirName + ' exists!');
		// ---> download to the dir
	} else {
		console.log('\nDirectory ' + dirName + ' does not exist!');
		fs.mkdirSync(dirName, 0744);
		console.log('\nCreated directory ./' + dirName);
		// ---> download to the dir
	}

}
