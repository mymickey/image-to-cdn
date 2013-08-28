var base = require("base-converter");
function hesher() {
	var id = Math.floor(Math.random() * (100000 - 999000 + 1) + 999000)//+Date.now();
	var hash = base.decTo62(id);
	return hash;
};
module.exports.hesher =hesher;
