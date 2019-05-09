import React, {Component} from 'react';
import Switch from "react-switch";
import {Redirect} from "react-router-dom";
import ReactTooltip from 'react-tooltip'
import {API_URL} from '../../constants/constants.js'
import copy from 'copy-to-clipboard';
import {Line} from 'react-chartjs-2';

//Confirm Alert
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css'

//Slider
import Slider from 'rc-slider/lib/Slider';
import 'rc-slider/assets/index.css';

//Notification
import ReactNotification from "react-notifications-component";
import "react-notifications-component/dist/theme.css";

//Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';

//Fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrochip,faCode,faGlobe,faPowerOff,faPlug,faClock,faAngleDown,faCodeBranch,faUpload,faSquareRootAlt } from '@fortawesome/free-solid-svg-icons'

//Spin loader
import { css } from '@emotion/core';
import { RingLoader } from 'react-spinners';
const loaderCss = css`
    display: block;
    margin-left: auto;
    margin-right: auto;
    border-color: red;
`;
const loader = <div className='sweet-loading'><RingLoader css={loaderCss} sizeUnit={"px"} size={35} color={'#de4b39'}/></div>;

class Overview extends Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			ports: props.thing.ports,
			variables: props.thing.variables,
			functions: props.thing.functions,
			thingID: props.thing.thingID,
			name: props.thing.name,
			ip: props.thing.ip,
			status: props.thing.status,
			board: props.thing.board,
			lastActivity: props.thing.lastActivity,
			access: props.thing.access,
			version: props.thing.version,
			password: props.thing.password,
			createdTime: props.thing.createdTime,
			renameModal: false,
			tokenModal: false,
			elementModal: false,
			elementModalData: 0,
			elementModalLogs: 0,
			newName: "",
			clicked: false,
			callback: "",
			loader: null,
			transmitting: false,
			tokenCopied: false,
			redirect: "",
			loadElementsInterval: 0
		};
		
		this.Ports = this.Ports.bind(this);		
		this.Variables = this.Variables.bind(this);			
		this.Functions = this.Functions.bind(this);			
		this.Summary = this.Summary.bind(this);			
		this.Slider = this.Slider.bind(this);			
		this.ChangePort = this.ChangePort.bind(this);			
		this.renameModal = this.renameModal.bind(this);			
		this.tokenModal = this.tokenModal.bind(this);	
		this.elementModal = this.elementModal.bind(this);
		this.SubmitName = this.SubmitName.bind(this);
		this.Delete = this.Delete.bind(this);	
		this.Element = this.Element.bind(this);	
		this.Switch = this.Switch.bind(this);	
		this.ChangeVariable = this.ChangeVariable.bind(this);	
		this.loadElements = this.loadElements.bind(this);
		this.loadElementData = this.loadElementData.bind(this);
		
		this.notificationDOMRef = React.createRef();
	}
	
	componentWillMount() {
		//Load elements every 10 seconds
		let interval = setInterval(this.loadElements, 10000);
		this.setState({loadElementsInterval: interval});
		//show notification helper if it's a new thing (created in the last hour)
		setTimeout(() => {
			if (this.state.createdTime > (Date.now()) / 1000 - 3600) {
				this.addNotification("Great job!","Now that you've connected your first device, it's time to add components. Click on \"Learn\" to learn how to do it.", "info", 0);
			}
		}, 1000);
	}
	
	componentWillUnmount() {
		clearInterval(this.state.loadElementsInterval);
	}
	
	/* Element */
	
	Element(props) {
		return (
			<Col xs={{span: 6}} lg={{span: 4}}  xl={{span: 3}}>
				<div className="box" style={{padding: "10px", minHeight: "140px"}}>
					<Row>
						<Col xs={{span: 3}} className="text-left" style={{paddingTop: "5px"}}>
							<FontAwesomeIcon  color={props.color} size="2x" icon={props.icon}/>
						</Col>
						<Col xs={{span: 9}} className="text-right">
							<Row><Col className="title" onClick={() => this.loadElementData(props)}>{props.name}</Col></Row>
							<Row><Col className="d-none d-md-block">{props.type}</Col></Row>
						</Col>
						<Col xs={{span: 12}} className="d-block d-md-none">{props.type}</Col>
					</Row>
					<Row>
						<Col>
							<hr/>
							{props.children}
						</Col>
					</Row>
				</div>
			</Col>
		);
	}
	
	elementModal(props) {
		//set modal content
		let content
		if (this.state.elementModalLogs === 0) {
			content = loader;
		}
		else if (this.state.elementModalLogs === -1) {
			content = <p>This element is still empty..</p>;
		}
		else {
			if (this.state.elementModalData.element === "port" || this.state.elementModalData.elementDataType === "int" || this.state.elementModalData.elementDataType === "float") {
				content = <this.Chart data={this.state.elementModalLogs} displayTicks={true} unit="day" color="rgba(222, 75, 57, 1)"/>;
			}
			else {
				content = <this.Logs data={this.state.elementModalLogs} />;
			}
		}
	
		return (
		  <Modal {...props} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
			<Modal.Header closeButton>
			  <Modal.Title id="contained-modal-title-vcenter">{this.state.elementModalData.name}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<Form.Group>
					{content}
				</Form.Group>
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={props.onHide} variant="secondary">Close</Button>
			</Modal.Footer>
		  </Modal>
		);
	}
	
	//load all elements
	loadElements() {
		fetch(API_URL + "thing/read.php", {credentials: 'include', method: "POST", body: JSON.stringify({"id": this.state.thingID})})
		.then(res => res.json())
		.then(
			(result) => {
				if (result.response === 200) {
					this.setState({ports: result.data.ports, variables: result.data.variables, functions: result.data.functions, lastActivity: result.data.lastActivity, status: result.data.status});
				}
			},
			(error) => {
				console.log(error);
			}
		)
	}
	
	//load element's logs (for logs list or chart)
	loadElementData(props) {
		this.setState({elementModalData: props, elementModal: true, elementModalLogs: 0});
		//Load element's data (logs)
		fetch(API_URL + "thing/readElement.php", {credentials: 'include', method: "POST", body: JSON.stringify({"thingID": this.state.thingID, "name": props.name})})
		.then(res => res.json())
		.then(
			(result) => {
				if (result.response === 200) {
					let data = result.data;
					if (this.state.elementModalData.element === "port" || this.state.elementModalData.elementDataType === "int" || this.state.elementModalData.elementDataType === "float") {
						data = this.generateChartData(data);
					}
					this.setState({elementModalLogs: data});
				}
				else if (result.response === 204) {
					this.setState({elementModalLogs: -1});
				}
			},
			(error) => {
				console.log(error);
			}
		)
	}
	
	//Parse logs to list
	Logs(props) {
		return props.data.map((log, i) => {
			let date = new Date(log.id * 1000);
			return (
				<Row key={i}><Col>{date.toUTCString()}</Col><Col style={{color: "#de4b39"}}>{log[0]}</Col></Row>
			);
		});
	}
	
	
	/* Chart */
	
	generateChartData(logs) {
		let now = Date.now();
		let timeStamp = Math.floor(now / 1000);
		let data = [];
		let lastIndex = 0;
		let interval = 0;
		//set the number of datapoints
		if (timeStamp - logs[0].id > 86400 * 30) {
			interval = 3600;
		}
		else if (timeStamp - logs[0].id > 3600 * 12) {
			interval = 600;
		}
		else {
			interval = 60;
		}
		let n = Math.floor((timeStamp - logs[0].id) / interval);
		//create timestamps
		for (let i = 0; i < n; i++) { 
			data.push({y: 0, x: timeStamp - i * interval, t: new Date(now - i * interval * 1000)});
		}
		data = data.reverse();
		//loop through logs
		for (let i = 0; i < logs.length; i++) {
			//loop through timestamps
			for (let j = lastIndex; j < n; j++) {
				//discard timestamps which are not between this log and the next (or it's the last log)
				if (data[j].x > logs[i].id && (i === logs.length-1 || data[j].x < logs[i+1].id)) {
					data[j].y = parseFloat(logs[i][0]);
					lastIndex = i;
				}
			}
		}
		return data;
	}
	
	Chart(props) {
		const data = {
		  datasets: [
			{
				data: props.data,
				pointRadius: 0.2,
				backgroundColor: props.color
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
//						color: "rgba(0, 0, 0, 0)"
					},
					time: {
						//unit: props.unit,
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
			},
			
		};

		return (
			<Line data={data} options={options}/>
		);
	}
	
	/* Notifications */
	
	addNotification(title, message, type, timeout = 3000) {
		this.notificationDOMRef.current.addNotification({
		  title: title,
		  message: message,
		  type: type,
		  insert: "top",
		  container: "bottom-left",
		  animationIn: ["animated", "fadeIn"],
		  animationOut: ["animated", "fadeOut"],
		  dismiss: { duration: timeout },
		  dismissable: { click: true }
		});
	}
	
	/* Data handling */
	
	Transmit(data) {
		console.log(data);
		if (this.state.transmitting) {
			this.addNotification("Hold on..", "Transmission in progress.. Please wait.", "info");
			return;
		}
		this.setState({loader: data.uniqueID, transmitting: true});
		fetch(API_URL + "thing/transmit.php", {credentials: 'include', method: "POST", body: JSON.stringify(data)})
		.then(res => res.json())
		.then(
			(result) => {
				this.setState({transmitting: false});
				if (result.response === 200) {
					this.addNotification("Success!", "Operation transmitted to device.", "success");					
					if (data.action === "gpio") {
						let ports = this.state.ports;
						ports[data.index].value = ports[data.index].newValue;
						this.setState({ports: ports});
					}
					else if (data.action === "variable") {
						let variables = this.state.variables;
						variables[data.index].value = variables[data.index].newValue;
						this.setState({variables: variables});
					}
				}
				else {
					this.addNotification("Error", result.data, "danger");
					if (data.action === "gpio") {
						let ports = this.state.ports;
						ports[data.index].newValue = ports[data.index].value;
						this.setState({ports: ports});
					}
					else if (data.action === "variable") {
						let variables = this.state.variables;
						variables[data.index].newValue = variables[data.index].value;
						this.setState({variables: variables});
					}
				}
				this.setState({loader: ""});
			},
			(error) => {
				alert("Connection error. Please reload");
				console.log(error);
				this.setState({transmitting: false});
				if (data.action === "gpio") {
					let ports = this.state.ports;
					ports[data.index].newValue = ports[data.index].value;
					this.setState({ports: ports});
				}
				else if (data.action === "variable") {
				let variables = this.state.variables;
					variables[data.index].newValue = variables[data.index].value;
					this.setState({variables: variables});
				}
			}
		)
	}
	
	/* Ports */ 
	
	Ports() {
		if (this.state.ports) {
			return this.state.ports.map((port, i) => {
				return (
					<this.Element key={i} uniqueID={port.name} icon={faPlug} element="port" color="#4fbad4" name={port.name} type={((port.mode === 1) ? "output " : "input ") + port.type + " port"}>
						{(port.type === "digital") ? <this.Switch uniqueID={port.name} port={port} i={i}/> : <this.Slider uniqueID={port.name} color="#4fbad4" port={port} i={i}/>}
					</this.Element>
				)
			});
		}
		else {
			return (
				null
			);
		}
	}
	
	ChangePort(index, value, update, uniqueID) {
		if (this.state.transmitting) {
			if (update) {
				this.addNotification("Hold on..", "Transmission in progress.. Please wait.", "info");
			}
			return;
		}
		// send command to thing
		if (update) {
			this.Transmit({uniqueID: uniqueID, id: this.state.thingID, index: index, action: "gpio", value: value, port: this.state.ports[index].id});
		}
		let ports = this.state.ports;
		ports[index].newValue = value;
		this.setState({ports: ports});
	}
	
	Switch(props) {
		let changeToValue = (props.port.value === 1) ? 0 : 1;
		return (
			<label htmlFor="material-switch">
				<Switch
					disabled={(props.port.mode === 0 || this.state.loader === props.uniqueID)}
					checked={(props.port.value === 1)}
					onChange={() => this.ChangePort(props.i,changeToValue,true,props.uniqueID)}
					onColor="#4fbad4"
					onHandleColor="#3c96aa"
					handleDiameter={25}
					uncheckedIcon={
						<div style={{display: "flex",justifyContent: "center",alignItems: "center",height: "100%",fontSize: 18,color: "white"}}>0</div>
					}
					checkedIcon={
						<div style={{display: "flex",justifyContent: "center",alignItems: "center",height: "100%",fontSize: 18,color: "white"}}>1</div>
					}
					boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
					activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
					height={15}
					width={50}
					className="react-switch"
					id="material-switch"
				/>
			</label>
		);
	}
	
	Slider(props) {
		return (
			<div>
				<Row>
					<Col>
						<Slider
							min={0} 
							max={(props.port.mode === 1) ? 255 : 1023}
							disabled={(props.port.mode === 0 || this.state.loader === props.uniqueID)}
							defaultValue={parseInt(props.port.value)}
							onAfterChange={(value) => this.ChangePort(props.i,value,true,props.uniqueID)}
							onChange={(value) => this.ChangePort(props.i,value,false,props.uniqueID)}
						/>
					</Col>
				</Row>
				<Row>
					<Col className="text-center">
						<h5 style={{marginBottom: "0px", color: props.color}}>{(props.port.newValue === undefined) ? props.port.value : props.port.newValue}</h5>
					</Col>
				</Row>
			</div>
		);
	}
	
	/* Variables */
	
	Variables() {
		if (this.state.variables) {
			return this.state.variables.map((variable, i) => {				
				return (
					<this.Element key={i} uniqueID={variable.id} element="variable" elementDataType={variable.type} icon={faSquareRootAlt} color="#f9bb5c" name={variable.id} type={variable.type + " variable"}>
						<InputGroup>
							<FormControl onChange={(e) => this.ChangeVariable(i, e.target.value)} type={(variable.type === "int" || variable.type === "float") ? "number" : "text"} placeholder={variable.value} />
							<InputGroup.Append>
								<Button className="variableButton" disabled={(this.state.loader === variable.id)} onClick={() => this.Transmit({index: i, uniqueID: variable.id, id: this.state.thingID, action: "variable", type: variable.type, value: this.state.variables[i].newValue, variable: variable.id})}><FontAwesomeIcon icon={faUpload}/></Button>
							</InputGroup.Append>
						</InputGroup>
					</this.Element>
				)
			});
		}
		else {
			return (
				null
			);
		}
	}
	
	ChangeVariable(id, value) {
		if (this.state.transmitting) {
			this.addNotification("Hold on..", "Transmission in progress.. Please wait.", "info");
			return;
		}
		let variables = this.state.variables;
		variables[id].newValue = value;
		this.setState({variables: variables});
	}
	
	/* Functions */
	
	Functions() {
		if (this.state.functions) {
			return this.state.functions.map((Function, i) => {
				return (
					<this.Element key={i} uniqueID={Function.id} element="function" icon={faCode} color="#67cc93" name={Function.id} type="Function">
						<Button size="sm" disabled={(this.state.loader === Function.id)} className="functionButton" block type="button" onClick={() => this.fireFunction(i, Function.id)}>RUN</Button>
					</this.Element>
				)
			});
		}
		else {
			return (
				null
			);
		}
	}
	
	fireFunction(index,uniqueID ) {
		if (this.state.transmitting) {
			this.addNotification("Hold on..", "Transmission in progress.. Please wait.", "info");
			return;
		}
		// temporary array for changes
		let _functions = this.state.functions;
		// disable toggle until we get a response
		this.setState({functions: _functions});
		// send command to thing
		this.Transmit({id: this.state.thingID, action: "function", value: _functions[index].id, uniqueID: uniqueID, index: index});
	}
	
	/* Thing Info Bar */
	
	Summary() {
		return (
			<Row className="summary">
				<div className="icon d-none d-md-inline-block">{(this.state.transmitting) ? loader : <FontAwesomeIcon size="2x" icon={faMicrochip}/>}</div>
				<Col>
					<Row>
						<Col>
							<Dropdown>
								<Dropdown.Toggle variant="link" className="text-dark dropdownButton">
									<h4 className="d-inline-block">{this.state.name} <FontAwesomeIcon icon={faAngleDown}/></h4>
								</Dropdown.Toggle>
									<Dropdown.Menu>
									<Dropdown.Item href="#" onClick={() => this.setState({tokenModal: true})}>Get Token</Dropdown.Item>
									<Dropdown.Item hidden={this.state.access !== 2} href="#" onClick={() => this.setState({renameModal: true})}>Rename</Dropdown.Item>
									<Dropdown.Item disabled={this.state.transmitting} href="#" onClick={() => this.Transmit({uniqueID: null, id: this.state.thingID, action: "reboot"})}>Reboot</Dropdown.Item>
									<Dropdown.Item hidden={this.state.access !== 2} href="#" onClick={() => this.Delete()}>Delete</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</Col>
					</Row>
					<Row style={{marginTop: "-10px"}}>
						<ReactTooltip place="bottom" />
						<Col>
							<span data-tip="Status"><FontAwesomeIcon color={(this.state.status === 1) ? "#67cc93" : "#de4b39"} icon={faPowerOff}/> {(this.state.status === 1) ? "Connected" : "Disconnected"}</span>
							<span hidden={this.state.lastActivity === "N/A"} data-tip="Last activitiy"><FontAwesomeIcon icon={faClock}/> {this.state.lastActivity}</span>
							<span hidden={this.state.ip === undefined} data-tip="IP address"><FontAwesomeIcon icon={faGlobe}/> {this.state.ip}</span>
							<span hidden={this.state.version === undefined} data-tip="Firmware version"><FontAwesomeIcon icon={faCodeBranch}/> {this.state.version}</span>
							<span data-tip="Board type"><FontAwesomeIcon icon={faMicrochip}/> {this.state.board}</span>
						</Col>
					</Row>
				</Col>
			</Row>
		);
	}
	
	/* Change Thing's name */
	
	SubmitName() {
		this.setState({callback: "", clicked: true});
		let data = {
			"name": this.state.newName,
			"id": this.state.thingID
		};
		fetch(API_URL + "thing/edit.php", {credentials: 'include', method: "POST", body: JSON.stringify(data)})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200) {
					window.location.reload();
				}
				else {
					this.setState({callback: result.data, clicked: false});
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	renameModal(props) {
		return (
		  <Modal {...props} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
			<Modal.Header closeButton>
			  <Modal.Title id="contained-modal-title-vcenter">Edit Thing Name</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<Form onSubmit={() => this.SubmitName(this.state.notificationID)}>
					<Form.Group>
						<Form.Label>Thing Name</Form.Label>
						<Form.Control type="text" onChange={(e) => {this.setState({newName: e.target.value})}} placeholder={"New name for " + this.state.name} />
					</Form.Group>
				</Form>
			</Modal.Body>
			<Modal.Footer>
				<div className="text-danger">{this.state.callback}</div>
				<Button disabled={this.state.clicked} onClick={this.SubmitName} variant="success">Change</Button>
				<Button onClick={props.onHide} variant="secondary">Close</Button>
			</Modal.Footer>
		  </Modal>
		);
	}
	
	/* Delete Thing operation */
	
	Delete() {
		confirmAlert({
			title: 'Confirm to Delete',
			message: 'Are you sure you want to delete this Thing? This action cannot be undone!',
			buttons: [
			{
				label: 'Yes',
				onClick: () => {
					this.setState({transmitting: true});
					fetch(API_URL + "thing/delete.php", {credentials: 'include', method: "POST", body: JSON.stringify({"id": this.state.thingID})})
					.then(res => res.json())
					.then(
					   (result) => {
							if (result.response === 200) {
								this.setState({redirect: "/Dashboard"});
							}
							else {
								this.setState({transmitting: false});
								this.addNotification("Error", result.data, "danger");
							}
					   },
					   (error) => {
							console.log(error);
					   }
					)
				}
			},
			{
			  label: 'No'
			}
		  ]
		})
	}
	
	/* View Thing's Token */
	
	tokenModal(props) {
		
		const token = this.state.thingID + "/" + this.state.password;
		
		const copyToken = () => {
			copy(token, {
				debug: true,
				message: 'Press #{key} to copy',
			});
			this.setState({tokenCopied: true});
		}
		
		return (
		  <Modal {...props} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
			<Modal.Header closeButton>
			  <Modal.Title id="contained-modal-title-vcenter">Access Token</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<Form.Group>
					<Form.Label>Insert your access token in your sketch</Form.Label>
					<Form.Control type="text" disabled value={token} />
				</Form.Group>
			</Modal.Body>
			<Modal.Footer>
				<Button className="mr-auto" onClick={copyToken} variant="success">{(!this.state.tokenCopied) ? "Copy To Clipboard" : "Token Copied!"}</Button>
				<Button onClick={props.onHide} variant="secondary">Close</Button>
			</Modal.Footer>
		  </Modal>
		);
	}
	
	render() {
		if (this.state.redirect !== "") {
			return (<Redirect to={this.state.redirect} />);
		}
		else {
			return (
				<div id="overview">
					<ReactNotification ref={this.notificationDOMRef} />
					<this.renameModal show={this.state.renameModal} onHide={() => this.setState({ renameModal: false })}/>
					<this.tokenModal show={this.state.tokenModal} onHide={() => this.setState({ tokenModal: false })}/>
					<this.elementModal show={this.state.elementModal} onHide={() => this.setState({ elementModal: false })}/>
					<this.Summary />
					
					<Row hidden={this.state.ports === undefined && this.state.variables === undefined && this.state.functions === undefined}>
						<this.Ports />
						<this.Variables />
						<this.Functions />
					</Row>
					
					<Row className="block" hidden={this.state.ports !== undefined || this.state.variables !== undefined || this.state.functions !== undefined}>
						<h3>Overview</h3>
						<p className="description">Seems like you still don't have any elemets attach to your thing. Elements are ports, variables and functions that you attach from your thing to this Platform where you can control them, monitor them and set up custom notifications for certain events. Learn how to do that in the <a href="/Learn">Learning Section</a>.</p>
					</Row>
					
				</div>
			);
		}
	}
}

export default Overview