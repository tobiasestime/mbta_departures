/*
Serves requests for the application using Express.js
Data is periodically broadcasted using Socket.io
*/

/* Import configuration values; set timezone */
var settings = require('./settings.json');
var port = settings.devPort;
process.env.TZ = settings.timezone;

/* Helper functions for converting CSV to JSON */
var convert = require('./convert.js');

/* Create Express, http instances */
var express = require('express');
var app = express();
var http = require('http');

/* Create server instance listening on environment's port or settings.devPort (8085) */
var server = http.Server(app).listen((process.env.PORT || port), () => {
	if (app.get('env') !== 'production')
		console.log(`Listening on port ${port}`);
});

/* Create Socket.io instance that shares server with Express */
var io = require('socket.io')(server);

/* Set mode; development or production */
settings = settings[app.get('env')];

/* Designation of static resources (js, css, etc.) */
app.use(express.static(__dirname + '/public'));


/* The only route used by the single-page application (when using Socket.io instead of using AJAX) */
app.get('/', (req, res) => {
	res.sendFile('/index.html');
});

/* Handle 404s */
app.use(function(req, res, next) {
	res.status(404).send('Not here. Not today. Try https://tdepartures.herokuapp.com');
});

/*
Access the departure data API and emit events
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
		}).setTimeout(settings.dataTimeout, updateError).on('error', updateError);
	}
	catch (err) {
		updateError();
	}
	/* Send generic error flag to client awaiting update */
	function updateError() {
		socket.emit('update', [{flag: 'NODATA'}]);
	}
}

/* When clients connect, broadcast new data from 'dataSource' every 'broadcastInt' seconds */
io.on('connection', (socket) => {
	/* Initial broadcast */
	emitFromHttp(socket, settings.dataSource);
	/* Subsequent broadcasts */
	var trains = setInterval(() => {
		emitFromHttp(socket, settings.dataSource);
	}, settings.broadcastTime);
	socket.on('disconnect', () => {
		clearInterval(trains);
	});
});