import React, {Component} from 'react';
import {API_URL} from '../constants/constants.js';
import {Redirect} from "react-router-dom";
import Loader from './Loader.js'

class Logout extends Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			redirect: 0
		}
	}
	
	componentWillMount() {
		fetch(API_URL + "user/logout.php", {credentials: 'include'})
		.then(res => res.json())
		.then(
		   (result) => {
				this.setState({redirect: 1});
		   },
		   (error) => {
			   alert("Error occurred trying to log out. Please reload page");
				console.log(error);
		   }
		)
	}
	
	render() {
		
		if (this.state.redirect === 0) {
			return (
				<Loader/>
			);
		}
		else {
			return (
				<Redirect to="./Login" />
			);
		}
	}
}

export default Logout