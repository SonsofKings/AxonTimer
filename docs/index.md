[meta]: # (
	name: axonTimer
	description: Timer neuron for controlling relayManager and valves
)

## AxonTimer
___
::: br

#### Author: Ed Purkiss
#### v3 Edits: Winston Purkiss

This neuron is a cron based timer neuron, that uses a class system to speak to different types of neurons. It has the ability to store jobs for different neurons called 'zones', and uses it's timer as the kicker to start the jobs off. 

IMPORTANT: Jobs are added to the timer on Boot. To effect change on the timers schedule you must reboot the neuron. Vocab that requires restart will be marked with - * . 

##### Check out the source [here](nrlx://.../__source.md).

### Interneuron
___
`name`: axonTimer

### Vocabulary
___
`addZone`: Add a neuron for the timer to talk to. Usage: addZone (class) (nick) (context)

Usage: addZone Relay winsHouse local.remotes.winTestBB.relayManager

`addJob`* : Add a job to a designated zone. 

Valve Usage: addJob (nick) (zone) (valve) (cronpattern) (duration) 

Ex: addJob hangmorn hongkong hangers '0 0 * * * ' 300 

Relay Usage: addJob (nick) (zone) (relay) (onCron) (offCron)

Ex: addJob nightLight winsHouse lights '0 11 * * * ' '0 6 * * * '

`dropZone`: Remove a zone from the timer. Usage: dropZone (zone)

Ex: dropZone winsHouse

`dropJob`* : Remove a job from the timer. Usage: dropJob (zone) (nick)

Ex: dropJob winsHouse nightLight

`getAxons` Return all Axons the neuron can send impulses too by zone. Usage: getAxons (zone)

Ex: getAxons winsHouse

`getJobs`: Return all Jobs by zone. Usage: getJobs (zone)

Ex: getJobs winsHouse

`getZones`: Return all zones. Usage: getZones

`updateSched`: Update the time for a job. Usage: updateSched (zone) (nick) (cron) (cron2 /optional)

Valve Ex: updateSched hongkong hangmorn '0 1 * * * '

Relay Ex: updateSched winsHouse nightLight '30 10 * * * ' '30 4 * * * '

`updateTime`: Update duration time for a valve job. Usage: updateTime (zone) (nick) (duration)

Ex: updateTime hongkong hangmorn 600

###Skills
___
Cron: A simple timer.

Eval: Listens to the timer and tells neurons what to do across the nverse.

###Resources
___
None

