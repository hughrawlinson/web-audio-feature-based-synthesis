import React from 'react';

module.exports = React.createClass({
  render: function() {
    return (
    	<div>
	     	<dt>{this.props.label}</dt>
			<dd><input type="range" min="0" max="1" value="1" step="0.01"/></dd>
		</div>
    );
  },
  onChange: function(){

  }
});