import React, {Component} from 'react';
import {API_URL} from '../../constants/constants.js';
import {Line} from 'react-chartjs-2';

//Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

//Fontawesome
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//import { faPlus } from '@fortawesome/free-solid-svg-icons'

class Activity extends Component {
	
	  constructor(props) {
		super(props);
		
		this.state = {
			thingID: props.thingID,
			logs: 0,
			chartData: []
		};
		
		this.Logs = this.Logs.bind(this);	
		this.CreateChartData = this.CreateChartData.bind(this);	
		this.Chart = this.Chart.bind(this);	
	  }
	  
	  componentWillMount() {
		//fetch logs
		fetch(API_URL + "activity/read.php", {credentials: 'include', method: "POST", body: JSON.stringify({"thingID": this.state.thingID})})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200) {
					this.setState({ 
						logs: result.data,
					});
					this.CreateChartData();
				}
				else {
					this.setState({ 
						logs: -1,
					});
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
		this.CreateChartData();
	  }
	  
	  render() {
		  
		return(
			<div id="Logs">
				<Row>
					<Col>
					<h3>Activity Log</h3>
					<p>This is the activity log for your Thing. Here you can keep track of it.</p>
					</Col>
				</Row>
				<Row>
					<Col xl={{span: 6}} lg={{span: 6}}>
						<div className="box">
							<h4>24 Hour Uptime Chart</h4>
							<this.Chart data={this.state.chartData} displayTicks={false} unit="hour" />
						</div>
					</Col>
					<Col xl={{span: 6}} lg={{span: 6}}>
						<div className="box">
							<h4>Logs</h4>
							<this.Logs />
						</div>
					</Col>
				</Row>
			</div>
		);
	  }
	  
	Chart(props) {
		const data = {
		  datasets: [
			{
				data: props.data,
				pointRadius: 0.1
			}
		  ]
		};

		const options = {
			scales: {
				yAxes: [{
					ticks: {
						display: props.displayTicks
					},
					gridLines: {
						color: (props.displayTicks) ? "rgba(0, 0, 0, 0)" : ""
					}
				}],
				xAxes: [{
					type: 'time',
					gridLines: {
						color: "rgba(0, 0, 0, 0)"
					},
					time: {
						unit: props.unit,
						displayFormats: {
							hour: 'HH:mm'
						}
					}
				}]
			},
			legend: {
				display: false
			},
			tooltips: {
//				enabled: false,
			}
		};

		return (
			<Line data={data} options={options}/>
		);
	}
	  
	Logs() {
		if (this.state.logs !== 0) {
			return this.state.logs.slice(0).reverse().map((log, i) => {
				return (
					<Row className="log" key={i}>
						<Col xs={{span: 5}} xl={{span: 4}} lg={{span: 6}}>{log.time}</Col>
						<Col>{log.data}</Col>
					</Row>
				)
			});
		}
		else {
			return (
				<div>Loading..</div>
			);
		}
	}
	
	CreateChartData() {
		//make sure logs data was populated
		if (!Array.isArray(this.state.logs)) return;
		let logs = this.state.logs;
		//create array of timestamps (1 min interval)
		let timeStamp = Math.floor(Date.now() / 1000);
		let now = Date.now();
		let data = [];
		for (let i = 0; i < 1440; i++) { 
			data.push({y: 0, x: timeStamp - i * 60, t: new Date(now - i * 60000)});
		}
		//loop through logs
		for (let i = 0; i < logs.length; i++) {
			//discard anything which is not a connection / reboot log
			if (logs[i].data === "connected" || logs[i].data === "reboot") {
				//loop through timestamps
				for (let j = 0; j < 1440; j++) {
					//discard timestamps which are not between this log and the next (or it's the last log)
					if (data[j].x > logs[i].id && (i === logs.length-1 || data[j].x < logs[i+1].id)) {
						data[j].y = 1;
					}
				}
			}
		}
		this.setState({chartData: data});
	}
}

export default Activity