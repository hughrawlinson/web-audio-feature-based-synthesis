import RunningAverage from 'running-average/lib/running-average';
import FaderBank from './faderBank';
import React from 'react';

window.addEventListener('load',function(){
	React.render(
		<FaderBank />,
		document.getElementById('synth')
	);
},false);
