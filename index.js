const myName = 'axonTimer',
	  debug = (process.argv[3] == 'debug'),
	  NIY = 'Not Implemented Yet',
	  vcb = require('./lib/vocab');

let cFile, conf;

exports.neuron = {
	system: { 
		debugAll: debug, 
		outputDebugAt: (debug) ? 1 : 5 ,
		version: '3.0',
		beforeBoot: function(config, dispatcher, globals, allDone) {
			cFile = dispatcher.utilities.configFile;
			conf = cFile.get({
				uplinkHost: '127.0.0.1',
				uplinkPort: 6443,
				ivKey: '4sc0re&7',
				zones: {}
			});

			config.interneuron.ivKey = conf.ivKey;
			config.interneuron.connectTo.host = conf.uplinkHost;
			config.interneuron.connectTo.port = conf.uplinkPort;

			let patts = config.skills[0].skillex.patterns

			for (let zone in conf.zones) {
				let context = conf.zones[zone].context;
				
				// Create Relay Jobs
				if (conf.zones[zone].class == 'Relay') {
					for (let nick in conf.zones[zone].jobs) {
						let thisJob = conf.zones[zone].jobs[nick];
						patts.push({
							pattern: thisJob.pattern,
							emit: 'rJOB',
							with: {
								target: context,
								relay: thisJob.relay,
								state: thisJob.state
							}
						});
					}
				// Create Valve Jobs
				} else {
					for (let nick in conf.zones[zone].jobs) {
						let thisJob = conf.zones[zone].jobs[nick];
						patts.push({
							pattern: thisJob.pattern,
							emit: 'job',
							with: {
								target: context,
								valve: thisJob.valve,
								duration: thisJob.duration
							}
						});
					}
				}
			}

			allDone(false, config, dispatcher, globals);
		},
		beforeStart: function(self, allDone) {
			vcb.init(self, cFile, conf);
			allDone();
		}
	},

	interneuron: {
		type: 'node',
		name: 'axonTimer',
		ivKey: false,
		connectTo: { host: false, port: false },
		outflow: ['beacon', 'newjob'],
		controls: {
			subscriptions: { 
				published: {
					beacon: 'Pulses every second for the watchTower',
					newjob: 'Fires whenever a job is issued'
				},
				allowAll: true
			}
		}
	},

	docs: {
		allowSource: true
	},

	skills: [
		{
			name: 'cron',
			emits: ['job', 'rJOB'],
			skillex: { 
				patterns: []
			}

		}, {
			name: 'eval',
			hears: ['job', 'rJOB'],
			emits: ['newjob'],
			skillex: {
				job: function(self, message, allDone) {
					let ctx = message.target;
					let valve = message.valve;
					let dur = message.duration;
					let msg = `Newjob @ ${ctx}: ${valve} ${dur} - `;

					self.nverse.ask(ctx, 'queueadd', {valveName: valve, duration: dur}, function(err, res) {
						msg += res.toString();
						self.emit('newjob', {detail: msg});
						self.debugLog(msg, 1);
						allDone();
					});
				},
				rJOB: function(self, message, allDone) {
					let ctx = message.target;
					let mRelay = message.relay;	
					let mState = message.state;
					let msg = `Newjob @ ${ctx}: ${mRelay} ${mState} - `

					self.nverse.ask(ctx, 'turn', {relay: mRelay, state: mState}, function(err, res) {
						allDone();
					});
				},
			}

		}, {
			name: 'interval',
			emits: ['beacon'],
			skillex: { 
				timers: [ {ms: 1000, emit: 'beacon'} ] 
			}
		}
	],

	vocab: {
		lexicon: {
			addjob: {
				nick: 'addJob',
				help: 'Add job [nick] to [zone] on [valve] at [cron] pattern for/until [duration/offTimeCron] secs. Restart req',
				parameters: [ {nick: 'nick'}, {nick: 'zone'}, {nick: 'valve'}, {nick: 'cron'}, {nick: 'duration'} ],
				handler: vcb.addjob
			},
			addzone: {
				nick: 'addZone',
				help: 'Add a zone (class valve neuron)',
				parameters: [ {nick: 'class'}, {nick: 'nick'}, {nick: 'context'} ],
				handler: vcb.addzone
			},
			dropjob: {
				nick: 'dropJob',
				help: 'Drop a cron pattern schedule from a valve/zone',
				parameters: [ {nick: 'zone'}, {nick: 'nick'} ],
				handler: vcb.dropjob
			},
			dropzone: {
				nick: 'dropZone',
				help: 'Drop a zone from the timer',
				parameters: [ {nick: 'zone'} ],
				handler: vcb.dropzone
			},
			getjobs: {
				nick: 'getJobs',
				help: 'return list of jobs for zone',
				parameters: [ {nick: 'zone'} ],
				handler: vcb.getjobs
			},
			getaxons: {
				nick: 'getAxons',
				help: 'get assigned Axons in zone',
				parameters: [ {nick: 'zone'} ],
				handler: vcb.getaxons 
			},
			getzones: {
				nick: 'getZones',
				help: 'Get all zones in the timer',
				parameters: false,
				handler: vcb.getzones 
			},
			runall: {
				nick: 'runAll',
				help: 'Run all tasks in a zone.',
				parameters: [{nick: 'zone'}],
				handler: vcb.runall
			},
			testjob: {
				nick: 'testJob',
				help: 'Immediately runs job',
				parameters: [
					{nick: 'zone'},
					{nick: 'job'}
				],
				handler: vcb.testjob
			},
			updatesched: {
				nick: 'updateSched',
				help: 'update job in [zone] named [nick] to [pattern] [pattern2: necessary for relays]. Restart req',
				parameters: [ {nick: 'zone'}, {nick: 'nick'}, {nick: 'cron'}, {nick: 'cron2', optional: true}],
				handler: vcb.updatesched
			},
			updatetime: {
				nick: 'updateTime',
				help: 'update job in [zone] named [nick] to [duration] secs. Restart req',
				parameters: [ {nick: 'zone'}, {nick: 'nick'}, {nick: 'duration'} ],
				handler: vcb.updatetime
			}
		}
	}	
}

