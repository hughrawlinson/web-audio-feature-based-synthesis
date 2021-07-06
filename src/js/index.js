import Subtractive from './subtractive';
import RunningAverage from 'running-average/lib/running-average.js';

(()=>{
	window.addEventListener('load',function(){
		var PRESET_COUNT = 10;
		var SAMP_RATE = 44100;
		window.data = [];
		for(let i = 0; i < PRESET_COUNT; i++){
			let ctx = new OfflineAudioContext(1,SAMP_RATE,SAMP_RATE);
			let averageCentroid = new RunningAverage();
			let averageRMS = new RunningAverage();
			let sub = new Subtractive(ctx,data=>{
				averageCentroid.push(data.spectralCentroid/SAMP_RATE/2);
				averageRMS.push(data.rms);
			});
			let faders = sub.getFaders();
			let outs = [];
			for(let i = 0; i < faders.length; i++){
				var v = Math.random();
				var value = v*(faders[i].max-faders[i].min)+faders[i].min;
				faders[i].handler(value);
				outs.push(v);
			}
			ctx.startRendering().then(function(){
				window.data.push({
					input:[
						averageCentroid.getAverage(),
						averageRMS.getAverage()
					],
					output:outs
				});
				ctx.close();
			});
		}
	},false);
}())
