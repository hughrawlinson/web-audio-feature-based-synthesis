import React from 'react';

module.exports = React.createClass({
	getInitialState: function(){
		return {
			value:this.props.defaultValue
		}
	},
	getDefaultProps : function() {
		return {
			"min": 0,
			"max": 1
		};
	},
	handleChange: function(event){
		var value = +event.target.value;
		this.setState({value});
		this.props.handler(value);
	},
	render: function() {
		var value = this.state.value;
		var min = this.props.min;
		var max = this.props.max;
		var step = this.props.step;
		return (
			<div>
				<dt>{this.props.label}</dt>
				<dd><input type="range" min={min} max={max} value={value} step={step} onChange={this.handleChange}/></dd>
			</div>
		);
	}
});