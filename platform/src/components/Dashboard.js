import React, {Component} from 'react';
import {API_URL, Website_Name} from '../constants/constants.js';
import Header from './Header.js'
import {Redirect} from "react-router-dom";
import chipImage from "../img/chip.png";
import Loader from './Loader.js'

//Bootstrap
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';

//Notification
import ReactNotification from "react-notifications-component";
import "react-notifications-component/dist/theme.css";

//Fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGlobe,faClock,faMicrochip,faArrowRight } from '@fortawesome/free-solid-svg-icons'

//Spin loader
import { css } from '@emotion/core';
import { RingLoader } from 'react-spinners';
const loaderCss = css`
    display: block;
    margin: 0 auto;
    border-color: red;
	margin-top: 30%;
`;
const loader = <div className='sweet-loading'><RingLoader css={loaderCss} sizeUnit={"px"} size={80} color={'#de4b39'}/></div>;

class Dashboard extends Component {

	  constructor(props) {
		super(props);
		
		this.state = {
			authenticated: 0, 
			things: 0, 
			redirect: "",
			email: ""
		};
		
		this.Things = this.Things.bind(this);
		this.LoadThings = this.LoadThings.bind(this);
		
		this.notificationDOMRef = React.createRef();
	  }
	  
	componentWillMount() {
		document.title = "Dashboard - " + Website_Name;
		//authenticate
		fetch(API_URL + "user/read.php", {credentials: 'include'})
		.then(res => res.json())
		.then(
		   (result) => {
			   console.log(result);
				if (result.response === 200) {
					this.setState({ authenticated: 1, things: result.data.things, email: result.data.email});
					if (result.data.things === null) {
						this.addNotification("Hi there!", 'Start by adding a Thing. Click on "New Thing"!',"info",0);
					}
					else {
						this.LoadThings();
					}
				}
				else {
					this.setState({ authenticated: -1 });
				}
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	LoadThings() {
		if (this.state.things === null) return;
		Object.keys(this.state.things).map(key => {
			fetch(API_URL + "thing/read.php", {credentials: 'include', method: "POST", body: JSON.stringify({"id": key})})
			.then(res => res.json())
			.then(
			   (result) => {
				   console.log(result);
					if (result.response === 200) {
						let things = this.state.things;
						things[key] = result.data;
						this.setState({things: things});
					}
			   },
			   (error) => {
					console.log(error);
			   }
			)
			return true;
		});
	}
	
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
	
	Things() {		
		if (this.state.things === 0) {
			return (<div>Loading..</div>);
		}
		else if (this.state.things === null) {
			return null;
		}
		else {
			return Object.keys(this.state.things).map(key => {
				if (this.state.things[key] === true) {
					return (
						<Col xl={{span: 3}} lg={{span: 4}} md={{span: 6}} xs={{span: 6}} key={key}>
							<div className="box">
								{loader}
							</div>
						</Col>
					);
				}
				else if (this.state.things[key] === false) {
					return null;
				}
				else {
					return (
						<Col xl={{span: 3}} lg={{span: 4}} md={{span: 6}} xs={{span: 6}} key={key}>
							<div className="box" onClick={() => this.setState({redirect: (this.state.things[key].connected) ? "/Thing/" + key : "/NewThing?connect=" + key})}>
								<div className="d-flex align-items-start flex-column" style={{height: "100%"}}>
									<div className="mb-auto p-0">
										<div className="d-flex" style={{width: "100%"}}>
											<div className="p-1 text-dark font-weight-bold">
												{this.state.things[key].name}
											</div>
											<div className="ml-auto p-1">
												<Badge variant={(this.state.things[key].status === 1) ? "success" : "danger"}>{(this.state.things[key].status === 1) ? "online" : "offline"}</Badge>
											</div>
										</div>
									</div>
									<div className="mb-auto p-0">
										<div className="d-flex flex-column">
											<div className="p-0" hidden={(this.state.things[key].ip) === "" ? true : false}>
												<div className="d-flex">
													<div className="p-1"><FontAwesomeIcon icon={faGlobe}/></div>
													<div className="p-1">{this.state.things[key].ip}</div>
												</div>
											</div>
											<div className="p-0">
												<div className="d-flex">
													<div className="p-1"><FontAwesomeIcon icon={faClock}/></div>
													<div className="p-1">{this.state.things[key].lastActivity}</div>
												</div>
											</div>
											<div className="p-0">
												<div className="d-flex">
													<div className="p-1"><FontAwesomeIcon icon={faMicrochip}/></div>
													<div className="p-1">{this.state.things[key].board}</div>
												</div>
											</div>
										</div>
									</div>
									<div className="p-0 align-self-end text-danger">
										View <FontAwesomeIcon icon={faArrowRight}/>
									</div>
								</div>
							</div>
						</Col>
					);
				}
			});
		}
	}

	render() {
		if (this.state.authenticated === 0) {
			return (<Loader/>);
		}
		else if (this.state.authenticated === 1) {
			if (this.state.redirect === "") {
				return (	
					<div id="dashboard">
						<Header email={this.state.email} name="My Things"/>
						<div className="content">
							<Container>
								<ReactNotification ref={this.notificationDOMRef} />
								<Row>
									<Col xl={{span: 3}} lg={{span: 4}} md={{span: 6}} xs={{span: 6}}>
										<div className="box new" onClick={() => this.setState({redirect: "/newThing"})}>
											<div className="d-flex align-content-center align-items-center flex-column"  style={{height: "100%"}}>
												<div className="p-4">
													<img src={chipImage} alt="chip" width="100%"/>
												</div>
												<div className="p-0"><strong>New Thing</strong></div>
											</div>
										</div>
									</Col>
									<this.Things />
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
			return (<Redirect to="./Login"/>);
		}
	}
}

export default Dashboard