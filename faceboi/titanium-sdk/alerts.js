url = Alloy.CFG.api + 'alerts';

client = Titanium.Network.createHTTPClient({
	
	onload: function(e)
	{
		received = JSON.parse(this.responseText);
		
		if (received.success)
		{
			alerts = received.alerts;
			
			if (alerts && alerts.length > 0)
			{
				$.title.text = "IHHH RAPAZ, CHEGOU BOMBA P/ VOCÊ:";
				for (i in alerts)
				{
					alert = alerts[i];
					
					createAlert(alert);
				}
			}
			else
			{
				$.title.text = "NENHUMA PISTA ATÉ AGORA. DEU SORTE!";
			}
		}
	},
	onerror: function(e)
	{
		$.dialogError.show();
	},
	timeout: 5000,
	enableKeepAlive: false
});

client.open("POST", url);
client.send({
	id_to: Titanium.App.Properties.getString('id_facebook'),
	access_token: Alloy.Globals.Facebook.getAccessToken()
});

function createAlert(alert)
{
	viewAlert = Titanium.UI.createView();
	$.addClass(viewAlert, 'alert');
	
	labelDate = Titanium.UI.createLabel({text: 'Há ' + timeAgo(alert.created)});
	$.addClass(labelDate, 'dateAlert');
	
	viewTags = Titanium.UI.createView();
	$.addClass(viewTags, 'tags');
		
	tags = alert.tags.split(',');
	
	for (i in tags)
	{
		tag = tags[i];
		
		hashtag = '#' + tag;
		sizeWidth = Alloy.Globals.getTextLength(hashtag, {font: {fontSize: 15, fontFamily: "HelveticaNeue-ThinCond"}});
		
		viewTag = Titanium.UI.createView({width: sizeWidth});
		labelTag = Titanium.UI.createLabel({text: hashtag, width: sizeWidth});
		
		$.addClass(viewTag, 'tag tagSelected');
		$.addClass(labelTag, 'labelTag');
		
		viewTag.add(labelTag);
		viewTags.add(viewTag);
	}
	
	viewAlert.add(labelDate);
	viewAlert.add(viewTags);
	
	$.containerAlerts.add(viewAlert);
}

function timeAgo(timestamp)
{
	return Alloy.Globals.moment(timestamp).fromNow(true);
}

Alloy.Globals.helper.loadFacebookAvatar($.photo, Titanium.App.Properties.getString("id_facebook"), 82, 82);

$.alerts.addEventListener('close', function(e){
	$.destroy();
});