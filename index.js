/**
 * Version: 0.1.8
 * Made by Loggeru
 */

module.exports = function LetMeDrink(mod) {

	const LAIN_ID = 80081, // Lein's Dark Root Beer ID
		skills = require('./skills'),
		config = require('./config.json');

	let enabled = true,
		oCid = null,
		oJob = null,
		oX = null,
		oY = null,
		oZ = null,
		oW = null,
		qtdDrink = 0,
		idDrink = null,
		isCdDrink = false,
		getInfoCommand = false,
		DELAY = 200,                // How much time in miliseconds should wait after buff (seconds * 1000)
		NOTIFICATIONS = false;      // true - Activates notification when you drink / false - Deactivates

	mod.command.add('letmedrink', () => {
		enabled = !enabled;
		let txt = (enabled) ? 'ENABLED' : 'DISABLED';
		message(txt, true);
	});

	mod.command.add('getskillinfo', () => {
		getInfoCommand = true;
		message('Use the desired skill and check proxy console.', true);
	});

	mod.hook('S_LOGIN', 12, (event) => {
		loadConfig();
		oCid = event.gameId;
		oJob = (event.templateId - 10101) % 100;
		enabled = skills.find(p => p.job == oJob) ? true : false;
	});

	mod.hook('C_PLAYER_LOCATION', 5, { order: -10 }, (event) => {
		if (!enabled) return;

		oX = (event.loc.x + event.dest.x) / 2;
		oY = (event.loc.y + event.dest.y) / 2;
		oZ = (event.loc.z + event.dest.z) / 2;
		oW = event.w;
	});

	mod.hook('S_INVEN', 18, { order: -10 }, (event) => {
		if (!enabled) return;

		let tempInv = event.items;
		for (let i = 0; i < tempInv.length; i++) {
			if (tempInv[i].id == LAIN_ID) {
				qtdDrink = tempInv[i].amount;
				idDrink = tempInv[i].dbid;
				break;
			}
		}
	});

	mod.hook('S_START_COOLTIME_ITEM', 1, event => {
		if (!enabled) return;

		if (event.item == LAIN_ID && isCdDrink == false) {
			isCdDrink = true;
			setTimeout(function () { isCdDrink = false; }, event.cooldown * 1000);
		}
	});

	mod.hook('C_START_SKILL', 7, { order: -10 }, (event) => {
		if (!enabled) return;

		let sInfo = getSkillInfo(event.skill.id);

		if (getInfoCommand) {
			message('Skill info: (group: ' + sInfo.group + ' / job: ' + oJob + ')');
			getInfoCommand = false;
		}

		for (let s = 0; s < skills.length; s++) {
			if (skills[s].group == sInfo.group && skills[s].job == oJob && isCdDrink == false && qtdDrink > 0) {
				useItem();
				break;
			}
		}
	});

	function useItem() {
		setTimeout(function () {
			mod.toServer('C_USE_ITEM', 3, {
				gameId: oCid,
				id: LAIN_ID,
				dbid: idDrink,
				target: 0,
				amount: 1,
				dest: { x: 0, y: 0, z: 0 },
				loc: { x: oX, y: oY, z: oZ },
				w: oW,
				unk1: 0,
				unk2: 0,
				unk3: 0,
				unk4: 1
			});
			isCdDrink = true;
			qtdDrink--;
			if (NOTIFICATIONS) message('You drank your beer, still have ' + qtdDrink + ' more.', true);
			setTimeout(function () { isCdDrink = false; }, 60000);
		}, DELAY);
	}

	function getSkillInfo(id) {
		let nid = id;// -= 0x4000000;
		return {
			id: nid,
			group: Math.floor(nid / 10000),
			level: Math.floor(nid / 100) % 100,
			sub: nid % 100
		};
	}

	function message(msg, chat = false) {
		if (chat == true) {
			mod.command.message(msg);
		} else {
			console.log('(Let Me Drink) ' + msg);
		}
	}

	function loadConfig() {
		if (config) {
			({ DELAY, NOTIFICATIONS } = config)
		} else {
			mod.command.message("Error: Unable to load config.json - Using default values for now");
		}
	}

}