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
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//import { faCheck, faTrash } from '@fortawesome/free-solid-svg-icons'

class Account extends Component {

	  constructor(props) {
		super(props);
		
		this.state = {
			authenticated: 0,
			password: "",
			callback: "",
			clicked: false,
			callbackStatus: false,
			redirect: "",
			email: "",
			token: ""
		};
		
		this.Submit = this.Submit.bind(this);	
		this.inputChanged = this.inputChanged.bind(this);	
		this.GenerateToken = this.GenerateToken.bind(this);	
	  }
	  
	componentWillMount() {
		document.title = "Account - " + Website_Name;
		//authenticate
		fetch(API_URL + "user/read.php", {credentials: 'include'})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200) {
					this.setState({ authenticated: 1, email: result.data.email, token: result.data.token});					
				}
				else {
					this.setState({authenticated: -1, redirect: "/Login" });
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	//text change listener
	inputChanged(e) {
		this.setState({[e.target.name]: e.target.value});
	}
	
	//change password
	Submit(e) {
		e.preventDefault();
		this.setState({callback: "", clicked: true});
		fetch(API_URL + "user/update.php", {credentials: 'include', method: "POST", body: JSON.stringify({password: this.state.password})})
		.then(res => res.json())
		.then(
		   (result) => {
			   console.log(result);
				if (result.response === 200) {
					this.setState({callback: result.data, clicked: false, callbackStatus: true, password: ""});
				}
				else {
					this.setState({callback: result.data, clicked: false, callbackStatus: false});
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	//generate api token
	GenerateToken(e) {
		e.preventDefault();
		this.setState({clicked: true});
		fetch(API_URL + "user/generateToken.php", {credentials: 'include', method: "GET"})
		.then(res => res.json())
		.then(
		   (result) => {
			   console.log(result);
				if (result.response === 200) {
					this.setState({token: result.data, clicked: false});
				}
				else {
					this.setState({clicked: false, callbackStatus: false});
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}

	render() {
		if (this.state.authenticated === 0) {
			return (<Loader/>);
		}
		else if (this.state.redirect !== "") {
			return (
				<Redirect to={this.state.redirect} />
			);
		}
		else {
			return (
				<div id="account">
					<Header email={this.state.email} name="Account Settings"/>
					
					<div className="content">
						<Container>
							<Row>
								<Col>
									<div className="box">
										<h3>Change Account's Settings</h3>
										<p>To change your email address, please contact us via support.</p>
										<Form onSubmit={this.Submit}>
											<Form.Group>
												<Form.Label>Email Address</Form.Label>
												<Form.Control type="email" value={this.state.email} disabled />
											</Form.Group>
											<Form.Group>
												<Form.Label>New Password</Form.Label>
												<Form.Control value={this.state.password} name="password" type="password" onChange={this.inputChanged} />
												<Form.Text className="text-muted">Please choose a strong password</Form.Text>
											</Form.Group>
											<Button disabled={this.state.clicked} className="submit" block variant="success" onClick={this.Submit}>Done</Button>
											<p style={{color: (this.state.callbackStatus) ? "green" : "red"}}>{this.state.callback}</p>
										</Form>
									</div>
								</Col>
								<Col>
									<div className="box">
										<h3>API Token</h3>
										<p>Keep this token private. You can use it to programmatically communicate with your Things. <a href="API">Learn how</a>.</p>
										<Form onSubmit={this.GenerateToken}>
											<Form.Group>
												<Form.Label>Token</Form.Label>
												<Form.Control name="token" type="text" value={this.state.token} disabled onChange={this.inputChanged} />
											</Form.Group>
											<Button disabled={this.state.clicked} className="submit" block variant="info" onClick={this.GenerateToken}>Re-Generate</Button>
										</Form>
									</div>
								</Col>
							</Row>
						</Container>
					</div>
				</div>
			);
		}
	}
}

export default Account