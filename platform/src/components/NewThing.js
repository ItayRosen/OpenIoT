import React, {Component} from 'react';
import {API_URL, Website_Name} from '../constants/constants.js';
import Header from './Header.js'
import {Redirect} from "react-router-dom";
import Loader from './Loader.js'

//Bootstrap
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

//Fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faTrash } from '@fortawesome/free-solid-svg-icons'

class NewThing extends Component {

	  constructor(props) {
		super(props);
				
		this.state = {
			authenticated: 0, 
			name: 0, 
			board: "esp8266", 
			callback: "", 
			callbackStatus: false, 
			step: 1, 
			thingID: 0, 
			connected: false, 
			redirect: "",
			clicked: false,
			deleteClicked: false,
			token: "",
			email: ""
		};
		
		this.HandleChange = this.HandleChange.bind(this);
		this.Submit = this.Submit.bind(this);
		this.MainBlock = this.MainBlock.bind(this);
		this.ListSteps = this.ListSteps.bind(this);
		this.Prepare = this.Prepare.bind(this);
		this.NextStep = this.NextStep.bind(this);
		this.checkConnectionStatus = this.checkConnectionStatus.bind(this);		
		this.Delete = this.Delete.bind(this);		
		this.getToken = this.getToken.bind(this);		
	  }
	  
	componentWillMount() {
		document.title = "New Thing - " + Website_Name;
		//authenticate
		fetch(API_URL + "user/read.php", {credentials: 'include'})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200) {
					this.setState({authenticated: 1, email: result.data.email});					
				}
				else {
					this.setState({ authenticated: -1 });
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
		//connect thing step
		if (this.props.location.search.indexOf("connect=") !== -1) {
			this.setState({step: 3, thingID: this.props.location.search.substring(this.props.location.search.indexOf("=") + 1)});
			this.intervalId = setInterval(this.checkConnectionStatus.bind(this), 3000);
			this.getToken(true);
		}
	}
	
