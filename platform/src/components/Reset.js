import React, {Component} from 'react';
import {API_URL} from '../constants/constants.js';
import { Redirect } from "react-router-dom";
import Loader from './Loader.js'

//Bootstrap
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

//Fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrochip } from '@fortawesome/free-solid-svg-icons'

class Reset extends Component {	

	  constructor(props) {
		super(props);
		
		this.state = {
			callback: "",
			password: "",
			redirect: "",
			processing: false,
			clicked: false,
			authenticated: 0,
			token: props.match.params.token,
			userID: props.match.params.userID
		};
		
		this.Submit = this.Submit.bind(this);
		this.inputChanged = this.inputChanged.bind(this);
	  }
	  
	componentWillMount() {
		fetch(API_URL + "user/verifyResetToken.php", {credentials: 'include', method: "POST", body: JSON.stringify({token: this.state.token, userID: this.state.userID})})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200)
				{
					this.setState({ authenticated: 1});
				}
				else {
					alert(result.data);
					this.setState({authenticated: -1, redirect: "/Login"});
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	Submit(e) {
		e.preventDefault();
		this.setState({callback: "", clicked: true});
		fetch(API_URL + "user/reset.php", {credentials: 'include', method: "POST", body: JSON.stringify({password: this.state.password, userID: this.state.userID, token: this.state.token})})
			.then(res => res.json())
			.then(
			(result) => {
				if (result.response === 200 || result.response === 409)
				{
					this.setState({redirect: "/Login"});
				}
				else
				{
					this.setState({callback: result.data, clicked: false});
				}
			},
			(error) => {
				console.log(error);
				this.setState({forgotCallback: "An error occurred. Please try again later", clicked: false});
			}
		)
	}
	
	inputChanged(event) {
		this.setState({[event.target.name]: event.target.value});
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
			<Container id="reset">
				<Row><Col><center><FontAwesomeIcon icon={faMicrochip} size="4x" color="#DE4C39"/></center></Col></Row>
				<Row>
					<Col className="box" lg={{ span: 4, offset: 4 }} md={{ span: 5, offset: 4 }} sm={{ span: 8, offset: 2 }} xs={{ span: 10, offset: 1 }}>
						<center><h3>Reset Password</h3></center>
						<Form onSubmit={this.Submit} style={{marginBottom: "30px"}}>
							<Form.Control name="password" onChange={this.inputChanged} type="password" placeholder="New Password" />
							<Button disabled={this.clicked} variant="danger" block style={{marginTop:"15px"}} type="button" onClick={this.Submit}>Reset</Button>
							<Row className="justify-content-center text-danger" style={{height:"20px"}}>{this.state.callback}</Row>
						</Form>
					</Col>
				</Row>
			</Container>
			);
		}
	}
}
export default Reset