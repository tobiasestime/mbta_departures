/*
Functions for converting CSV into an array of objects with data type formatting
*/

/* Remove white space, parse numbers from string values from CSV */
function _parseCsvStrings(arrayIn) {
	var map = Array.prototype.map;
	return map.call(arrayIn, (x) => {
		/* Remove any white space from values */
		x = x.trim();
		/* Convert strings to numbers when only containing digits */
		return x.match(/[^0-9]/g) === null ? Number(x) : x;
	});
}

/* Return a simplfied status for styling classes (app-specific) */
function _getStatus(status) {
	var statusOptions = [ "normal", "good", "imminent", "alert", "bad", "worse", "departed", "unknown" ];
	var selections = {
		OnTime: statusOptions[0],
		Arriving: statusOptions[1],
		Arrived: statusOptions[1],
		NowBoarding: statusOptions[2],
		AllAboard:statusOptions[3],
		Delayed: statusOptions[4],
		Late: statusOptions[4],
		Hold: statusOptions[4],
		Cancelled: statusOptions[5],
		End: statusOptions[5],
		Departed: statusOptions[6],
		Infotofollow: statusOptions[7],
		TBD: statusOptions[7]
	};
	
	/* If a simplified status is found for the status provided, return it; otherwise return "unknown" */
	return (Object.keys(selections).indexOf(status) > -1) ? selections[status] : statusOptions[7];
}

/* Expose the csvToObjectArray to the program importing this file */
module.exports = {
	/* Convert timestamp to human readable time */
	makeHumanReadable: function(timestamp, offset) {
		/* Second to milliseconds*/
		var dateTime = new Date((timestamp + offset) * 1000);
		/* Format minutes portion */
		var minutes = dateTime.getMinutes();
			minutes = minutes < 10 ? "0" + minutes : minutes;
		/* Convert 24-hour to AM/PM */
		var timePart = dateTime.getHours();
		var hourPart = (timePart % 12) === 0 ? 12 : (timePart % 12);
			timePart = timePart >= 12 ? hourPart + ":" + minutes + " PM" : hourPart + ":" + minutes + " AM";
		var datePart = (dateTime.getMonth() + 1) + "-" + dateTime.getDate() + "-" + (dateTime.getYear() + 1900);
		
		return timePart + " " + datePart;
	},
	/* Convert CSV rows to array of objects */
	csvToObjectArray: function (csv, sortOn) {
		/*
		Replace empty cells with TBD (app-specific) and remove text quotation marks
		Quotation mark removal is done blindly since we don't expect commas in strings for this app
		*/
		var csvArray = csv.replace(/, *,/g, ",TBD,").replace(/['"]/g, "").split("\n"),
		/* Spearate keys (header row) into own array */
			keys = _parseCsvStrings(csvArray[0].toLowerCase().split(","));
		/* Remove header row from rest of CSV */
		csvArray.shift();
		/* Discard last line of CSV if empty */
		if (csvArray[csvArray.length - 1] === "")
			csvArray.pop();

		/* Array of objects to be populated and returned */
		var objectArray = [];

		/* "Zip" keys and values into object, push into objectArray to return */
		csvArray.forEach((row) => {
			var rowArray = _parseCsvStrings(row.split(",")),
				rowObject = {};
			for (var i = 0; i < rowArray.length; i++) {
				rowObject[keys[i]] = rowArray[i];
			}
			objectArray.push(rowObject);
		});

		/* Sort objects in objectArray by sortOn (scheduled time) */
		objectArray.sort((a, b) => {
			return (a[sortOn] === b[sortOn]) ? 0 : ((a[sortOn] < b[sortOn]) ? -1 : 1);
		});

		/* App-specific formatting */
		/* Single timestamp to be returned. If there is no timestamp, make one for seconds */
		var singleTime = { timestamp: objectArray[0] === undefined ? (Number(new Date()) / 1000) : objectArray[0]["timestamp"] };
		singleTime.timestamp = this.makeHumanReadable(singleTime.timestamp, 0);

		objectArray.forEach((rowObject) => {
			/* Simplify status indicator */
			rowObject["status"] = _getStatus(rowObject["status"].replace(/ /g, ""));
			/* Add lateness seconds to scheuled time only */
			rowObject["scheduledtime"] = this.makeHumanReadable(rowObject["scheduledtime"], rowObject["lateness"]);
			/* Lateness is accounted for already, so we can remove it */
			delete rowObject["lateness"];
			/* Only one timestamp will be returned */
			delete rowObject["timestamp"];
		});
		
		objectArray.unshift(singleTime);

		return objectArray;
	}
}