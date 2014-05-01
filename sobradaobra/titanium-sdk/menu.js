Alloy.Globals.core.menu = {
	
	init: function()
	{
		Alloy.Globals.core.menu.events();
	},
	
	events: function()
	{
		$.container.addEventListener('swipe', Alloy.Globals.core.menu.onSwip);
		$.container.addEventListener('singletap', Alloy.Globals.core.menu.onClickContainer);
		$.logout.addEventListener('singletap', Alloy.Globals.core.menu.onClickLogout);
		$.dialogLogout.addEventListener('click', Alloy.Globals.core.menu.onClickDialogLogout);
		
		$.ads.addEventListener('singletap', Alloy.Globals.core.menu.onClickItemMenu);
		$.reviews.addEventListener('singletap', Alloy.Globals.core.menu.onClickItemMenu);
		$.liked.addEventListener('singletap', Alloy.Globals.core.menu.onClickItemMenu);
	},
	
	onClickItemMenu: function(event)
	{
		$id = event.source.id;
		
		$logged = Titanium.App.Properties.getObject('logged');
		$userIdObjects = $logged.id_objects;
		
		Alloy.Globals.core.menu.close();
		
		Alloy.Globals.core.main.openProfile($userIdObjects, $id);
	},
	
	onClickLogout: function(event)
	{
		$.dialogLogout.show();
	},
	
	onClickDialogLogout: function(event)
	{
		switch (event.index)
		{
			case 0:
				Alloy.Globals.core.menu.logout();
			break;
		}
	},
	
	logout: function()
	{		
		Titanium.App.Properties.setString('token', '');
		Titanium.App.Properties.setObject('logged', '');
		
		Alloy.Globals.core.main.destroy();
		Alloy.Globals.core.menu.destroy();
		
		Alloy.Globals.core.index.init();
	},
	
	onClickContainer: function(event)
	{
		if (event.source == $.container)
		{
			Alloy.Globals.core.menu.close();
		}
	},
	
	onSwip: function(event)
	{
		if (event.direction == 'left')
		{
			Alloy.Globals.core.menu.close();
		}
	},
	
	close: function()
	{
		$slideLeft = Titanium.UI.createAnimation({left: -261, duration: 300});
		$fadeOut = Titanium.UI.createAnimation({opacity: 0, duration: 150});
		
		$.root.animate($slideLeft, function(){
			$.container.animate($fadeOut, function(){
				Alloy.Globals.menu.getView().close();
			});
		});
	},
	
	open: function()
	{
		Alloy.Globals.menu.getView().open();
		
		$slideRight = Titanium.UI.createAnimation({left: 0, duration: 300});
		$fadeIn = Titanium.UI.createAnimation({opacity: 1, duration: 150});
		
		$.container.animate($fadeIn, function(){
			$.root.animate($slideRight);
		});
	},
	
	infos: function(_callback)
	{
		Alloy.createCollection('users').fetch({url: Alloy.CFG.api + 'users/logged', success: function($model, $data){
			Alloy.Globals.core.menu.onGetLogged($model, $data);
			
			if (_callback){ _callback(); };
		}});
	},
	
	onGetLogged: function($model, $data)
	{
		if ($data.success)
		{
			Titanium.App.Properties.setObject('logged', $data.logged);
		
			$logged = Titanium.App.Properties.getObject('logged');
			
			$.photo.image = $logged.photo || $.photo.image;
			$.name.text = $logged.name;
			$.telephone.text = $logged.telephone || '-';
			$.location.text = $logged.city && $logged.state ? $logged.city + ', ' + $logged.state : $logged.address || '-';
			$.description.text = $logged.description || 'Adicione uma descrição para o seu perfil.';
		}
		
	},
	
	destroy: function()
	{
		$.container.close();
		
		$.destroy();
	}
};

Alloy.Globals.core.menu.init();