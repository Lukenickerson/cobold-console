
function OmicronClass (refData)
{
	this.cc = new ConsoleClass();
	
	// Constants / Reference Data
	this.enterCharacter = this.cc._stringFromCharCode(10);
	this.refData = refData;
	this.stateObjects = {
		"LOST" : {
			"help" : "[w] Wander, [s] Search, [r] Rest"
		}
		,"SPOT" : {
			"help" : "[w] Withdraw, [e] Engage, [a] Attack"
		}
		,"ENCOUNTER" : {
			"help" : "[t] Trade, [a] Antagonize, [f] Friendly Conversation"
		}
		,"COMBAT" : {
			"help" : "[a] Attack, [d] Defend, [w] Withdraw/Flee, [s] Surrender"
		}
		,"DEAD" : {
			"help" : "You are dead. Refresh the page to reload and play again."
		}
	};
	
	// Variable Gameplay Data
	this.state = "LOST";
	this.danger = 0;
	this.rollingDifficulty = 0;
	this.enemyIndex = -1;
	this.landKey = "GGH";
	this.time = 8;
	// Settings
	this.isHelpPromptOn = true;
	
	this.xp = [ /* Fill in with 0 for each enemy */ ];
	this.you = {
		"health" : 100
		,"size" : 100
		,"rads" : 1
		,"full" : 99
		,"quench" : 99
	};
	this.inv = {
		"hands" : null
		,"primaryHand" : { "name" : "big stick", "hands" : 2, "damage" : 1 }
		,"secondaryHand" : null
		,"head" : null
		,"neck" : null
		,"torso" : { "name" : "wrinkled cotton shirt", "protection" : 0, "durability" : 0 }
		,"legs" : { "name" : "itchy burlap pants", "protection" : 0, "durability" : 0 }
		,"waist" : null
		,"beltLeft" : null
		,"beltRight" : null
		,"leftShoulder" : null
		,"rightShoulder" : null
		,"back" : null
		,"feet" : { "name" : "worn rubber boots", "protection" : 0, "durability" : 0 }
	};

	
	
	
	
	
	this.wander = function () {
		var r = "Wandering...\n";
		this.danger = 1;
		this.passTime(1);
		switch(this.roll1d(10)) {
			case 1:
			case 2:
				r += this.refData.lands[this.landKey].wanderDescriptions[0];
				break;
			case 3:
				r += "The terrain is normal for " + this.refData.lands[this.landKey].name + ".";
				break;
			case 4:
				r += "The air is still and quiet.";
				break;
			case 5:
				r += "You find ruins of an ancient building.";
				this.danger += 1;
				break;
			case 6:
				r += "You are at the remains of an ancient roadway.";
				break;				
			case 7:
				var rads = this.roll1d(6);
				this.modify("rads", rads);
				r += "You accidentally stumble upon an area with radioactive rubble."
					+ " (+" + rads + " rads)";
				break;
			case 8:
				r += "You find a recently used campsite.";
				this.danger += 1;
				break;
			case 9:
				r += "The ground has a slight glow in this area.";
				break;				
			case 10:
				r += "You find a stream with fairly clean water.";
				var foodAmount = this.roll1d(6);
				this.modify("quench", foodAmount);
				this.modify("rads", 1);
				this.danger += 1;
				break;
			default:
			break;
		}
		
		r += this.checkForAttack();
		
		return r;
	}
	
	this.search = function () {
		var r = "Searching... (danger: " + (this.danger * 5) + "%)\n";
		this.passTime(1);
		switch(this.roll1d(10)) {
			case 1:
			case 2:
				r += "You find nothing.";
				break;
			case 3:
				r += "You find nothing.";
				break;
			case 4:
				r += "You find nothing.";
				break;
			case 5:
				r += "You find nothing.";
				break;
			case 6:
				r += "You find nothing.";
				break;				
			case 7:
				var rads = this.roll1d(6);
				this.modify("rads", rads);
				r += "You accidentally uncover some radioactive junk. (+" + rads + " rads)";
				break;
			case 8:
				var foodAmount = this.roll1d(6);
				this.modify("quench", foodAmount);
				this.modify("rads", foodAmount);
				r += "You find a small glowing, radioactive puddle. (+" + foodAmount + " rads and quench)";
				break;
			case 9:
				
				var foodAmount = this.roll1d(6);
				this.modify("full", foodAmount);
				this.modify("rads", foodAmount);
				r += "You find a can of radioactive food. (+" + foodAmount + " rads and fullness)";
				break;				
			case 10:
				var foodAmount = this.roll1d(6);
				this.modify("full", foodAmount);
				this.modify("quench", foodAmount);
				r += "You find clean food and water. (+" + foodAmount + " quench and fullness)";
				break;
			default:
			break;
		}
		r += this.checkForAttack();
		this.danger += this.refData.lands[this.landKey].diff;
		
		return r;
	}
	
	this.rest = function () {
		var heal = this.roll1d(6);
		this.modify("health", heal);
		this.modify("full", -1);
		this.modify("quench", -1);
		this.passTime(1);
		var r = "You rest and heal +" + heal + " health."
			+ " (" + ((this.you.health/this.you.size) * 100) + "%)";
		r += this.checkForAttack();
		return r;
	
	}
	
	this.checkForAttack = function () {
		var r = "";
		if (this.roll1d(20) <= this.danger) { // 1 danger = 5%, 2 danger = 10%, etc.
			r += "\nCOMBAT!\n";
			this.state = "COMBAT";
			this.getRandomEnemy();
			r += "Enemy: " + this.refData.enemies[this.enemyIndex].name;
		} else {
			if (this.danger > 10) {
				r += "\nDanger - You may want to move on from this area before something finds you.";
			}
		}
		return r;
	}
	
	this.getRandomEnemy = function () {
		var numberOfPossibleEnemies = this.refData.enemies.length;
		var landDiff = this.refData.lands[this.landKey].diff;
		this.enemyIndex = (this.roll1d(numberOfPossibleEnemies) - 1);
		var diffDiff = this.refData.enemies[this.enemyIndex].diff - landDiff;
		console.log("land diff", landDiff, "enemy diff", this.refData.enemies[this.enemyIndex].diff
			,"diffDiff", diffDiff, "rolling diff", this.rollingDifficulty);
		if (diffDiff == 0) {
			// Enemy matches difficulty of land; this is ideal
		} else if (diffDiff > 0) {
			if (diffDiff > this.rollingDifficulty) {
				// Too high, choose another
				this.getRandomEnemy();
				this.rollingDifficulty += 1; //diffDiff;
			} else {
				// Keep this enemy even though it's high
				this.rollingDifficulty = 0;
			}
		} else { // diffDiff < 0
			if (diffDiff < this.rollingDifficulty) {
				// Too low, choose another
				this.getRandomEnemy();
				this.rollingDifficulty += -1; //diffDiff;
			} else {
				// Keep this enemy even though it's low
				this.rollingDifficulty = 0;
			}			
		}
		if (this.rollingDifficulty > 3) this.rollingDifficulty = 3;
		else if (this.rollingDifficulty < -3) this.rollingDifficulty = -3;
	}
	
	
	this.passTime = function (rounds) {
		for (var i = 0; i < rounds; i++) {
			switch(this.roll1d(4)) {
				case 1:
					this.modify("full", -1);
					break;
				case 2:
					this.modify("quench", -1);
					break;
				case 3:
					this.modify("health", 1);
					break;
				case 4:
					this.modify("rads", -0.5);
					break;
				default:
				break;					
			}
		} // end for loop
		this.time += 1;
		if (this.time > 24) this.time = 1;
	}
	
	this.doCombat = function (isOffensive) 
	{
		var r = "Combat...\n";
		var enemy = this.refData.enemies[this.enemyIndex];
		var damageSides = 3 + enemy.diff;
		var diffSides = enemy.diff + 2;
		
		var damage = (this.roll1d(damageSides)) * -1;
		this.modify("health", damage);
		r += "You take damage. Health " + damage 
			+ " (" + ((this.you.health/this.you.size) * 100) + "%)";
	
		if (this.roll1d(diffSides) == 1) {
			r += "\nVictory! You defeat the " + enemy.name + ".";
			this.state = "LOST";
		}
		return r;
	}
	
	this.modify = function (statName, amount) 
	{
		this.you[statName] += amount;
		// If your stat is at zero or lower
		if (this.you[statName] <= 0) {
			if (statName == "quench") {
				this.modify("health", -1);
			} else if (statName == "full") {
				this.modify("health", -1);
			} else if (statName == "health") {
				this.state = "DEAD";
				this.cc.addLine("Oh no, you are dead! Better luck next time.");
				alert("Oh no, you are dead! Better luck next time.");
			}
		} else if (this.you[statName] > this.you.size) {
			if (statName == "rads") {
				var healthFluxBase = (this.you.rads - this.you.size);
				var healthFlux = roll1d(healthFluxBase) - roll1d(healthFluxBase);
				this.cc.addLine(
					"Your radiation gives "
					+ ((healthFlux >= 0) ? "+" : "") + healthFlux 
					+ " health."
				);
				//this.modify("health", healthFlux);
				this.you.health += healthFlux;
			} else {
				this.you[statName] = this.you.size;
			}
		}
	
	}
	
	this.processInput = function (t) {
		//console.log(t, t.charCodeAt(0));
		var r = "Not a valid option: " + t;
		
		switch (t) {
			case "i":
				r = this.getInventoryStringArray();
				break;
			case "u":
				r = this.getYouStringArray();
				break;
			case "o":
				r = this.getWorldStringArray();
				break;
			case "p":
				this.isHelpPromptOn = !this.isHelpPromptOn;
				r = "Full Help Prompt: " + ((this.isHelpPromptOn) ? "ON" : "OFF");
				if (!this.isHelpPromptOn) {
					this.cc.setPrompt();
				}
				break;
			case this.enterCharacter:
			case "h":
			case "?":
				r = this.getHelpStringArray(true);
				break;
			default:
		
				switch (this.state) {
					case "LOST": 
						if (t == "w") {
							r = this.wander();
						} else if (t == "s") {
							r = this.search();
						} else if (t == "r") {
							r = this.rest();
						}
						break;
					case "SPOT": 
						// ***
						break;
					case "ENCOUNTER": 
						// ***
						break;
					case "COMBAT":
						switch (t) {
							case "a":
								r = this.doCombat(true);
								break;
							case "s":
								r = "That's not a wise idea. This enemy will surely kill you."; 
								//this.doSurrender();
								break;
							case "d":
								r = this.doCombat(false);
								break;
							case "w":
								r = "You flee!";
								this.state = "LOST";
								break;
							default:
							break;
						}
						break;
					default:
					break;
				}
			break;	
		}
		if (this.isHelpPromptOn) {
			this.cc.setPrompt( this.getHelpStringArray(false)[0] );
		}
		return r;
	}
	
	this.isDay = function () {
		return ((this.time >= 6 && this.time <= 20) ? true : false);
	}
	
	
	//================= GET Text Functions
	
	this.getWorldStringArray = function () {
		var s = [];
		s.push("Location: " + this.refData.lands[this.landKey].name);
		s.push("Time: " + ((this.time + 11) % 12 + 1) + ":00"
			+ ((this.time >= 12) ? " PM" : " AM")
			+ (this.isDay() ? " (Day)" : " (Night)")
		);
		return s;
	}	
	
	this.getHelpStringArray = function (isFull) {
		var s = [];
		var h = this.stateObjects[this.state].help + ", [?] Help";
		if (isFull) {
			h += ", [u] You, [i] Inventory, [o] Location &amp; Time, [p] Toggle Full Prompt";
		}
		s.push(h);
		return s;
	}
	
	this.getInventoryStringArray = function () {
		var s = [];
		s.push("~~~~ Your stuff ~~~~");
		//s.push("(P = Protection, D = Durability)");
		s.push(this.getInventoryItemString("Head", this.inv.head));
		s.push(this.getInventoryItemString("Torso", this.inv.torso));
		s.push(this.getInventoryItemString("Legs", this.inv.legs));
		if (typeof this.inv.primaryHand.hands === "number" && this.inv.primaryHand.hands >= 2) {
			s.push(this.getInventoryItemString("Both Hands", this.inv.primaryHand));
		} else {
			s.push(this.getInventoryItemString("Primary Hand", this.inv.primaryHand));
			s.push(this.getInventoryItemString("Secondary Hand", this.inv.secondaryHand));
		}
		return s;
	}
	this.getInventoryItemString = function (locationName, itemObj) {
		var s = "";
		if (itemObj == null) {
			s = locationName + ": Nothing";
		} else {
			s = locationName + ": " + itemObj.name;
			if (typeof itemObj.protection !== 'undefined') {
				s += " [P: " + itemObj.protection + "]";
			}
		}
		return s;
	}
	
	this.getYouStringArray = function () {
		var s = [];
		s.push("Health: " + this.you.health + " / " + this.you.size 
			+ " (" + ((this.you.health/this.you.size) * 100) + "%)");
		s.push("Fullness: " + ((this.you.full/this.you.size) * 100) + "%");
		s.push("Quenched: " + ((this.you.quench/this.you.size) * 100) + "%");
		s.push("Radioactivity: " + ((this.you.rads/this.you.size) * 100) + "%");
		
		return s;
	}

	//================= Helper Functions
	
	this.roll1d = function (sides) {
		return (Math.floor(Math.random()*sides) + 1);
	}
	
	this.cloneDataObject = function (o) {
		return JSON.parse(JSON.stringify(o));
	}
	
	//================= Construction
	
	this.construction = function () {
		var o = this;
		this.cc.submitCallback = function (t) {
			var r = o.processInput(t);
			return r;
		}
		this.cc
			.stopInput()
			.addLine("   ( ( ( (((((    O M I C R O N    ))))) ) ) )\n       A Meandering Post-Apocalyptic Game")
			//.addDelay(1000)
			.addNewLine()
			.addLine("You are living in a world that was ravaged by a radioactive war two generations before your birth.")
			.addLine("Press u to see more about you.")
			.addLine("\nYou find yourself in a wasteland with only a few possessions.")
			.addLine("Press i to see your inventory.")
			.addLine("\nYou are free to choose your own destiny.")
			.addLine("Press ? to see what actions you can take at any time.")
			.rush()
			.acceptOneCharacterInput();
			//.acceptTextEnterInput();
	}
	this.construction();
}






