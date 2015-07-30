import React from 'react';

module.exports = React.createClass({
	render: function() {
		var value = this.props.value;
		var min = this.props.min;
		var max = this.props.max;
		var step = this.props.step;
		return (
			<div>
				<dt>{this.props.label}</dt>
				<dd><input type="range" min={min} max={max} value={value} step={step}/></dd>
			</div>
		);
	}
});