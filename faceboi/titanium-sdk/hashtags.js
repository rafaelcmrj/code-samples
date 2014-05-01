Alloy.Globals.hashtags = {
	
	inited: false,
	hashtags: [],
	lastUpdate: 0,
	
	init: function()
	{
		if (!Alloy.Globals.hashtags.inited || Alloy.Globals.hashtags.expired())
		{
			Alloy.Globals.hashtags.inited = true;
			Alloy.Globals.hashtags.lastUpdate = Alloy.Globals.moment().unix();
			
			Alloy.Globals.hashtags.load();
		}
	},
	
	expired: function()
	{
		return Alloy.Globals.moment().unix() - Alloy.Globals.hashtags.lastUpdate > 86400;
	},
	
	load: function()
	{	
		url = Alloy.CFG.api + 'hashtags';

		client = Titanium.Network.createHTTPClient({
			
			onload: function(e)
			{
				received = JSON.parse(this.responseText);
			
				if (received.success)
				{
					Alloy.Globals.hashtags.parse(received.hashtags);
				}
			},
			timeout: 5000,
			enableKeepAlive: false
		});
		
		client.open("POST", url);
		client.send({
			access_token: Alloy.Globals.Facebook.getAccessToken()
		});
	},
	
	parse: function(hashtags)
	{
		Alloy.Globals.hashtags.hashtags = hashtags;
		
		Alloy.Globals.preloader.hide();
	}
	
};
