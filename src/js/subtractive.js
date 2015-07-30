export default class Subtractive{
	constructor(params){
		this.ctx = params.ctx;
		this.nyquist = this.ctx.sampleRate/2;
		this.osc1 = this.ctx.createOscillator();
		this.osc2 = this.ctx.createOscillator();
		this.lpf = this.ctx.createBiquadFilter();
		this.lpf.frequency.value = this.nyquist;
		this.gain1 = this.ctx.createGain();
		this.gain2 = this.ctx.createGain();
		this.gain3 = this.ctx.createGain();
		this.osc1.connect(this.gain1);
		this.osc2.connect(this.gain2);
		this.gain1.connect(this.lpf);
		this.gain2.connect(this.lpf);
		this.lpf.connect(this.gain3);
		this.gain3.connect(this.ctx.destination);

		this.start();
	}

	getFaders(){
		var faders = [];
		var oscillatorTypes = [
			"sine",
			"square",
			"sawtooth",
			"triangle"
		]

		var oscillators = [this.osc1,this.osc2];
		var gains = [this.gain1,this.gain2];
		for(var i = 0; i < oscillators.length; i++){
			var oscillator = oscillators[i];
			var gain = gains[i];
			faders.push({
				key:`oscillator${i}Detune`,
				label:`Oscillator #${i} Detune`,
				min:-100,
				max:100,
				step:0.01,
				defaultValue:oscillator.detune.value,
				handler:function(value){oscillator.detune.value=value}
			});
			faders.push({
				key:`oscillator${i}Type`,
				label:`Oscillator #${i} Type`,
				min:0,
				max:3,
				step:1,
				defaultValue:oscillatorTypes.indexOf(oscillator.type),
				handler:function(value){oscillator.type=oscillatorTypes[Math.round(value)]}
			});
			faders.push({
				key:`oscillator${i}Gain`,
				label:`Oscillator #${i} Gain`,
				min:0,
				max:1,
				defaultValue:gain.gain.value,
				step:0.01,
				handler:function(value){gain.gain.value=value}
			});
		}
		// filter params
		faders.push({
			key:`filterFreq`,
			label:`Filter Frequency`,
			min:50,
			max:this.nyquist,
			defaultValue:this.lpf.frequency.value,
			step:1,
			handler:(value)=>{this.lpf.frequency.value = value}
		});
		faders.push({
			key:`filterQ`,
			label:`Filter Resonance`,
			min:0,
			max:20,
			defaultValue:this.lpf.Q.value,
			step:0.01,
			handler:(value)=>{this.lpf.Q.value = value}
		});
		faders.push({
			key:'filterGain',
			label:'Final Gain',
			min:0,
			max:1,
			defaultValue:this.gain3.gain.value,
			step:0.01,
			handler:(value)=>{this.gain3.gain.value=value}
		});

		return faders;
	}

	start(){
		this.osc1.start();
		this.osc2.start();
	}
}