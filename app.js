/*
Serves the requests for the application using Express.js
Data is periodically broadcasted using Socket.io, but could be polled
from clients via AJAX to access controller actions that performs GET
requests for data.
*/

/* Timezone */
process.env.TZ = 'America/New_York';

/* Create Express instance */
var express = require('express');
var app = express();
var http = require('http');
/* Create server instance listening listening on environment's port or 8085 */
var server = http.Server(app).listen((process.env.PORT || 8085), () => {
	console.log(`Listening on port ${(process.env.PORT || 8085)}`);
});
/* Create socket instance that shares server*/
var io = require('socket.io')(server);

/* Helper functions for converting CSV to JSON */
var convert = require('./convert.js');

/* Values separated to be accessed easily, changed, added to, etc. */
var values = {
	/* dataSource: 'http://127.0.0.1:8080/departures/Departures.csv', */
	dataSource: 'http://developer.mbta.com/lib/gtrtfs/Departures.csv',
	dataTimeout: 5000,
	broadcastTime: 30000
}

/* Designation of static resources (js, css, etc.) */
app.use(express.static(__dirname + '/public'));

/* The only route used by the single-page application (when using socket.io instead of using AJAX) */
app.get('/', (req, res) => {
	res.sendFile('/index.html');
});

/* Handle production 404s */
app.use(function(req, res, next) {
	res.status(404).send('Not here. Not today. Try https://tdepartures.herokuapp.com');
});

/*
Access the departure data API and emit events for broadcast
Could cache most recent data rather than repeating request for new connections
*/
function emitFromHttp(socket, URI) {
	/* Handle errors from output */
	try {
		/* http GET request for train departure data */
		http.get(URI, (httpRes) => {
			/* Gather chunks of data as they are sent */
			var allData = '';
			httpRes.setEncoding('utf8').on('data', (partData) => {
				allData += partData;
			});
			/* Broadcast data formatted from CSV to JSON once all chunks from the request are gathered */
			httpRes.on('end', () => {
				/* Data integrity checks could be implemented here before responding */
				socket.emit('update', convert.csvToObjectArray(allData, 'scheduledtime'));
			}).on('error', updateError);
		}).setTimeout(values.dataTimeout, updateError).on('error', updateError);
	}
	catch (err) {
		updateError();
	}
	/* Send generic error flag to client awaiting update */
	function updateError() {
		socket.emit('update', [{flag: 'NODATA'}]);
	}
}

/*
When clients connect, broadcast the CSV data as JSON using emitFromHttp
Broadcast new data from 'dataSource' every 'broadcastInt' seconds
*/
io.on('connection', (socket) => {
	/* Initial broadcast */
	emitFromHttp(socket, values.dataSource);
	/* Subsequent broadcasts */
	var trains = setInterval(() => {
		emitFromHttp(socket, values.dataSource);
	}, values.broadcastTime);
	socket.on('disconnect', () => {
		clearInterval(trains);
	});
});