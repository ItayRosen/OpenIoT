import React, {Component} from 'react';
import {API_URL} from '../../constants/constants.js';

//Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

//Fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus,faTrash } from '@fortawesome/free-solid-svg-icons'

class AccessControl extends Component {
	  constructor(props) {
		super(props);
		
		this.state = {
			thingID: props.thing.thingID,
			thingName: props.thing.thingName,
			users: 0,
			modal: false,
			callback: "",
			clicked: false,
			email: "",
			permission: 1,
			access: props.thing.access,
			url: props.thing.url
		};
		
		this.Users = this.Users.bind(this);			
		this.Submit = this.Submit.bind(this);			
		this.Modal = this.Modal.bind(this);			
	  }
	  
	  componentWillMount() {
		fetch(API_URL + "accessControl/read.php", {credentials: 'include', method: "POST", body: JSON.stringify({"thingID": this.state.thingID})})
		.then(res => res.json())
		.then(
		   (result) => {
			   console.log(result);
				if (result.response === 200) {
					this.setState({ 
						users: result.data,
					});
				}
				else {
					this.setState({ 
						users: -1,
					});
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
		//open modal from title
		if (this.state.url.indexOf("new") !== -1) {
			this.setState({modal: true});
		}
	  }
	  
	//share access modal
	Modal(props) {		
		return (
		  <Modal {...props} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
			<Modal.Header closeButton>
			  <Modal.Title id="contained-modal-title-vcenter">
				Share access to {this.state.thingName}
			  </Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<Form onSubmit={() => this.Submit}>
					<Form.Group>
						<Form.Label>Email Address</Form.Label>
						<Form.Control type="text" onChange={(e) => {this.setState({email: e.target.value})}} placeholder="User's email address" />
					</Form.Group>
					<Form.Group>
						<Form.Label>Permissions</Form.Label>
						<Row>
							<Col>
								<Form.Control defaultValue={this.state.permission} onChange={(e) => {this.setState({permission: e.target.value})}} as="select">
									<option value="1">Regular Access</option>
									<option value="2">Full Access</option>
								</Form.Control>
							</Col>
						</Row>
					</Form.Group>
				</Form>
			</Modal.Body>
			<Modal.Footer>
				<div className="text-danger">{this.state.callback}</div>
				<Button disabled={this.state.clicked} onClick={() => {this.Submit()}} variant="success">Done</Button>
				<Button onClick={props.onHide} variant="secondary">Close</Button>
			</Modal.Footer>
		  </Modal>
		);
	}
	  
	  //remove access
	  Remove(id) {
		fetch(API_URL + "accessControl/remove.php", {credentials: 'include', method: "POST", body: JSON.stringify({"thingID": this.state.thingID, "id": id})})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200) {
					this.setState({ 
						users: this.state.users.splice(id, 1),
					});
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
	  
	  //submit share access form 
	  Submit() {
		 this.setState({clicked: true, callback: ""});
		fetch(API_URL + "accessControl/new.php", {credentials: 'include', method: "POST", body: JSON.stringify({"thingID": this.state.thingID, "email": this.state.email, "permission": this.state.permission})})
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
	  
	  //list shared access items (users)
	  Users() {
		if (this.state.users === 0) {
			return "Loading.."
		}
		else if (this.state.users === -1) {
			return "No shared access"
		}
		else {
			return this.state.users.map((user, i) => {
				return (
					<Row className="user" key={i}>
						<Col xs={{span: 5}} xl={{span: 3}}>{user.email}</Col>
						<Col>{user.rank}</Col>
						<Col hidden={this.state.access < 2}><Button size="sm" variant="danger" className="float-right" onClick={() => this.Remove(i)}><FontAwesomeIcon icon={faTrash}/></Button></Col>
					</Row>
				)
			});
		}
	 }
	
	render() {
		return (
			<div className="box" id="accessControl">
				<this.Modal show={this.state.modal} onHide={() => this.setState({ modal: false })}/>
				<Row>
					<Col>
						<h3>Access Control</h3>
					</Col>
					<Col hidden={this.state.access < 2}>
						<Button variant="success" className="float-right" onClick={() => {this.setState({modal: true})}}><FontAwesomeIcon icon={faPlus}/> New</Button>
					</Col>
				</Row>
				<Row>
					<p className="description">Here you can manage the access control to your thing. You can share it with other users by clicking the New button.</p>
				</Row>
				<this.Users />
			</div>
		);
	}
}

export default AccessControl