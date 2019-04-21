import React, {Component} from 'react';
import {Website_Name} from '../constants/constants.js';
import { slide as Menu } from 'react-burger-menu'

//Bootstrap
import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';

//Fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser,faCompass,faChevronLeft,faGraduationCap,faCode,faLifeRing,faBars } from '@fortawesome/free-solid-svg-icons'

class Header extends Component {
	
	  constructor(props) {
		super(props);
		
		this.state = {
			scrollYPosition: 0,
			name: props.name,
			email: props.email
		};
		
		this.listenToScroll = this.listenToScroll.bind(this);
	  }	
	  
	componentDidMount() {
	  window.addEventListener('scroll', this.listenToScroll)
	}

	componentWillUnmount() {
	  window.removeEventListener('scroll', this.listenToScroll)
	}
	
	listenToScroll() {
		this.setState({scrollYPosition: window.pageYOffset});
	}
	  
	render() {
		return (
			<div id="header">
				<div className={(this.state.scrollYPosition > 15) ? "navBar z-index-fixed dropShadow" : "navBar z-index-fixed"}>
					<div className="d-block d-sm-none">
						<Menu burgerButtonClassName={"mobile-menu-icon"} customBurgerIcon={ <FontAwesomeIcon icon={faBars} size="1x"/> }>
							<div className="sideBar-title">Open<strong>IoT</strong></div>
							<a href="/Dashboard"><FontAwesomeIcon icon={faCompass} className="sideBar-icon"/> My Things <FontAwesomeIcon icon={faChevronLeft} className="sideBar-arrow pull-right"/></a>
							<a href="/API"><FontAwesomeIcon icon={faCode} className="sideBar-icon"/> API <FontAwesomeIcon icon={faChevronLeft} className="sideBar-arrow pull-right"/></a>
							<a href="/Learn"><FontAwesomeIcon icon={faGraduationCap} className="sideBar-icon"/> Learn <FontAwesomeIcon icon={faChevronLeft} className="sideBar-arrow pull-right"/></a>
							<a href="/Support"><FontAwesomeIcon icon={faLifeRing} className="sideBar-icon"/> Support <FontAwesomeIcon icon={faChevronLeft} className="sideBar-arrow pull-right"/></a>
						</Menu>
					</div>
					<h3>{this.state.name}</h3>
					<Dropdown>
					  <Dropdown.Toggle variant="secondary" className="userMenu">
						<FontAwesomeIcon icon={faUser} size="2x" color="white"/>
					  </Dropdown.Toggle>

					  <Dropdown.Menu>
						<Dropdown.Header>{this.state.email}</Dropdown.Header>
						<Dropdown.Item href="/Account">Account</Dropdown.Item>
						<Dropdown.Item href="/Logout">Logout</Dropdown.Item>
					  </Dropdown.Menu>
					</Dropdown>
				</div>
				<div className="sideBar d-none d-sm-block">
					<div className="sideBar-title">Open<strong>IoT</strong></div>
					<Nav defaultActiveKey="/home" className="flex-column">
					  <Nav.Link href="/Dashboard"><FontAwesomeIcon icon={faCompass} className="sideBar-icon"/> My Things <FontAwesomeIcon icon={faChevronLeft} className="sideBar-arrow pull-right"/></Nav.Link>
					  <Nav.Link href="/API"><FontAwesomeIcon icon={faCode} className="sideBar-icon"/> API <FontAwesomeIcon icon={faChevronLeft} className="sideBar-arrow pull-right"/></Nav.Link>
					  <Nav.Link href="/Learn"><FontAwesomeIcon icon={faGraduationCap} className="sideBar-icon"/> Learn <FontAwesomeIcon icon={faChevronLeft} className="sideBar-arrow pull-right"/></Nav.Link>
					  <Nav.Link href="/Support"><FontAwesomeIcon icon={faLifeRing} className="sideBar-icon"/> Support <FontAwesomeIcon icon={faChevronLeft} className="sideBar-arrow pull-right"/></Nav.Link>
					</Nav>
					<div className="sideBar-footer">2019 © {Website_Name}</div>
				</div>
			</div>
		);
	}
}

export default Header