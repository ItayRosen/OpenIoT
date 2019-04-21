import React, {Component} from 'react';
import {Website_Name} from '../constants/constants.js'

//Bootstrap
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class Error extends Component {	

	componentDidMount() {
		document.title = "404 - " + Website_Name;
	}

	render() {
		return (
			<Container className="justify-content-center">
				<Row>
					<Col style={{marginTop: "5%"}} className="box" lg={{ span: 4, offset: 4 }} md={{ span: 5, offset: 4 }} sm={{ span: 8, offset: 2 }} xs={{ span: 10, offset: 1 }}>
						<center>
							<h1>404</h1>
							<p>Well I'll be damned, ain't nothing here.</p>
							<a href="/">Go back</a>
						</center>
					</Col>
				</Row>
			</Container>
		);
	}
}
export default Error