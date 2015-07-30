import React from 'react';
import Fader from './fader';

import Subtractive from './subtractive';
var sub = new Subtractive({ctx:new AudioContext()});

module.exports = React.createClass({
	getInitialState: function(){
		return {"data":[]};
	},
	componentDidMount: function(){
		this.setState({data:sub.getFaders()});
	},
	render: function() {
		var faderNodes = this.state.data.map(fader =>
			<Fader key={fader.key} min={fader.min} max={fader.max} step={fader.step} defaultValue={fader.defaultValue}label={fader.label} handler={fader.handler} />
		);
		return (
			<div className="commentBox">
				<h3>Subtractive synth</h3>
				{faderNodes}
			</div>
		);
	}
});