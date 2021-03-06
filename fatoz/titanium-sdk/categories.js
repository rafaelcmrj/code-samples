exports.definition = {
	config: {
		columns: {
		    "title": "string",
		    "description": "string",
		    "image": "string",
		    "icon": "string"
		},
		adapter: {
			type: "acs",
			collection_name: "categories"
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