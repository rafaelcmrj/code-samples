var args = arguments[0] || {};

categoryId = args.categoryId || '';
var matchId;
var mountReceived = false;
var fighterReceived = false;

function init(){
	joinRoom();
	banner();
}

function banner(){
	Alloy.Globals.showBanner($.window, 'roomQueue', 'bottom');
}

function socketCreatingMatch(e){
			
	Alloy.Globals.Cloud.Users.query({
	    page: 1,
	    per_page: 1,
	    where: {
	        id:e.fighterId 
	    }
	}, function (e) {
	    if (e.success) {		    					
			// $.searchPlayer.visible = false;
			$.addClass($.searchPlayer, 'visibleFalse');					
			$.profileB.visible = true;
			$.trophy.visible = true;
			$.profileTitleB.text = e.users[0].first_name + " " + e.users[0].last_name;
			
			Alloy.Globals.loadPhoto($.imageProfileB, 'image', e.users[0].custom_fields.profile_image);

			Alloy.Globals.loadPhoto($.profileB, 'backgroundImage', e.users[0].custom_fields.cover_image);

			fighterReceived = true;

			if(mountReceived){
				mountMatch();
			}

			
	    } else {
	        alert('Error:\n' +
	            ((e.error && e.message) || JSON.stringify(e)));
	    }
	});
}

function socketMountMatch(e){
	mountReceived = true;
	matchId = e.matchId;
	if(fighterReceived){
		mountMatch();
	}		
	
}

function joinRoom(){
	 showMe();

	if(categoryId){
		Titanium.App.fireEvent('websocket.dispatchEvent', { 
			event:'joinRoom', 
			roomId: categoryId
		});
	}
}

function mountMatch(){
	$.roomQueue.close();
	Alloy.createController('game', {matchId: matchId});
}

function showMe(){
	$.profileTitleA.text = Ti.App.Properties.getString('userName');
	
	Alloy.Globals.Cloud.Users.showMe(function (e) {
	    if (e.success) {
	        var user = e.users[0];
	        
	        Alloy.Globals.loadPhoto($.imageProfileA, 'image', user.custom_fields.profile_image);
	        
	        Alloy.Globals.loadPhoto($.coverA, 'backgroundImage', user.custom_fields.cover_image);
	    }
	});
}

$.cancelMatch.addEventListener('click', function(e){
	Titanium.App.fireEvent('websocket.dispatchEvent', { 
		event:'leaveRoom',
		roomId: categoryId
	});
	
	$.roomQueue.close();
	Alloy.createController('home');
});

Titanium.App.addEventListener('websocket.creatingMatch', socketCreatingMatch);		
Titanium.App.addEventListener('websocket.mountMatch', socketMountMatch);

$.roomQueue.addEventListener('close', function(e) {
	Titanium.App.removeEventListener('websocket.creatingMatch', socketCreatingMatch);		
	Titanium.App.removeEventListener('websocket.mountMatch', socketMountMatch);

	$.destroy();
	$.off();
});

init();

$.roomQueue.open();

