var Alloy = require('alloy');

exports.definition = {
	config: {
		url: Alloy.CFG.api + "ads",		
		adapter: {
			type: "restapi",
			collection_name: "ads"
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			// extended functions and properties go here
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			// extended functions and properties go here
		});

		return Collection;
	}
};