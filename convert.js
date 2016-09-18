/*
Convert
Functions for converting CSV into an array of objects
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

/* Convert timestamp to human readable time */
function _makeHumanReadable(timestamp, offset) {
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
}

/* Return a simplfied status for styling classes */
function _getStatus(status) {
	var statusOptions = [ "normal", "good", "imminent", "alert", "bad", "worse", "departed", "unknown" ];
	var selections = {
		OnTime: statusOptions[0],
		Arriving: statusOptions[1],
		NowBoarding: statusOptions[2],
		Arrived: statusOptions[2],
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
	
	return (Object.keys(selections).indexOf(status) > -1) ? selections[status] : statusOptions[7];
}

module.exports = {
	/* Convert CSV rows to array of objects */
	csvToObjectArray: function (csv, sortOn) {
		/*
		Replace empty cells with TBD and remove text quotation marks
		Quotation mark removal is done blindly since we don't expect commas in strings
		*/
		var csvArray = csv.replace(/, *,/g, ",TBD,").replace(/['"]/g, "").split("\n"),
		/* Spearate keys (first row) into own array */
			keys = _parseCsvStrings(csvArray[0].toLowerCase().split(","));
		csvArray.shift();
		/* Discard last line of CSV if empty*/
		if (csvArray[csvArray.length - 1] === "")
			csvArray.pop();

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

		/* Sort by scheduled time */
		objectArray.sort((a, b) => {
			return (a[sortOn] === b[sortOn]) ? 0 : ((a[sortOn] < b[sortOn]) ? -1 : 1);
		});

		/*
		Simplify status indicator
		Add lateness seconds
		"De-generalizes" function; consider alternatives
		*/
		objectArray.forEach((rowObject) => {
			rowObject["status"] = _getStatus(rowObject["status"].replace(/ /g, ""));
			rowObject["timestamp"] = _makeHumanReadable(rowObject["timestamp"], 0);
			rowObject["scheduledtime"] = _makeHumanReadable(rowObject["scheduledtime"], rowObject["lateness"]);
			/* Accounted for already */
			delete rowObject["lateness"];
		});

		return objectArray;
	}
}