var OmicronData = {
	"lands" : {
		"GGH" : {
			"name" : "Green-Glow Hills"
			,"diff" : 1
			,"wanderDescriptions" : ["You are in a field of unnaturally-glowing grasses."]
		}
		,"SEP" : {
			"name" : "Scorched Earth Plains"
			,"diff" : 2
			,"wanderDescriptions" : ["You walk across the dusty, deserted, cracked ground."]
		}
		,"FOT" : {
			"name" : "Forest of Tentacles"
			,"diff" : 3
			,"wanderDescriptions" : ["The warped plants grow in all directions and block out the sky."]
		}
		,"TGC" : {
			"name" : "The Great Crater"
			,"diff" : 4
			,"wanderDescriptions" : ["An eternal smoke emanates from the blasted earth."]
		}
	}
	,"enemies" : [
		{
			"name" : "Glow-hog"
			,"diff" : 1
		},{
			"name" : "Fluorescent Cockroach"
			,"diff" : 1
		},{
			"name" : "Carrot Viper"
			,"diff" : 1
		},{	
			"name" : "Radioactive Rat Swarm"
			,"diff" : 1
		},{			
			"name" : "Giant Cockroach"
			,"diff" : 2
		},{
			"name" : "Scorpion"
			,"diff" : 2
		},{
			"name" : "Dusty Bee-Dog"
			,"diff" : 2
		},{
			"name" : "Squid Vine"
			,"diff" : 3
		},{
			"name" : "Ow'Bear"
			,"diff" : 3
		},{
			"name" : "Panthulhu"
			,"diff" : 3
		},{
			"name" : "Centiger"
			,"diff" : 4
		},{
			"name" : "Mammoth Cave Ape"
			,"diff" : 4
		},{
			"name" : "Radioactive Ghoul-cat"
			,"diff" : 4
		},{
			"name" : "Colossal Two-headed Rhino"
			,"diff" : 5
		},{				
			"name" : "Hypercognitive Yeti"
			,"diff" : 5
		}
	]

};


$(document).ready(function(){
	window.omi = new OmicronClass(OmicronData);
});