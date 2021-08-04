// TVP VOD DOWNLOADER
// by z0miren, Dec 2020
//---------------------

// TODO: ANY URL FORMAT PARSING


module.exports = {
	checkDirectory: function (videos) {
		checkDirectory(videos);
	},
	downloadAll: function (videos) {
		return downloadAll(videos);
		/* 		return new Promise((resolve, _reject) => {
						downloadAll(videos);
						resolve('Oto prezent!');
				}) */
	},
	doEverything: function () {
		doEverything();
	}
}


const fetch = require("node-fetch");
const fs = require('fs');
// askQuestion (prob. about bitrate)
const prompt = require('prompt-sync')();

const allVids = require('./allVidsIdScraper');
const vodDelayTimeInSecs = 1;
// passedArgs -
// 0 - site URL
// 1 - downloads folder name (dirName) at place
// 2 - batch download (all/none)
var passedArgs = process.argv.slice(2);

// URL to the VOD API, where:
// VIDEO = single video number
// JSONCALLBACK = whatever, just name of the returned JSON structure
const vodAPIurl = 'https://vod.tvp.pl/sess/TVPlayer2/api.php?id=VIDEO&@method=getTvpConfig&@callback=JSONCALLBACK';

var url = passedArgs[0];

// var splitURL = url.split(',');
var videoNum = url.split(',').slice(-1); // get the last part of URL (video number)
var dirName = passedArgs[1];



let urlsList = [];

let redownloading = false;

var APIresponse;

//!  parse URLs
//! ----------------------------------
allVids.parse();
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

	// slice if there's 'video' at the end (entire programme given as input)
	//videoNum[0] = videoNum[0].split('\/').slice(-2)[0];



	//! crucial - video number passed to the API - it's the particular video/series interior number (from URL)
	var vodAPIurlWithVideoNumber = vodAPIurl.replace('VIDEO', videoNum[0]);
	//console.log('API URL: ' + vodAPIurlWithVideoNumber);

	//console.log('Video ID: ' + "\x1b[33m%s\x1b[0m", videoNum[0]);
	//console.log("vodAPIurlWithVideoNumber: " + vodAPIurlWithVideoNumber);

	//console.log("singleVideoURL: " + singleVideoURL);


	fetch(vodAPIurlWithVideoNumber)
		.then(function (response) {

			response.text()
				.then(async function (text) {
					APIresponse = text;
					//console.log(APIresponse.slice(50));
					// try downloading:
					try {

						var vidTitle = escape(APIresponse.match(/"title":.*/)[0].slice(10, -2));  // returning video (program) name
						console.log("Video title: " + "\x1b[33m%s\x1b[0m", vidTitle);

						var vidSubtitle = escape(APIresponse.match(/"subtitle":.*/)[0].slice(13, -2).replace("\\", "")); // returning video (subtitle) name
						console.log("Video subtitle: " + "\x1b[33m%s\x1b[0m", vidSubtitle);

						var vidURLs = APIresponse.match(/"url":.*(mp4|m3u8)/g); // all video URLs
						var vidBitrates = APIresponse.match(/"bitrate":.*/g); // videos bitrates

						//! getting maxBitate video's index from matches
						for (var i = 0; i < vidBitrates.length; i++) {
							vidBitrates[i] = parseInt(vidBitrates[i].slice(11, -1));
						}

						//! getting maximum/minimum bitrate from all URLs
						// change '<' to '>' to get max. bitrate, if '<' left - download the lowest bitrate file
						if (!redownloading) {
							var maxBitrateIndex = vidBitrates.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0); // get highest bitrate video index
						} else {
							var maxBitrateIndex = vidBitrates.reduce((iMax, x, i, arr) => x < arr[iMax + 1] ? i : iMax, 0); // get second highest bitrate video index
						}
						//! getting video URLs
						var vidURLtoDownload = vidURLs[maxBitrateIndex].replace(/\\\//g, "\/").slice(8);

						//console.log("\nDownloading from URL: " + "\x1b[33m%s\x1b[0m", vidURLtoDownload);

						//! Downloading a file (creating/downloading)
						const https = require('https');

						var filename = vidTitle + " - " + vidSubtitle + ".[" + Date.now() + "].mp4";
						console.log("- Created file: " + "\x1b[32m%s\x1b[0m", filename + "\x1b[0m", " in directory " + "\x1b[32m", dirName);
						console.log("\x1b[32m%s\x1b[0m", "-- Downloading file... (bitrate: " + vidBitrates[maxBitrateIndex] + ")");
						const file = fs.createWriteStream(dirName + "/" + filename);
						const request = https.get(vidURLtoDownload, function (response) {
							response.pipe(file);
						});

						request.on('response', function (data) {
							var fileSize = parseFloat(data.headers['content-length'] / 1048576).toFixed(2); // 1048576 = 1024 squared, bytes in 1 Megabyte


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
										console.log("\x1b[34m%s\x1b[0m", filename + " removed!");
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

							console.log('Total filesize: ' + "\x1b[33m%s\x1b[0m", fileSize + " MB");
						});



					} catch (err) {
						// Errors in red...~
						console.log("\x1b[31m%s\x1b[0m", "--- Error as fvk:\n" + err);
					}
				});
		});

	return Promise.resolve(1);
};


