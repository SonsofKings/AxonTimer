let self, cFile, conf;

exports.init = function(ref, cf, cn) {
	self = ref;
	cFile = cf;
	conf = cn;
}

exports.addjob = function(self, message, allDone) {

	// Set Tools
	let nick = message.content.nick;
	let zone = message.content.zone;
	let valve = message.content.valve;
	let cron = message.content.cron;
	let zClass = conf.zones[zone].class;
	let	duration,
		oCron;

	//Define Axon Attribute Specific Variables
	if (zClass = 'Relay') {
		oCron = message.content.duration;
	} else {
		duration = Math.abs(message.content.duration - 0);
	}
	
	//Test Zone and Job Inputs
	if (!conf.zones[zone]) return allDone(true, `Unknown zone "${message.content.zone}"`);
	if (conf.zones[zone].jobs[nick]) return allDone(true, `Job "${nick}" already exists in zone ${zone}`);
	
	//Allow Relay type Job
	if ((!duration) && (zClass != 'Relay')) return alldone(true, 'Duration must be an integer greater than zero');
	
	//Prep Cron(s)
	let test = cron.split(' ');
	let test2;
	if (zClass = 'Relay') {
		test2 = oCron.split(' ');
	}

	//Test Cron(s)
	if (test.length < 5 || test.length > 5) return allDone(true, `pattern doesn't look to be valid`);
	if (zClass = 'Relay') {		
		if (test2.length < 5 || test2.length > 5) return allDone(true, `off pattern doesn't look to be valid`);
	}

	//Establish Target
	let context = conf.zones[zone].context;

	//if Valve Job
	if (zClass != 'Relay') {
		self.nverse.ask(context, 'valves', {json: true}, function(err, res) {
			if (err) return allDone(true, err.toString());

			let obj = JSON.parse(res);
			let test = {};
			for (let i=0; i<obj.valves.length; i++)
				test[obj.valves[i].valveName] = true;

				if (!test[valve]) return allDone(true, `invalid valve "${valve}"`);

				conf.zones[zone].jobs[nick] = {
					valve: valve,
					pattern: cron,
					duration: duration
				}
			conf = cFile.update('zones', conf.zones);
		
				return allDone(false, `OK - job ${nick} added to zone ${zone}`);
		});
	} else {
		//if Relay Job
		self.nverse.ask(context, 'relays', {json: true}, function(err, res) {
			if (err) return allDone(true, err.toString());

			let obj = JSON.parse(res);
			let test = {};
			for (let i=0; i<obj.relays.length; i++)
				test[obj.relays[i].relayName] = true;

				if (!test[valve]) return allDone(true, `invalid relay "${valve}"`);

				conf.zones[zone].jobs[nick + '0'] = {
					relay: valve,
					pattern: cron,
					state: 'on'
				}
				conf.zones[zone].jobs[nick + '1'] = {
					relay: valve,
					pattern: oCron,
					state: 'off'
				}
			conf = cFile.update('zones', conf.zones);
		
				return allDone(false, `OK - job ${nick} added to zone ${zone}`);
		});
	}
}

exports.addzone = function(self, message, allDone) {
	let newZone = message.content.nick;
	let zType = message.content.class;
	if (zType !== 'Relay' && zType !== 'Valve') {
		return allDone(true, 'Class must be Relay or Valve');
	}

	if (conf.zones[newZone] || false)
		return allDone(true, `Zone ${newZone} already exists`);

	self.nverse.ask(message.content.context, 'marco', {}, function(err, res) {
		if (err) return allDone(true, err.toString());
		
		conf.zones[newZone] = {
			context: message.content.context,
			jobs: {},
			class: zType
		}
		conf = cFile.update('zones', conf.zones);
		allDone(false, `OK: Added zone ${newZone}`);						
	})
}

exports.dropjob = function(self, message, allDone) {
	let zone = message.content.zone;
	if (!conf.zones[zone]) return allDone(true, `Unknown zone "${zone}"`);
	let nick = message.content.nick;

	if (!conf.zones[zone].jobs[nick]) return allDone(true, `Unknown job "${nick}"`);

	delete conf.zones[zone].jobs[message.content.nick];
	conf = cFile.update('zones', conf.zones);
	allDone(false, `OK - dropped job ${nick}`);
}

exports.dropzone = function(self, message, allDone) {
	let zone = message.content.zone;
	delete conf.zones[zone];
	conf = cFile.update('zones', conf.zones);
	allDone(false, `OK: Dropped zone ${zone}`);
}

