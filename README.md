# mbta_departures
MBTA train departure data

This application was designed to display train departure data from a publicly available MBTA API. It runs on Node.js, using Express.js to handle server-side requests, Socket.io to broadcast data to the client, and React.js to update the DOM with data from the server.

app.js (in the root folder) contains the server-side of logic for obtaining, formatting, and periodically broadcasting MBTA data to the client.
convert.js (also in the root folder) contains some formatting functions used by the main application.
depart.js (in the public folder) contains the client-side logic using React.js to display the data as it is received.

See the comments in the programs to better understand the application details.

Tobias Estime - September 2016
