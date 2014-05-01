var Cloud = require('ti.cloud');
var deviceToken;

Cloud.Users.login({ login: 'titanium', password: '*****' }, function(e){
	
	if (e.success)
	{
		var user = e.users[0];
		
		getDeviceToken();
	}
	
});

// getting device token
function getDeviceToken(){
    Titanium.Network.registerForPushNotifications({
        types: [
            Titanium.Network.NOTIFICATION_TYPE_BADGE,
            Titanium.Network.NOTIFICATION_TYPE_ALERT,
            Titanium.Network.NOTIFICATION_TYPE_SOUND
        ],
    success:function(e)
    {
        deviceToken = e.deviceToken;

        registerForPush();
    },
    error:function(e)
    {
        //alert("Error: "+e.message);
    },
    callback:function(e)
    {
    	$data = JSON.stringify(e.data);
    	
    	$url = e.data.url;
    	
        $.browser.setUrl($url);
        
        Titanium.UI.iPhone.appBadge = 0;
    }
    });
}

// register for push notification on cloud server
function registerForPush(){
    Cloud.PushNotifications.subscribe({
        channel: 'posts',
        type:'ios',
        device_token: deviceToken
    }, function (e) {
        if (e.success) {
            //alert('Success :'+((e.error && e.message) || JSON.stringify(e)));
        } else {
            //alert('Error:' + ((e.error && e.message) || JSON.stringify(e)));
        }
    });
}

$.browser.addEventListener('beforeload', function(){
	$.back.opacity = $.browser.canGoBack() ? 1 : 0.3;
	$.forward.opacity = $.browser.canGoForward() ? 1 : 0.3;
	
	$.browser.evalJS('document.getElementById("logo").style.display = "none"');
});

$.back.addEventListener('singletap', function(){
	$.browser.goBack();
});

$.forward.addEventListener('singletap', function(){
	$.browser.goForward();
});

$.home.addEventListener('singletap', function(){
	$.browser.setUrl('http://www.macacovelho.com.br');
});

$.reload.addEventListener('singletap', function(){
	$.browser.reload();
});

$.index.open();