exports.getjobs = function(self, message, allDone) {
	let zone = message.content.zone;
	let zClass = conf.zones[zone].class;

	if (!conf.zones[zone]) return allDone(true, `Unknown zone "${zone}"`);

	let reportObj = {};
	
	if (zClass != 'Relay') {
		reportObj = {
			outside: 'double',
			vLines: true,
			head: [
				{caption: 'Nick', just: 'left'},
				{caption: 'Valve', just: 'left'},
				{caption: 'Cron', just: 'left'},
				{caption: 'Duration', just: 'right'}
			],
			headDiv: true,
			rows: []
		}
		} 

	else {
		reportObj = {
			outside: 'double',
			vLines: true,
			head: [
				{caption: 'Nick', just: 'left'},
				{caption: 'Relay', just: 'left'},
				{caption: 'Cron', just: 'left'},
				{caption: 'State', just: 'left'}
			],
			headDiv: true,
			rows: []
		}
	}

	if (zClass != 'Relay') {
		for (let key in conf.zones[zone].jobs) {
			let ptr = conf.zones[zone].jobs[key];
			reportObj.rows.push([key, ptr.valve, ptr.pattern, ptr.duration])
		}
	} 

	else {
		for (let key in conf.zones[zone].jobs) {
			let ptr = conf.zones[zone].jobs[key];
			reportObj.rows.push([key, ptr.relay, ptr.pattern, ptr.state])
		}
	}


	let out = self.utilities.strings.report(reportObj);
	if (message.isFromTerminal)
		out = '$$$div=tight\r\n' + out;

	allDone(false, out);
}

exports.getaxons = function(self, message, allDone) {
	let zClass = conf.zones[message.content.zone].class;

	let context = conf.zones[message.content.zone].context || false;
	if (!context) return allDone(true, 'Invalid zone');

	if (zClass == 'Relay') {
		self.nverse.ask(context, 'relays', {json: true}, function(err, res) {
			let list = [];
			let obj = JSON.parse(res);
			for (let i=0; i<obj.relays.length; i++) {
				list.push(obj.relays[i].relayName);
			}						
			list.sort();
			let outStr = list.join(', ');
			allDone(false, outStr + '\r\n\r\n');
		});

	} else {
	 	self.nverse.ask(context, 'valves', {json: true}, function(err, res) {
			let list = [];
			let obj = JSON.parse(res);
			for (let i=0; i<obj.valves.length; i++) {
				list.push(obj.valves[i].valveName);
			}						
			list.sort();
			let outStr = list.join(', ');
			allDone(false, outStr + '\r\n\r\n');
		});
	}
}
exports.getzones = function(self, message, allDone) {
	if (message.content.json)
		return allDone(false, JSON.stringify(conf.zones));

	let reportObj = {
		outside: 'double',
		vLines: true,
		head: [
			{caption: 'Nick', just: 'left'},
			{caption: 'Context', just: 'left'}
		],
		headDiv: true,
		rows: []
	}

	let zList = [];
	for (let nick in conf.zones) zList.push(nick);
	zList.sort();

	for (let i=0; i<zList.length; i++)
		reportObj.rows.push([zList[i], conf.zones[zList[i]].context]);

	let out = self.utilities.strings.report(reportObj);
	if (message.isFromTerminal)
		out = '$$$div=tight\r\n' + out;

	allDone(false, out);
}

exports.updatesched = function(self, message, allDone) {
	// Define Optional Cron
	let cron2;
	if (!message.content.cron2) {
		cron2 = false;
	} else {
		cron2 = message.content.cron2;
	}

	// Check Relay Params
	let zone = message.content.zone;
	let zClass = conf.zones[zone].class;
	if ((zClass == 'Relay') && (cron2 == false)) {
		return allDone(true, 'Relay Zones require updating 2 cron at a time');
	}

	// Check Zone
	if (!conf.zones[zone]) return allDone(true, `Unknown zone "${zone}"`);

	// Check Job
	let nick = message.content.nick;
	if (zClass == 'Relay') {
		if ((!conf.zones[zone].jobs[nick + '0']) && (!conf.zones[zone].jobs[nick + '1'])) {
			return allDone(true, `unknown jobs ${nick}`);
		};
	} else {
		if (!conf.zones[zone].jobs[nick]) {
			return allDone(true, `unknown job ${nick}`);
		};
	}

	// if ((!conf.zones[zone].jobs[nick]) ) return allDone(true, `Unknown job "${nick}"`);

	//Update Valve Schedule
	if (cron2 == false) {
		let theJob = conf.zones[zone].jobs[nick];
		theJob.pattern = message.content.cron;
		conf = cFile.update('zones', conf.zones);
		allDone(false, 'OK');
	} else {
		//Update Relay Schedule
		let firstJob = conf.zones[zone].jobs[nick + '0'];
		firstJob.pattern = message.content.cron;
		let secondJob = conf.zones[zone].jobs[nick + '1'];
		secondJob.pattern = message.content.cron2;
		allDone(false, 'OK');
	}
}

exports.updatetime = function(self, message, allDone) {
	let zone = message.content.zone;
	if (!conf.zones[zone]) return allDone(true, `Unknown zone "${zone}"`);
	let nick = message.content.nick;
	if (!conf.zones[zone].jobs[nick]) return allDone(true, `Unknown job "${nick}"`);
	let dur = Math.abs(message.content.duration - 0);
	if (!dur) return allDone(true, 'Duration must be greater than 0')

	let theJob = conf.zones[zone].jobs[nick];
	theJob.duration = dur;
	conf = cFile.update('zones', conf.zones);
	allDone(false, 'OK');
}

