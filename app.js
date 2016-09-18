/*
Serves the requests for the application using Express.js
Data is periodically broadcasted using Socket.io, but could be polled
	from the client via AJAX to access controller action that performs GET requests for data.
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
/* Create socket instance with server */
var io = require('socket.io')(server);

/* Helper functions for converting CSV to JSON */
var convert = require('./convert.js');

/* Values Separated to be accessed easily, changed, added to, etc. */
var values = {
	/* dataSource: 'http://127.0.0.1:8080/departures/Departures.csv', */
	dataSource: 'http://developer.mbta.com/lib/gtrtfs/Departures.csv',
	dataTimeout: 5000,
	broadcastTime: 30000
}

/* Designation of static resources (client js, css, etc.) */
app.use(express.static(__dirname + '/public'));

/* The only route used by the application (when using socket.io) - to access the single-page app */
app.get('/', (req, res) => {
	res.sendFile('/index.html');
});

/*
Access the departure data API and emit events for broadcast
Could cache most recent data rather than repeating request
*/
function emitFromHttp(socket, URI) {
	/* http GET request for train departure data */
	http.get(URI, (httpRes) => {
		/* Gather chunks of data as they are sent */
		var allData = "";
		httpRes.setEncoding('utf8').on('data', (partData) => {
			allData += partData;
		});
		/* Broadcast data as JSON once all chunks from the request are gathered */
		httpRes.on('end', () => {
			/* Data integrity checks could be implemented here before responding */
			socket.emit('update', convert.csvToObjectArray(allData, "scheduledtime"));
			/*
			Console logging for development purposes only
			Notifications or analytics might be implemented in production to track performance
			*/
		});
	}).setTimeout(values.dataTimeout, () => {
		/* Could use flags to notify clients of failures in production */
		socket.emit('update', [{flag: 'TIMEOUT'}]);
	}).on('error', () => {
		socket.emit('update', [{flag: 'NODATA'}]);
	});
}

/*
On connecting, broadcast the CSV data as JSON using emitFromHttp
Broadcast new data every 'broadcastInt' seconds
*/
io.on('connection', (socket) => {
	emitFromHttp(socket, values.dataSource);
	var trains = setInterval(() => {
		emitFromHttp(socket, values.dataSource);
	}, values.broadcastTime);
	socket.on('disconnect', () => {
		clearInterval(trains);
	});
});