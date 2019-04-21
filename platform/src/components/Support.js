import React, {Component} from 'react';
import {API_URL,Website_Name,Website_Email} from '../constants/constants.js';
import Header from './Header.js'
import {Redirect} from "react-router-dom";
import Loader from './Loader.js'

//Bootstrap
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

//Fontawesome
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//import { faCheck, faTrash } from '@fortawesome/free-solid-svg-icons'

class Support extends Component {

	  constructor(props) {
		super(props);
		
		this.state = {
			authenticated: 0,
			redirect: "",
			email: ""
		};
		
	  }
	  
	componentWillMount() {
		document.title = "Support - " + Website_Name;
		//authenticate
		fetch(API_URL + "user/read.php", {credentials: 'include'})
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200) {
					this.setState({authenticated: 1,email: result.data.email});					
				}
				else {
					this.setState({redirect: "/Login"});
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
		else if (this.state.authenticated === 1) {
			return (
				<div id="account">
					<Header email={this.state.email} name="Support"/>
					
					<div className="content">
						<Container>
							<Row>
								<Col>
									<div className="box">
										<p>This page will be (hopefully) populated with a support ticket system soon. Meanwhile, just drop me an email at <a href={"mailto:"+Website_Email}>{Website_Email}</a></p>
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

export default Support