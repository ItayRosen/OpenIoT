import React, {Component} from 'react';
import {API_URL} from '../../constants/constants.js';

//Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Form from 'react-bootstrap/Form';

//Fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

class Notifications extends Component {
	
	  constructor(props) {
		super(props);
		
		this.state = {
			thingID: props.thing.thingID,
			notifications: 0,
			modal: false,
			callback: "",
			clicked: false,
			name: "",
			trigger: "RESTART",
			triggerValue: "",
			triggerOperation: "changed",
			triggerOperationValue: "",
			action: "email",
			actionValue: "",
			notificationID: 0,
			ports: props.thing.ports,
			variables: props.thing.variables
		};
		
		this.Notifications = this.Notifications.bind(this);		
		this.Modal = this.Modal.bind(this);		
		this.Submit = this.Submit.bind(this);	
		this.Ports = this.Ports.bind(this);	
		this.Variables = this.Variables.bind(this);	
	  }
	  
	  componentWillMount() {
		//fetch notifications
		fetch(API_URL + "notification/read.php", {credentials: 'include', method: "POST", body: JSON.stringify({"thingID": this.state.thingID})})
		.then(res => res.json())
		.then(
		   (result) => {
			   console.log(result.data);
				if (result.response === 200) {
					this.setState({ 
						notifications: result.data,
					});
				}
				else {
					this.setState({ 
						notifications: -1,
					});
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	  }
	  
	Ports() {
		if (this.state.trigger !== "GPIO") {
			return (null);
		}
		else if (this.state.ports === null) {
			return (
				<p>You don't have any ports attached</p>
			);
		}
		else {
			const ports = this.state.ports.map((port, i) => 
				<option value={port.name} key={i}>{port.name}</option>
			);
			return (
				<Form.Control defaultValue={this.state.triggerValue} onChange={(e) => {this.setState({triggerValue: e.target.value})}} as="select">					
					{ports}
				</Form.Control>
			);
		}
	}
	  
	Variables() {
		if (this.state.trigger !== "VARIABLE") {
			return (null);
		}
		else if (this.state.variables === null) {
			return (
				<p>You don't have any variables attached</p>
			);
		}
		else {
			const variables = this.state.variables.map((variable, i) => 
				<option value={variable.id} key={i}>{variable.id}</option>
			);
			return (
				<Row>
					<Col>
						<Form.Control defaultValue={this.state.triggerValue} onChange={(e) => {this.setState({triggerValue: e.target.value})}} as="select">					
							{variables}
						</Form.Control>
					</Col>
					<Col>
						<Form.Control defaultValue={this.state.triggerOperation} onChange={(e) => {this.setState({triggerOperation: e.target.value})}} as="select">					
							<option value=">">{"<"}</option>
							<option value="<">{"<"}</option>
							<option value="=">=</option>
							<option value="changed">Changed</option>
						</Form.Control>
					</Col>
					<Col hidden={this.state.triggerOperation === "changed"}>
						<Form.Control defaultValue={this.state.triggerOperationValue} type="text" onChange={(e) => {this.setState({triggerOperationValue: e.target.value})}} />
					</Col>
				</Row>
			);
		}
	}
	  
	
	Submit(id) {
		this.setState({callback: "", clicked: true});
		let data = {
			"name": this.state.name,
			"trigger": this.state.trigger,
			"triggerValue": this.state.triggerValue,
			"triggerOperation": this.state.triggerOperation,
			"triggerOperationValue": this.state.triggerOperationValue,
			"action": this.state.action,
			"actionValue": this.state.actionValue,
			"thingID": this.state.thingID,
			"id": id,
		};
		fetch(API_URL + "notification/new.php", {credentials: 'include', method: "POST", body: JSON.stringify(data)})
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
	
	Delete(id) {
		this.setState({clicked: true});
		fetch(API_URL + "notification/delete.php", {credentials: 'include', method: "POST", body: JSON.stringify({thingID: this.state.thingID, id: id})})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200) {
					window.location.reload();
				}
				else {
					alert(result.data);
					this.setState({false: true});
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	SwitchTrigger(value) {
		switch (value) {
			case "GPIO":
			this.setState({trigger: value, triggerValue: this.state.ports[0].id});
			break;
			
			case "VARIABLE":
			this.setState({trigger: value, triggerValue: this.state.variables[0].id});
			break
			
			default:
			this.setState({trigger: value});
		}
	}
	
	Modal(props) {		
		return (
		  <Modal {...props} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
			<Modal.Header closeButton>
			  <Modal.Title id="contained-modal-title-vcenter">
				{(this.state.notificationID === 0) ? "New Notification" : "Edit Notification"}
			  </Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<p>To add a notification for a component change (change in GPIO / variable), you need to see them on the Overview first.</p>
				<Form onSubmit={() => this.Submit(this.state.notificationID)}>
					<Form.Group>
						<Form.Label>Notification Name</Form.Label>
						<Form.Control defaultValue={this.state.name} type="text" onChange={(e) => {this.setState({name: e.target.value})}} placeholder="Name this notification so you can recognize it later.." />
					</Form.Group>
					<Form.Group>
						<Form.Label>Trigger</Form.Label>
						<Row>
							<Col>
								<Form.Control defaultValue={this.state.trigger} onChange={(e) => {this.SwitchTrigger(e.target.value)}} as="select">
									<option value="RESTART">Thing restarted</option>
									<option value="GPIO">Port state changed</option>
									<option value="VARIABLE">Variable changed</option>
									<option value="OFFLINE">Thing is offline</option>
									<option value="ONLINE">Thing is online</option>
								</Form.Control>
							</Col>
							<Col>
								<this.Ports/>
								<this.Variables/>
							</Col>
						</Row>
					</Form.Group>
					<Form.Group>
						<Form.Label>Action</Form.Label>
						<Row>
							<Col>
								<Form.Control defaultValue={this.state.action} onChange={(e) => {this.setState({action: e.target.value})}} as="select">
									<option value="email">Email</option>
									<option value="webhook">Webhook</option>
								</Form.Control>
							</Col>
							<Col hidden={this.state.action !== "email"}><Form.Control defaultValue={this.state.actionValue} type="email" onChange={(e) => {this.setState({actionValue: e.target.value});}} placeholder="Email address" /></Col>
							<Col hidden={this.state.action !== "sms"}><Form.Control defaultValue={this.state.actionValue} type="number" onChange={(e) => {this.setState({actionValue: e.target.value})}} placeholder="Phone number" /></Col>
							<Col hidden={this.state.action !== "webhook"}><Form.Control defaultValue={this.state.actionValue} type="url" onChange={(e) => {this.setState({actionValue: e.target.value})}} placeholder="Webhook URL (HTTPS only)" /></Col>
						</Row>
					</Form.Group>
				</Form>
			</Modal.Body>
			<Modal.Footer>
				<Button hidden={this.state.notificationID === 0} disabled={this.state.clicked} className="mr-auto" onClick={() => {this.Delete(this.state.notificationID)}} variant="danger">Delete</Button>
				<div className="text-danger">{this.state.callback}</div>
				<Button disabled={this.state.clicked} onClick={() => {this.Submit(this.state.notificationID)}} variant="success">Done</Button>
				<Button onClick={props.onHide} variant="secondary">Close</Button>
			</Modal.Footer>
		  </Modal>
		);
	}
	
	render() {
		return (
			<div className="box" id="notifications">
				<this.Modal show={this.state.modal} onHide={() => this.setState({ modal: false })}/>
				<Row>
					<Col>
						<h3>Notifications</h3>
					</Col>
					<Col>
					  <ButtonToolbar className="float-right">
						<Button variant="success" onClick={() => this.setState({ modal: true, notificationID: 0, triggerOperation: "changed", trigger: "RESTART", name: "", action: "email", actionValue: "", triggerValue: "" })}><FontAwesomeIcon icon={faPlus}/> New</Button>
					  </ButtonToolbar>
					</Col>
				</Row>
				<Row>
					<Col><p className="description">In this section you can add custom notifications for specific events that happen with your Thing.</p></Col>
				</Row>
				<Row>
					<Table>
						<thead>
							<tr>
								<th>Name</th>
								<th>Trigger</th>
								<th>Action</th>
								<th>Last Fired</th>
							</tr>
						</thead>
						<tbody>
							<this.Notifications />
						</tbody>
					</Table>
					{
						(this.state.notifications === 0) ? <p>Loading...</p> : ""
					}
				</Row>
			</div>
		);
	}
	
	Notifications() {
		if (this.state.notifications !== 0 && this.state.notifications !== -1) {
			return this.state.notifications.map((notification, i) => {
				return (
					<tr key={i}>
						<td className="tdHref">
							<Button variant="link" className="name" onClick={() => this.setState({triggerOperation: notification.triggerOperation, triggerOperationValue: notification.triggerOperationValue, triggerValue: notification.triggerValue, notificationID: notification.id, modal: true, trigger: notification.trigger, name: notification.name, actionValue: notification.actionValue, action: notification.action })} href="#">{notification.name}</Button>
						</td>
						<td>{notification.trigger}</td>
						<td>{notification.action}</td>
						<td>{notification.lastActivity}</td>
					</tr>
				)
			});
		}
		else {
			return (
				<tr></tr>
			);
		}
	}
}

export default Notifications