//let urlsList = [];
async function downloadAll(videos) {


	console.log("\x1b[32m%s\x1b[0m", '\nSuccesfully got data from TVP API!\n');
	console.log(videos[0]);

	//downloadSingleURL("https://vod.tvp.pl/website/" + videos[0]);


	let firstEpisodeNum = 0;
	let lastEpisodeNum = 0;

	const Queue = require('async-await-queue');
	const queue = new Queue(1, vodDelayTimeInSecs * 1000); // (x, y) - where x = num of parallel downloads, y = time between them
	let p = [];

	//! download particular episodes (X to Y passed as arguments)

	// first episode number
	if (!isNaN(passedArgs[2])) {
		firstEpisodeNum = passedArgs[2];
	} else {
		firstEpisodeNum = 1;
	}

	// last episode number
	if (!isNaN(passedArgs[3])) {
		lastEpisodeNum = passedArgs[3];
		// if given ep number is greater than available
		if (lastEpisodeNum > videos.length) {
			lastEpisodeNum = videos.length;
		}
	} else {
		lastEpisodeNum = videos.length;
	}

	for (let i = firstEpisodeNum - 1; i < lastEpisodeNum; i++) {
		//for (let i = 0; i < videos.length; i++) {

		/* 		try {
					const html = await downloadSingleURL("https://vod.tvp.pl/website/" + videos[i]);
					data[videos[i]] = parse(html);
				} catch (e) {
					console.error(e);
				} */


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

	let delayInSecs = 6;
	//! wait for all Promises from queue returned?
	await Promise.allSettled(p)
		.then(() => {
			//console.log("\x1b[37m%s\x1b[0m", "..... its over dla chlopa .....");
			//! return THIS promise?
			return new Promise((resolve, _reject) => {
				setTimeout(() => {
					console.log("\x1b[36m%s\x1b[0m", ".... i\'ve waited " + delayInSecs + " seconds ....");
					resolve(1);
				}, delayInSecs * 1000); //! 'delayInSecs' seconds after finishing
			});
		})

}

//console.log("done downloading item #" + i);


//downloadSingleURL(dwnldUrl);

//var vidTitle = escape(APIresponse.match(/"title":.*/)[0].slice(10, -2));  // returning video (program) name
//console.log("Video title: " + "\x1b[33m%s\x1b[0m", vidTitle);

//var vidSubtitle = escape(APIresponse.match(/"subtitle":.*/)[0].slice(13, -2).replace("\\", "")); // returning video (subtitle) name
//console.log("Video subtitle: " + "\x1b[33m%s\x1b[0m", vidSubtitle);


//var vidURLs = APIresponse.match(/"url":.*(mp4|m3u8)/g); // all video URLs
//var vidBitrates = APIresponse.match(/"bitrate":.*/g); // videos bitrates


/* 	//! getting maxBitate video's index from matches
	//console.log("Available bitrates:\n");
	for (var i = 0; i < vidBitrates.length; i++) {
		vidBitrates[i] = parseInt(vidBitrates[i].slice(11, -1));
		//console.log(i+1 + " - " + vidBitrates[i]);
	} */

// ask for bitrate:
//const chosenBitrate = prompt('Choose bitrate number (1-' + vidBitrates.length + '): ');


//! getting maximum bitrate from all URLs
//console.log(vidBitrates);

// change '<' to '>' to get max. bitrate, if '<' left - download the lowest bitrate file

//var maxBitrateIndex = vidBitrates.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0); // get highest bitrate video index

//console.log("Max bitrate index: " + maxBitrateIndex);


/* 	//! getting video URLs
	//console.log("Matches count: " + vidURLs.length);
	var vidURLtoDownload = vidURLs[maxBitrateIndex].replace(/\\\//g, "\/").slice(8);
	//console.log(vidURLs[vidURLs.length - 1].replace(/\\\//g, "\\"));
	console.log("\nDownloading from URL: " + "\x1b[33m%s\x1b[0m", vidURLtoDownload); */
//console.log(vidURLs);

//console.log("Downloading file...");


/* 	//! Downloading a file (creating/downloading)
	const https = require('https');
	
	//console.log("Creating file...");
	var filename = vidTitle + " - " + vidSubtitle + ".[" + Date.now() + "].mp4";
	console.log("- Created file: " + "\x1b[32m%s\x1b[0m", filename + "\x1b[0m", " in directory " + "\x1b[32m", dirName);
	console.log("\x1b[32m%s\x1b[0m", "-- Downloading file... (bitrate: " + vidBitrates[maxBitrateIndex] + ")");
	const file = fs.createWriteStream(dirName + "/" + filename);
	const request = https.get(vidURLtoDownload, function (response) {
		response.pipe(file);
	});
	
	
	
	//var fileSize = 0;
	request.on('response', function (data) {
		var fileSize = parseFloat(data.headers['content-length'] / 1048576).toFixed(2); // 1048576 = 1024 squared, bytes in 1 Megabyte
		console.log('Total filesize: ' + "\x1b[33m%s\x1b[0m", fileSize + " MB");
	}); */



/* var downloadedSize;
request.on('data', function (chunk) {
	downloadedSize += chunk.length;
	console.log('Downloaded ' + (downloadedSize / fileSize.toFixed(2) + ' out of ' + fileSize + " MB"));
}); */


/* 		// ! that doesn't work ffs
		// TODO: FIX THAAAAAAAAT
		request.on('end', function () {
			console.out("\x1b[32m%s\x1b[0m", 'Downloading finished!');
		}); */

// downloading...
//console.log(APIresponse);



//check if directory exists, create one if not
function checkDirectory(_videos) {
	/* 	console.log("[inside checkDirectory():\n");
		console.log("--- videos.length: " + videos.length); */
	const dir = './' + dirName;

	if (fs.existsSync(dirName)) {
		console.log('\nDirectory ' + dirName + ' exists!');
		// download to the dir
	} else {
		console.log('\nDirectory ' + dirName + ' does not exist!');
		fs.mkdirSync(dirName, 0744);
		console.log('\nCreated directory ./' + dirName);
		// download to the dir
	}
	/* 
		console.log("end of checkDirectory()]") */
}



function onErr(err) {
	console.log(err);
	return 1;
}
