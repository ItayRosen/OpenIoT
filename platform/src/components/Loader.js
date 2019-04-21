import React, {Component} from 'react';
import { css } from '@emotion/core';
import { RingLoader } from 'react-spinners';

const override = css`
    display: block;
    margin-left: auto;
    margin-right: auto;
    margin-top: 30vh;
`;


class Loader extends Component {
	render() {
		return (
		 <div className='sweet-loading'>
			<RingLoader
			  css={override}
			  sizeUnit={"px"}
			  size={150}
			  color={'#de4b39'}
			/>
		  </div> 
		);
	}
}

export default Loader