import React, {Component} from 'react';
import {API_URL,GOOGLE_APP_ID,FACEBOOK_APP_ID,Website_Name} from '../constants/constants.js';
import { Redirect } from "react-router-dom";
import SocialButton from './SocialButton.js'
import Loader from './Loader.js'
import logo from '../img/logo.png'

//Bootstrap
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

//Fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faGoogle } from '@fortawesome/free-brands-svg-icons'

class Login extends Component {	

	  constructor(props) {
		super(props);
		
		this.state = {
			callback: "",
			email: "",
			password: "",
			redirect: "",
			action: "",
			error: "",
			processing: false,
			authenticated: 0
		};
		
		this.Submit = this.Submit.bind(this);
		this.socialSubmit = this.socialSubmit.bind(this);
		this.inputChanged = this.inputChanged.bind(this);
	  }
	  
	componentWillMount() {
		document.title = "Register - " + Website_Name;
		fetch(API_URL + "user/authenticate.php", {credentials: 'include'})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200)
				{
					this.setState({ redirect: "/Dashboard", authenticated: -1});
				}
				else {
					this.setState({authenticated: 1});
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	FacebookLogin() {
		
	}
	
	GoogleLogIn() {
		
	}
	
	inputChanged(event) {
		this.setState({[event.target.name]: event.target.value});
	}
	
	Submit(e) {
		e.preventDefault();
		this.setState({error: "", callback: "", processing: true});
		fetch(API_URL + "user/register.php", {credentials: 'include', method: "POST", body: JSON.stringify({email: this.state.email, password: this.state.password})})
			.then(res => res.json())
			.then(
			(result) => {
				if (result.response === 200 || result.response === 409)
				{
					this.setState({redirect: "./newThing"});
				}
				else
				{
					this.setState({callback: result.data.text, error: result.data.field, processing: false});
				}
			},
			(error) => {
				console.log(error);
				this.setState({callback: "An error occurred. Please try again later", processing: false});
			}
		)
	}
	
	socialSubmit(user) {
		this.setState({callback: "", processing: true});
		let provider = user._provider;
		let token = (provider === "google") ? user._token.idToken : user._token.accessToken;
		fetch(API_URL + "user/socialLogin.php", {credentials: 'include', method: "POST", body: JSON.stringify({provider: provider, idToken: token})})
			.then(res => res.json())
			.then(
			(result) => {
				if (result.response === 200 || result.response === 409)
				{
					this.setState({redirect: "./newThing"});
				}
				else
				{
					this.setState({callback: result.data, processing: false});
				}
			},
			(error) => {
				console.log(error);
				this.setState({callback: "An error occurred. Please try again later", processing: false});
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
			<Container id="login">
				<Row><Col><center><img src={logo} alt="logo" style={{marginTop: "20px", marginBottom: "20px", width: "150px"}}/></center></Col></Row>
				<Row>
					<Col className="box" lg={{ span: 4, offset: 4 }} md={{ span: 5, offset: 4 }} sm={{ span: 8, offset: 2 }} xs={{ span: 10, offset: 1 }}>
						<div className="d-flex flex-column" style={{height: "100%"}}>
							<div className="p-1 align-self-center">
								<h3 style={{color: "#DE4C39"}}>Create an Account</h3>
							</div>
							<div className="p-2">
								<Form onSubmit={(e) => this.Submit(e)} style={{marginBottom: "30px"}}>
									<Form.Control name="email" style={(this.state.error === "email") ? {border: "1px solid red"} : {}} onChange={this.inputChanged} type="email" placeholder="Email" />
									<Form.Control name="password" style={(this.state.error === "password") ? {border: "1px solid red"} : {}} onChange={this.inputChanged} type="password" placeholder="Password" />
									<Button disabled={this.state.processing} block style={{marginTop: "10px", background: "#DE4C39", border: "#DE4C39"}} type="button" onClick={(e) => this.Submit(e)}>Register</Button>
									<div className="justify-content-center text-danger" style={{height:"20px"}}>{this.state.callback}</div>
									<Row style={{marginTop: "20px"}}>
										<div style={{width: "33%"}}><hr/></div>
										<div style={{width: "33%"}}><center>OR USE</center></div>
										<div style={{width: "33%"}}><hr/></div>
									</Row>
									<Row>
									<hr/>
									<Col><SocialButton disabled={this.state.processing} provider='facebook' appId={FACEBOOK_APP_ID} onLoginSuccess={this.socialSubmit} onLoginFailure={() => {this.setState({callback: "Could not log in with Facebook", processing: false})}} size="sm" variant="primary"><FontAwesomeIcon icon={faFacebookF}/> Facebook</SocialButton></Col>
									<Col><SocialButton disabled={this.state.processing} provider='google' appId={GOOGLE_APP_ID} onLoginSuccess={this.socialSubmit} onLoginFailure={() => {this.setState({callback: "Could not log in with Google", processing: false})}} size="sm" variant="danger"><FontAwesomeIcon icon={faGoogle}/> Google</SocialButton></Col>
									</Row>
								</Form>
							</div>
						</div>
						<div className="footer"><center><a href="/Login">I already have an account</a></center></div>
					</Col>
				</Row>
			</Container>
			);
		}
	}
}
export default Login