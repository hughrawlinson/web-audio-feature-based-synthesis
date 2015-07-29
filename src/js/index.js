import 'meyda';
import RunningAverage from 'running-average/lib/running-average';
import Synth from './synth';
import React from 'react';

window.addEventListener('load',function(){
	var ctx = new AudioContext();
	var src = ctx.createOscillator();
	var p = new Meyda({
		"audioContext":ctx,
		"source":src,
		"bufferSize":512
	});

	React.render(
		<Synth />,
		document.getElementById('synth')
	);
},false);
