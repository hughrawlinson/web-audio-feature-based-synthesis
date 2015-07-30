import React from 'react';
import Fader from './fader';

import Subtractive from './subtractive';
var sub = new Subtractive();

module.exports = React.createClass({
	getInitialState: function(){
		return {"data":[]};
	},
	componentDidMount: function(){
		this.setState({data:sub.getFaders()});
	},
	randomizeParameters: function(){
		sub.getReady();
		this.setState(function(previousState){
			var newState = {data:sub.getFaders()};
			for(var i = 0; i < newState.data.length; i++){
				var f = {};
				f.key = newState.data[i].key;
				var value = Math.random()*(newState.data[i].max-newState.data[i].min)+newState.data[i].min;
				newState.data[i].handler(value);
				f.value = value;
				f.handler = newState.data[i].handler;
				f.label = newState.data[i].label;
				f.min = newState.data[i].min;
				f.max = newState.data[i].max;
				f.step = newState.data[i].step;
				newState.data.push(f);
			}
			return newState;
		});
	},
	render: function() {
		var faderNodes = this.state.data.map(fader =>
			<Fader key={fader.key} min={fader.min} max={fader.max} step={fader.step} label={fader.label} value={fader.value} handler={fader.handler} />
		);
		return (
			<div>
				<h3>Subtractive synth</h3>
				<button type="button" onClick={this.randomizeParameters}>Randomize</button>
				{faderNodes}
			</div>
		);
	}
});