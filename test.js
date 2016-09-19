/* Tests for helper functions in convert.js */
var convert = require('./convert.js');
var fs = require('fs');

/* 1.	Test that empty, header only, and complete CSV return at least timestamp as first element */
var files = ['testEmpty.csv', 'testHeader.csv', 'testComplete.csv'];

/* Read in files and detect timestamp */
files.forEach((file) => {
	fs.readFile('./testFiles/' + file, 'utf8', (err, data) => {
		var result = convert.csvToObjectArray(data, "scheduledtime");
		if (!("timestamp" in result[0])) {
			throw "No timestamp found";
		}
	});
});


/* 2.	Test the times outputted by makeHumanReadable; 1 day with 30 minute intervals between hours (GMT) */
var inputTimes = [1474156800];

var i = 1;
while (i < 48) {
	inputTimes.push(inputTimes[0] + (i * 1800));
	i++;
}

/* Values the makeHumanReadable should output given inputTimes */
var outputTimes = ["8:00 PM 9-17-2016", "8:30 PM 9-17-2016", "9:00 PM 9-17-2016", "9:30 PM 9-17-2016", "10:00 PM 9-17-2016", "10:30 PM 9-17-2016", "11:00 PM 9-17-2016", "11:30 PM 9-17-2016", "12:00 AM 9-18-2016", "12:30 AM 9-18-2016", "1:00 AM 9-18-2016", "1:30 AM 9-18-2016", "2:00 AM 9-18-2016", "2:30 AM 9-18-2016", "3:00 AM 9-18-2016", "3:30 AM 9-18-2016", "4:00 AM 9-18-2016", "4:30 AM 9-18-2016", "5:00 AM 9-18-2016", "5:30 AM 9-18-2016", "6:00 AM 9-18-2016", "6:30 AM 9-18-2016", "7:00 AM 9-18-2016", "7:30 AM 9-18-2016", "8:00 AM 9-18-2016", "8:30 AM 9-18-2016", "9:00 AM 9-18-2016", "9:30 AM 9-18-2016", "10:00 AM 9-18-2016", "10:30 AM 9-18-2016", "11:00 AM 9-18-2016", "11:30 AM 9-18-2016", "12:00 PM 9-18-2016", "12:30 PM 9-18-2016", "1:00 PM 9-18-2016", "1:30 PM 9-18-2016", "2:00 PM 9-18-2016", "2:30 PM 9-18-2016", "3:00 PM 9-18-2016", "3:30 PM 9-18-2016", "4:00 PM 9-18-2016", "4:30 PM 9-18-2016", "5:00 PM 9-18-2016", "5:30 PM 9-18-2016", "6:00 PM 9-18-2016", "6:30 PM 9-18-2016", "7:00 PM 9-18-2016", "7:30 PM 9-18-2016"];

/* Check that values match */
inputTimes.forEach((timestamp, i) => {
	var convertedTime = convert.makeHumanReadable(timestamp, 0);
	if (convertedTime !== outputTimes[i]) {
		console.log(`${convertedTime} to ${outputTimes[i]}`);
		throw "Timestamps did not match";
	}
});

console.log("Tests passed!");