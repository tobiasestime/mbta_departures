/*
React.js script to create departures table
Socket.io picking up on events.
Additional JS to manipulate data visibility
*/
(function DepartMain($) {

	/* Controls for station visibility selection */
	var stationSelect = {
		/* NorthStation selected by default */
		selection: "NorthStation",
		select: function(value) {
			this.selection = value;
			/* Iterate through table rows to determine which ones are hidden */
			$("#departureTable tr").toArray().forEach(function(row) {
				/* Array of classes for row */
				var classArray = $(row).attr("class").split(" ");
				/* Remove hidden class for clarity */
				if (classArray.indexOf("hidden") > -1) {
					classArray.pop();
				}
				classArray = classArray.join(" ");
				/* If class does contain value, add hidden styling class */
				$(row).attr("class", (classArray.indexOf(value) > -1) ? classArray : classArray + " hidden");
			});
		}
	};

	/* Attach event listeners to buttons to change selection and colors */
	$(".station-select").toArray().forEach(function(button) {
		$(button).click(function() {
			/* Select station clicked */
			stationSelect.select($(button).attr("id"));
			/* Style clicked button */
			$(".station-select").not(button).removeClass("selected");
			$(button).addClass("selected");
		});
	});

	/* Container for table */
	var DepartureBox = React.createClass({
		/* Intialize with empty array for data */
		getInitialState: function() {
			return {data: []};
		},
		/* Socket.io uses this method to update React with new data */
		updateData: function(departureData) {
			this.setState({data: departureData});
		},
		render: function() {
			return (
				<div id="departureBox">
					<DepartureTable data={this.state.data} />
				</div>
			);
		}
	});

	/*
	Each departure is translated into a table row
	Table cells correspond to properties from objects in array sent from server
	*/
	var Departure = React.createClass({
		render: function() {
			/* Format data for display */
			var formattedTime = this.props.scheduledtime.split(" ");
			var origin = this.props.origin.replace(/ /g, "");
			/* If origin is not selected station, add hidden styling class */
			var visibility = (origin === stationSelect.selection ? "" : " hidden");
			/* Hide track info if cancelled; maybe move server-side */
			var trackFormat = this.props.status === "worse" || this.props.status === "departed" ? "-" : this.props.track;
			/* Adjust status for "alert" style (cell only) */
			var statusFormat = this.props.status === "alert" ? "imminent" : this.props.status;
			return (
				<tr className={origin + " " + statusFormat + visibility}>
					<td className="center">{this.props.trip}</td>
					<td>{this.props.destination}</td>
					<td><span className={this.props.status}>{formattedTime[0]}<span className="smaller">{" " + formattedTime[1]}</span></span></td>
					<td className="center">{trackFormat}</td>
				</tr>
			);
		}
	});

	/* The departures table lists each table row */
	var DepartureTable = React.createClass({
		render: function() {
			var departureNodes = this.props.data.map(function(data) {
				return (
					<Departure origin={data.origin} trip={data.trip} destination={data.destination} scheduledtime={data.scheduledtime} track={data.track} status={data.status}></Departure>
				);
			});
			return (
				<table id="departureTable">
					<tbody>
						{departureNodes}
					</tbody>
				</table>
			);
		}
	});

	/* React DOM rendering */
	var reactDepartures = ReactDOM.render(<DepartureBox />, document.getElementById("content"));

	/* Create socket connection */
	var socket = io();

	/* Listen for "update" events and update React with data from server */
	socket.on("update", function(departures) {
		document.getElementById("updated").innerHTML = "Updated " + departures[0].timestamp + " (Boston)";
		reactDepartures.updateData(departures);
	});
})(jQuery);