	getToken(fromURL) {
		let id = (fromURL) ? this.props.location.search.substring(this.props.location.search.indexOf("=") + 1) : this.state.thingID;
		fetch(API_URL + "thing/getToken.php", {credentials: 'include', method: "POST", body: JSON.stringify({id: id})})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200) {
					this.setState({ token: result.data});					
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	checkConnectionStatus() {
		fetch(API_URL + "thing/read.php", {credentials: 'include', method: "POST", body: JSON.stringify({id: this.state.thingID})})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200 && result.data.status === 1) {
					clearInterval(this.intervalId);
					this.setState({connected: true, deleteClicked: true});
					//redirect
					setTimeout(
						function() {
							this.setState(state => ({redirect: "./thing/" + this.state.thingID}));
						}
						.bind(this),
						5000
					);
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	HandleChange(event) {
		const name = event.target.name;
		const value = event.target.value;
		this.setState(state => ({
			[name]: value
		}));
	}
	
	Submit(e) {
		e.preventDefault();
		this.setState({callback: "", clicked: true});
		fetch(API_URL + "thing/new.php", {credentials: 'include', method: "POST", body: JSON.stringify(this.state)})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200) {
					this.intervalId = setInterval(this.checkConnectionStatus.bind(this), 3000);
					this.setState({step: 2, thingID: result.id, clicked: false});
				}
				else {
					this.setState({callback: result.data, callbackStatus: false, clicked: false});
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	ListSteps() {
		const steps = [
			{id: 1, title: 'Configure'},
			{id: 2, title: 'Prepare'},
			{id: 3, title: 'Connect'},
		];
		
		
			return steps.map((step) => {
				if (this.state.step > step.id) {
					this.stepClass = "text-danger";
				}
				else if (this.state.step === step.id) {
					this.stepClass = "text-dark";
				}
				else {
					this.stepClass = "text-muted";
				}
				
				return (
					<Row key={step.id} className={this.stepClass}><Col xs={{ span: 1}}>{(this.state.step > step.id) ? <FontAwesomeIcon icon={faCheck}/> : step.id + "."}</Col><Col xs={{ span: 9}}>{step.title}</Col></Row>
				)
			});
	}
	
	NextStep() {
		const newStep = this.state.step + 1;
		if (newStep === 3) {
			this.getToken(false);
		}
		this.setState({step: newStep});
	}
	
	Delete() {
		this.setState({deleteClicked: true});
		fetch(API_URL + "thing/delete.php", {credentials: 'include', method: "POST", body: JSON.stringify({"id": this.state.thingID})})
		.then(res => res.json())
		.then(
			(result) => {
				console.log(result);
				if (result.response === 200) {
					this.setState({redirect: "/Dashboard"});
				}
				else {
					alert(result.data);
				}
			},
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	MainBlock() {
		
		const exampleSketch = `#include <Openiot.h>

//set your wifi credentials and OpenIoT token
const char *ssid = "wifi_network_name";
const char *password = "wifi_password";
const char *token = "` + this.state.token + `";

//create a client
WiFiClient wifi;
Openiot client(wifi, ssid, password, token);

//create a variable that we can attach later
String myVariable = "Hello";

void setup() {
	//Set serial port for debugging
	Serial.begin(9600);
	client.setStream(Serial);
	
	//Start client
	client.begin();
	  
	//Attach variable
	client.attachVariable(myVariable,"My Variable");
}

void loop() {
	//Run client on loop
	client.loop();
	//Print the variable every 5 seconds
	Serial.println(myVariable);
	delay(5000);
}`;
		
		switch (this.state.step) {			
			case 2:
			return (
				<div className="box">
					<Row>
						<h3>Prepare Your Thing</h3>
					</Row>
					<this.Prepare />
					<Button className="submit" block variant="success" onClick={this.NextStep}>Done</Button>
				</div>
			);
			
			case 3:
			return (
				<div className="box">
					<Row>
						<h4>Connect Your Thing</h4>
					</Row>
					<Row>
						<p>Now that you are ready to program your board with Arduino code, all is left is to upload our library to your IDE and get started with an example sketch. If you've changed your mind, click on the Delete button. You can keep track of the connection status at the bottom.</p>
						<p>Your thing's token is: <code>{this.state.token}</code></p>
						<p>1. Upload the OpenIoT library to your IDE. You can download it <a rel="noopener noreferrer" target="_blank" href="https://github.com/ItayRosen/OpenIoT/releases">here</a>.</p>
						<p>2. Run the example sketch. Make sure to update your WiFi's credentials. This example sketch will attach a variable to the Platform and print it every 5 seconds. Change the variable's value to something else on the Platform and see how it changes in your Serial monitor.</p>
						<pre style={{background: "#3333", maxHeight: "200px"}}><code>{exampleSketch}</code></pre>
						<p>3. After uploading the sketch, make sure to click the restart button on your board. Monitor your serial monitor for possible erros. If all goes well, your board will automatically connect to the platform.</p>
						<div className={(this.state.connected) ? "text-success font-weight-bold" : "text-danger font-weight-bold"}>{(this.state.connected) ? "Connected Successfully!" : "Awaiting connection..."}</div>
					</Row>
					<Button className="submit" onClick={() => this.Delete()} variant="danger" block disabled={this.state.deleteClicked}><FontAwesomeIcon icon={faTrash}/> Delete</Button>
				</div>
			);
			
			default:
			return (
				<div className="box">
					<Row>
						<h4>Configure Your Thing</h4>
					</Row>
					<Row>
						<p>Set up your board and connect it to our platform. After connecting your board you will be able to program it over the air (OTA), set up notifications and access its components in real time.</p>
					</Row>
					<Row>
						<Form onSubmit={e => this.Submit(e)}>
							<Form.Group>
								<Form.Label>Board Type</Form.Label>
								<Form.Control name="board" as="select" onChange={this.HandleChange}>
									<option value="esp8266">NodeMCU / ESP8266</option>
								</Form.Control>
							</Form.Group>
							<Form.Group>
								<Form.Label>Thing Name</Form.Label>
								<Form.Control name="name" type="text" onChange={this.HandleChange} placeholder="How do you want to call this specific board?" />
							</Form.Group>
							<Button type="button" disabled={this.state.clicked} onClick={this.Submit} variant="success" block>Create Thing</Button>
						</Form>
						<div className={(this.state.callbackStatus) ? "text-success font-weight-bold" : "text-danger font-weight-bold"}>{this.state.callback}</div>
					</Row>
				</div>
			);
		}
	}
	
	Prepare() {
		switch (this.state.board) {
			case "esp8266": 
				return (
					<Row>
						<p>If you're not yet familiar with your board, take your first steps by <a rel="noopener noreferrer" target="_blank" href="/Learn">learning about it</a>.</p>
						<p>In order to connect your board to the Platform, you need to use the OpenIoT library. As of now, it's written for Arduino based projects only, so you will be able to use it with Arduino IDE or PlatformIO. If you have already added ESP8266 support to your IDE, please feel free to skip this step by clicking "Done".</p>
						<p>Learn how to program ESP8266 with <a rel="noopener noreferrer" target="_blank" className="text-dark" href="https://www.instructables.com/id/Quick-Start-to-Nodemcu-ESP8266-on-Arduino-IDE/">Arduino IDE</a> or <a rel="noopener noreferrer" target="_blank" className="text-dark" href="https://www.instructables.com/id/Introducing-PlatformIO-for-ESP8266/">PlatformIO</a>.</p>
						<p>Once you're done, go to the next step by clicking "Done".</p>
					</Row>
				);
				
			default:
				return (
					<Row>Unsupported board</Row>
				);
		}
	}

	render() {
		if (this.state.redirect !== "") { 
			return (<Redirect to={this.state.redirect} />);
		}
		else if (this.state.authenticated === 0) {
			return (<Loader/>);
		}
		else if (this.state.authenticated === 1) {
			return (	
				<div id="newThing">
					<Header email={this.state.email} name="New Thing" />
					<div className="content">
						<Container>
							<Row>
							<Col lg={{ span: 3}} md={{ span: 5}}>
									<div className="box">
										<Row className="justify-content-md-center">
											<h5>Steps</h5>
										</Row>
										<this.ListSteps />
									</div>
								</Col>
								<Col lg={{ span: 8}} md={{ span: 7}}>
									<this.MainBlock />
								</Col>
							</Row>
						</Container>
					</div>
				</div>
			);
		}
		else {
			return (<Redirect to="./Login"/>);
		}
	}
}

export default NewThing