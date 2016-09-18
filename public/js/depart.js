/*
React.js script to create departures table
Socket.io picking up on events.
Additional JS to manipulate data visibility
*/
(function DepartMain($) {

	/* Controls for station selection */
	var stationSelect = {
		/* NorthStation selected by default */
		selection: "NorthStation",
		select: function(value) {
			this.selection = value;
			$("#departureTable tr").toArray().forEach(function(r) {
				/* Array of classes for row */
				var classArray = $(r).attr("class").split(" ");
				/* Remove hidden class for clarity */
				if (classArray.indexOf("hidden") > -1) {
					classArray.pop();
				}
				classArray = classArray.join(" ");
				/* If class does not match value, add hidden styling class */
				$(r).attr("class", (classArray.indexOf(value) > -1) ? classArray : classArray + " hidden");
			});
		}
	};

	/* Attach event listeners to buttons to change selection and colors */
	$("button.station-select").toArray().forEach(function(b) {
		$(b).click(function() {
			/* Select station clicked */
			stationSelect.select($(b).attr("id"));
			$("button.station-select").not(b).css({"background-color": "#fff", "color": "#000"});
			$(b).css({"background-color": "#812b5a", "color": "#fff"});
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
	Table cells correspond to properties from our objects
	*/
	var Departure = React.createClass({
		render: function() {
			/* Format data for display */
			var formattedTime = this.props.scheduledtime.split(" ");
			var origin = this.props.origin.replace(/ /g, "");
			/* If origin is not selected station, add hidden styling class */
			var visibility = (origin === stationSelect.selection ? "" : " hidden");
			/* Hide track info if cancelled; maybe move server-side */
			var track = this.props.status === "worse" || this.props.status === "departed" ? "-" : this.props.track;
			return (
				<tr className={origin + " " + this.props.status + visibility}>
					<td className="center">{this.props.trip}</td>
					<td>{this.props.destination}</td>
					<td>{formattedTime[0] + " " + formattedTime[1]}</td>
					<td className="center">{track}</td>
				</tr>
			);
		}
	});

	/* The departures table lists each table row */
	var DepartureTable = React.createClass({
		render: function() {
			var departureNodes = this.props.data.map(function(data) {
				return (
					<Departure origin={data.origin} trip={data.trip} destination={data.destination} scheduledtime={data.scheduledtime} track={data.track} status={data.status} updatetime={data.timestamp}></Departure>
				);
			});
			return (
				<table id="departureTable">
					{departureNodes}
				</table>
			);
		}
	});

	/* Render React DOM */
	var reactDepartures = ReactDOM.render(<DepartureBox />, document.getElementById("content"));

	/* Create Socket connection */
	var socket = io();

	/* Emit event to get ball rolling */
	socket.emit("filter", "NorthStation");

	/* Listen for update events and update React with new data */
	socket.on("update", function(departures) {
		document.getElementById("updated").innerHTML = "Updated " + departures[0].timestamp + " (Boston)";
		reactDepartures.updateData(departures);
	});
})(jQuery);