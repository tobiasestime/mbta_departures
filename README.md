# mbta_departures
Displaying MBTA train departure data

This application was designed to display train departure data from a publicly available MBTA API. It is a Node.js application, using Express.js to handle server-side requests, Socket.io to broadcast data to clients (via WebSockets or polling), and React.js to update the DOM with data from the server.

* app.js (in the root folder) contains the server-side of logic for obtaining, formatting, and periodically broadcasting MBTA data to clients.
* convert.js (root folder) contains some formatting functions used by the main application.
* depart.js (public folder) contains the client-side logic, using React.js to display new data as it is received.

View the application [here](https://tdepartures.herokuapp.com/). Since it's in development, uptime may not be 100%.

See the diagram (root folder) and review the comments in the programs to better understand the application's details.

Tobias Estime - September 2016
