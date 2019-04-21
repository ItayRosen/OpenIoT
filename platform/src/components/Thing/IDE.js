import React, {Component} from 'react';
import {API_URL} from '../../constants/constants.js';

//Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

//Spin loader
import { css } from '@emotion/core';
import { RingLoader } from 'react-spinners';
const loaderCss = css`
    display: block;
    margin-left: auto;
    margin-right: auto;
    border-color: red;
`;
const loader = <div className='sweet-loading'><RingLoader css={loaderCss} sizeUnit={"px"} size={35} color={'#de4b39'}/></div>;

class IDE extends Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			uploadFile: "",
			uploadCallback: "",
			clicked: false,
			uploadStatus: false,
			thingID: props.thing.thingID,
			interval: 0
		};
		
		this.Upload = this.Upload.bind(this);
		this.UploadStatusCheck = this.UploadStatusCheck.bind(this);
	}
	
	componentWillUnmount() {
	   clearInterval(this.state.interval);
	}
	
	componentWillMount() {
		this.UploadStatusCheck();
	}
	
	UploadStatusCheck() {
		fetch(API_URL + "IDE/uploadStatus.php", {credentials: 'include', method: "POST", body: JSON.stringify({thingID: this.state.thingID})})
		.then(res => res.json())
		.then(
		   (result) => {
			   console.log(result);
			   let status = (result.response === 200) ? true : false;
			   //check if it's first status check
			   if (!this.state.clicked && result.response !== 422) {
				   let clicked = (result.response === 204) ? false : true;
				   this.setState({uploadCallback: result.data, clicked: clicked, uploadStatus: status});
			   }
			   //periodically check
			   else if (this.state.clicked && result.response !== 204) {
				   this.setState({uploadCallback: result.data, clicked: false, uploadStatus: status});
				   clearInterval(this.state.interval);
			   }
		   },
		   (error) => {
				console.log(error);
		   }
		)
	}
	
	Upload(e) {
		e.preventDefault();
		this.setState({clicked: true, uploadCallback: loader});
		if (e.target.uploadFile.files.length) {
			var data = new FormData();
			data.append('file', e.target.uploadFile.files[0]);
			data.append('thingID', this.state.thingID);
			fetch(API_URL + "IDE/upload.php", {credentials: 'include', method: "POST", body: data})
			.then(res => res.json())
			.then(
			   (result) => {
				   console.log(result);
					if (result.response === 200) {
						let interval = setInterval(this.UploadStatusCheck, 10000);
						this.setState({uploadStatus: true, uploadCallback: result.data, interval: interval});
					}
					else {
						this.setState({clicked: false, uploadStatus: false, uploadCallback: result.data});
					}
			   },
			   (error) => {
					console.log(error);
					alert("Oops, looks like we've experienced an internal error. Please try again later.");
			   }
			)
		}
		else {
			this.setState({clicked: false, uploadStatus: false, uploadCallback: "Please choose a file first"});
		}
	}
	
	render() {
		return (
			<div id="IDE">
				<Row>
					<Col>
					<h3>Over the Air Update</h3>
					<p>Here you can update your Thing's firmware over the air ("OTA").</p>
					</Col>
				</Row>
				<Row>
					<Col md={{span: 6}}>
						<div className="box">
							<h4>IDE</h4>
							<p>Coming soon..</p>
						</div>
					</Col>
					<Col md={{span: 6}}>
						<div className="box">
							<h4>Binary File</h4>
							<p>Upload a compiled binary file. <a href="/Learn">Learn how</a>.</p>
							<Form onSubmit={this.Upload}>
								<Form.Group>
									<Form.Control accept=".bin" type="file" name="uploadFile"/>
								</Form.Group>
								<Button disabled={this.state.clicked} variant="success" block type="submit">Upload</Button>
								<div className={(this.state.uploadStatus) ? "text-success" : "text-danger"}>{this.state.uploadCallback}</div>
							</Form>
						</div>
					</Col>
				</Row>
			</div>
		);
	}
}

export default IDE