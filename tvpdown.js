// TVP VOD DOWNLOADER
// by z0miren, Dec 2020
//---------------------

const fetch = require("node-fetch");

// askQuestion (prob. about bitrate)
const prompt = require('prompt-sync')();

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

//check if directory exists, create one if not
const fs = require('fs');
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

console.log('\nPreparing URL...');
var downloadURL = vodAPIurl.replace('VIDEO', videoNum[0]);
//console.log('API URL: ' + downloadURL);
console.log('Video ID: ', videoNum[0]);

var APIresponse;

fetch(downloadURL)
  .then(function(response) {
    response.text().then(function(text) {
      APIresponse = text;
      done();
    });
  });

function done() {
	console.log('\nGot data from API!');
	var vidTitle = escape(APIresponse.match(/"title":.*/)[0].slice(10, -2)); // returning video (program) name
	console.log("Video title: " + vidTitle);
	var vidSubtitle = escape(APIresponse.match(/"subtitle":.*/)[0].slice(13, -2).replace("\\", "")); // returning video (subtitle) name
	console.log("Video subtitle: " + vidSubtitle);

	var vidURLs = APIresponse.match(/"url":.*(mp4|m3u8)/g); // all video URLs
	var vidBitrates = APIresponse.match(/"bitrate":.*/g); // videos bitrates


	// getting maxBitate video's index from matches
	//console.log("Available bitrates:\n");
	for (var i=0; i<vidBitrates.length; i++) {
		vidBitrates[i] = parseInt(vidBitrates[i].slice(11, -1));
		//console.log(i+1 + " - " + vidBitrates[i]);
	}

		
	// ask for bitrate:
	//const chosenBitrate = prompt('Choose bitrate number (1-' + vidBitrates.length + '): ');


	// getting maximum bitrate from all URLs
	//console.log(vidBitrates);
	// change '<' to '>' to get max. bitrate, if '<' left - download the lowest bitrate file
	var maxBitrateIndex = vidBitrates.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0); // get highest bitrate video index
	//console.log("Max bitrate index: " + maxBitrateIndex);


	// getting video URLs
	//console.log("Matches count: " + vidURLs.length);
	var vidURLtoDownload = vidURLs[maxBitrateIndex].replace(/\\\//g, "\/").slice(8);
	//console.log(vidURLs[vidURLs.length - 1].replace(/\\\//g, "\\"));
	console.log("\nDownloading from URL: " + vidURLtoDownload);
	//console.log(vidURLs);

	//console.log("Downloading file...");


	// Downloading a file (creating/downloading)
	const https = require('https');
	//console.log("Creating file...");
	var filename = vidTitle + " - " + vidSubtitle + ".[" + Date.now() + "].mp4";
	console.log("- Created file: " + filename + " in directory " + dirName + ".");
	console.log("-- Downloading file... (bitrate: "+vidBitrates[maxBitrateIndex]+")");
	const file = fs.createWriteStream(dirName + "/" + filename);
	const request = https.get(vidURLtoDownload, function(response) {
  		response.pipe(file);
  		
	});
	// downloading...
  //console.log(APIresponse);

}

function onErr(err) {
    console.log(err);
    return 1;
}
