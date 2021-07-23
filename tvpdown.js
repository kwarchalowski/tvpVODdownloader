// TVP VOD DOWNLOADER
// by z0miren, Dec 2020
//---------------------
let dwnldUrl = "https://vod.tvp.pl/website/trzynascie-lat,36193160/video";

module.exports = {
	checkDirectory: function (videos) {
		checkDirectory(videos);
	},
	downloadAll: function (videos) {
		downloadAll(videos);
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



var APIresponse;

//!  parse URLs
allVids.parse();


//! main function that creates directory etc.

async function downloadSingleURL(singleVideoURL) {


	console.log('\nPreparing URL...');
	url = singleVideoURL;
	videoNum = url.split(',').slice(-1);

	// slice if there's 'video' at the end (entire programme given as input)
	videoNum[0] = videoNum[0].split('\/').slice(-2)[0];

	var vodAPIurlWithVideoNumber = vodAPIurl.replace('VIDEO', videoNum[0]);
	//console.log('API URL: ' + vodAPIurlWithVideoNumber);
	console.log('Video ID: ' + "\x1b[33m%s\x1b[0m", videoNum[0]);
	console.log("vodAPIurlWithVideoNumber: " + vodAPIurlWithVideoNumber);

	console.log("singleVideoURL: " + singleVideoURL);


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
							var maxBitrateIndex = vidBitrates.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0); // get highest bitrate video index

							//! getting video URLs
							var vidURLtoDownload = vidURLs[maxBitrateIndex].replace(/\\\//g, "\/").slice(8);
							console.log("\nDownloading from URL: " + "\x1b[33m%s\x1b[0m", vidURLtoDownload);

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
								console.log('Total filesize: ' + "\x1b[33m%s\x1b[0m", fileSize + " MB");
							});



						} catch (err) {
							// Errors in red...~
							console.log("\x1b[31m%s\x1b[0m", "--- Error as fvk:\n" + err);
						}
				});
		});
};


//let urlsList = [];
function downloadAll(videos) {

	// TODO: it's BROKEN HEREEEEEEEEEEEEEEEEEE
	//[urlsList] = await allVids.parse();
	//let urlsList = allVids.parse();



	//	urlsList = result;
	//console.log('Urls list: ' + urlsList);
	//console.log(videos);
	console.log("\x1b[32m%s\x1b[0m", '\nSuccesfully got data from TVP API!\n');
	console.log(videos[0]);

	//downloadSingleURL("https://vod.tvp.pl/website/" + videos[0]);

	for (let i = 0; i < videos.length; i++) {

		downloadSingleURL("https://vod.tvp.pl/website/" + videos[i]);
		console.log("done downloading item #" + i);

	}

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

}

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
