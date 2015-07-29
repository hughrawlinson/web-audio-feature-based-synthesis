import React from 'react';
import Fader from './fader';

var data = [{
	key:"osc1Vol",
	label:"Oscillator 1 Volume"
},{
	key:"osc1Type",
	label:"Oscillator 1 Type"
},{
	key:"osc2Vol",
	label:"Oscillator 2 Volume"
},{
	key:"osc2Type",
	label:"Oscillator 2 Type"
}];

module.exports = React.createClass({
	getInitialState: ()=>{
		return {data:[]}
	},
	componentDidMount: function(){
		this.setState({data});
	},
	render: function() {
		var faderNodes = this.state.data.map(fader =>
			<Fader label={fader.label} />
		);
		return (
			<div className="commentBox">
				<h3>Subtractive synth</h3>
				{faderNodes}
			</div>
		);
	}
});