// componenets
import React, {Component} from 'react'
import {API_URL,Website_Name} from '../constants/constants.js'
import Header from './Header.js'
import Notifications from './Thing/Notifications.js'
import Activity from './Thing/Activity.js'
import Overview from './Thing/Overview.js'
import IDE from './Thing/IDE.js'
import AccessControl from './Thing/AccessControl.js'
import Loader from './Loader.js'
import { Route, Link, Redirect } from "react-router-dom"


// Bootstrap
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

// Fontawesome
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//import { faAngleDown } from '@fortawesome/free-solid-svg-icons'

class Thing extends Component {

	  constructor(props) {
		super(props);
		
		this.state = {
			authenticated: 0, 
			name: "", 
			board: "", 
			ip: "", 
			thingID: props.match.params.id, 
			authenticateThing: 0, 
			status: 0, 
			lastActivity: "", 
			createdTime: 0, 
			redirect: "",
			access: 0,
			url: this.props.location.search,
			ports: 0,
			variables: 0,
			functions: 0,
			password: "",
			email: ""
		};
		
		this.LoadThing = this.LoadThing.bind(this);				
	  }
	  
	componentWillMount() {
		document.title = "Thing - " + Website_Name;
		//authenticate
		fetch(API_URL + "user/read.php", {credentials: 'include'})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200) {
					this.setState({authenticated: 1, email: result.data.email});
					this.LoadThing();
				}
				else {
					this.setState({ authenticated: -1 });
				}
		   },
		   (error) => {
				alert("Connection failed. Please reload.");
				console.log(error);
		   }
		)
	}
	
	LoadThing() {
		fetch(API_URL + "thing/read.php", {credentials: 'include', method: "POST", body: JSON.stringify({"id": this.state.thingID})})
		.then(res => res.json())
		.then(
		   (result) => {
			   console.log(result);
				if (result.response === 200) {
					this.setState({ 
						authenticateThing: 1,
						name: result.data.name, 
						ip: result.data.ip, 
						board: result.data.board,
						access: result.data.access,
						status: result.data.status,
						lastActivity: result.data.lastActivity,
						createdTime: result.data.createdTime,
						ports: result.data.ports,
						variables: result.data.variables,
						functions: result.data.functions,
						password: result.data.password,
					});
				}
				else {
					this.setState({ authenticateThing: -1 });
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	menuLink = ({isExact, to, label, hide}) => (
	  <Route path={to} exact={isExact} children={({ match }) => (
		<Link hidden={hide} className={match ? "selected" : ""} to={to}>{label}</Link>
		)}
	  />
	);
	
	render() {
		if (this.state.authenticated === 0 || (this.state.authenticated === 1 && this.state.authenticateThing === 0)) {
			return (<Loader/>);
		}
		else if (this.state.authenticated === 1 && this.state.authenticateThing === 1) {
			if (this.state.redirect === "") {
			return (	
					<div id="thing">
						<Header email={this.state.email} name="Thing"/>
						<Row className="secondaryNavBar">
							<Col className="menu align-text-bottom">
								<this.menuLink to={this.props.match.url} label="Overview" isExact={true}/>
								<this.menuLink to={`${this.props.match.url}/Notifications`} label="Notifications"/>
								<this.menuLink hide={this.state.access !== 2} to={`${this.props.match.url}/AccessControl`} label="Share"/>
								<this.menuLink to={`${this.props.match.url}/IDE`} label="OTA"/>
								<this.menuLink to={`${this.props.match.url}/Activity`} label="Activity"/>
							</Col>
						</Row>
						<div className="content">
							<Container>
								<Row>
									<Col>
										<Route exact path={this.props.match.url} render={(props) => <Overview thing={this.state}/> } />
										<Route path={`${this.props.match.url}/Notifications`} render={(props) => <Notifications thing={this.state} /> } />
										<Route path={`${this.props.match.url}/AccessControl`} render={(props) => <AccessControl thing={this.state} /> }/>
										<Route path={`${this.props.match.url}/IDE`} render={(props) => <IDE thing={this.state} /> } />
										<Route path={`${this.props.match.url}/Activity`} render={(props) => <Activity thingID={this.state.thingID} /> } />
									</Col>
								</Row>
							</Container>
						</div>
					</div>
				);
			}
			else {
				return (
					<Redirect to={this.state.redirect} />
				);
			}
		}
		else {
			return (<Redirect to="/Login"/>);
		}
	}
}

export default Thing