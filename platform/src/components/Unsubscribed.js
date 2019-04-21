import React, {Component} from 'react';
import {Website_Name} from '../constants/constants.js'

//Bootstrap
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class Unsubscribed extends Component {	

	componentDidMount() {
		document.title = "Unsubscribed - " + Website_Name;
	}

	render() {
		return (
			<Container className="justify-content-center">
				<Row>
					<Col style={{marginTop: "5%"}} className="box" lg={{ span: 4, offset: 4 }} md={{ span: 5, offset: 4 }} sm={{ span: 8, offset: 2 }} xs={{ span: 10, offset: 1 }}>
						<center>
							<h2>Unsubscribed</h2>
							<p>You have unsubscribed successfully. You will no longer receive emails from us.</p>
							<a href="/">Home page</a>
						</center>
					</Col>
				</Row>
			</Container>
		);
	}
}
export default Unsubscribed