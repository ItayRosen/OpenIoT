import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Login from './components/Login.js';
import Register from './components/Register.js';
import Dashboard from './components/Dashboard.js';
import NewThing from './components/NewThing.js';
import Logout from './components/Logout.js';
import Reset from './components/Reset.js';
import Thing from './components/Thing.js';
import Account from './components/Account.js';
import Loader from './components/Loader.js';
import Error from './components/404.js';
import Unsubscribed from './components/Unsubscribed.js';
import './bootstrap.min.css';
import './style.css';
import * as serviceWorker from './serviceWorker';
import {API_URL, CLOUD_URL} from './constants/constants.js';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch
} from "react-router-dom";

function App() {
  return (
    <Router>
      <Switch>
		<Route exact path="/" component={Home} />
        <Route path="/Dashboard" component={Dashboard} />
        <Route path="/Login" component={Login} />
        <Route path="/Register" component={Register} />
        <Route path="/NewThing" component={NewThing} />
        <Route path="/Logout" component={Logout} />
        <Route path="/Reset/:userID/:token" component={Reset} />
        <Route path="/Thing/:id" component={Thing} />
        <Route path="/Account" component={Account} />
        <Route path="/Support" component={() => window.location = 'https://github.com/ItayRosen/OpenIoT/issues'} />
        <Route path="/Learn" component={() => window.location = 'https://github.com/ItayRosen/OpenIoT'} />
        <Route path="/API" component={() => window.location = 'https://github.com/ItayRosen/OpenIoT/tree/master/docs/api'} />
        <Route path="/unsubscribe/:email" component={Unsubscribe} />
        <Route path="/unsubscribed" component={Unsubscribed} />
        <Route path="" component={Error} />
      </Switch>
    </Router>
  );
}

class Unsubscribe extends Component {
	  constructor(props) {
		super(props);
		this.email = props.match.params.email;
	  }
	  
	  render() {
		  window.location = CLOUD_URL + 'unsubscribe?email=' + this.email;
		return(null);
	  }
}

class Home extends Component {
	state = {
		redirect: null
	}
	
	componentWillMount() {
		fetch(API_URL + "user/authenticate.php")
		.then(res => res.json())
		.then(
		   (result) => {
				if (result.response === 200)
				{
					if (result.data === 1)
					{
						this.setState({ redirect: "./Dashboard" });
					}
					else
					{
						this.setState({ redirect: "./Dashboard" });
					}
				}
				else
				{
					this.setState({ redirect: "./Login" });
				}				
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	render() {
		if (this.state.redirect === null)
		{
			return (
				<Loader />
			);
		}
		else
		{
			return (
				<Redirect to={this.state.redirect} />
			);
		}
	}
}

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.unregister();
