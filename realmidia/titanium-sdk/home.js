Alloy.Globals.core.home = {
	
	init: function()
	{	
		Alloy.Globals.core.animation.fade($.home, 0);
		
		Alloy.Globals.core.home.events();
	},
	
	events: function()
	{
		$.left.addEventListener('singletap', Alloy.Globals.core.home.onClickLeft);
		$.right.addEventListener('singletap', Alloy.Globals.core.home.onClickRight);
	},
	
	onClickLeft: function($event)
	{
		if ($.scrollableView.currentPage > 0)
		{
			$prevPage = $.scrollableView.currentPage - 1;
			
			$.scrollableView.scrollToView($prevPage);
		}
	},
	
	onClickRight: function($event)
	{		
		if ($.scrollableView.currentPage < $.scrollableView.views.length - 1)
		{
			$nextPage = $.scrollableView.currentPage + 1;
			
			$.scrollableView.scrollToView($nextPage);
		}
	},
	
	show: function()
	{
		//$.home.show();
		
		Alloy.Globals.core.animation.fade($.home, 1);
		
		Alloy.Globals.core.character.show('home');
		
		Alloy.Globals.core.character.moveToTopLeft();
	},
	
	hide: function()
	{
		//$.home.hide();
		
		Alloy.Globals.core.animation.fade($.home, 0);
	},
	
	setData: function($json)
	{
		$views = [];
		
		for ($i in $json)
		{
			$image = $json[$i];
			
			$imageView = Titanium.UI.createImageView({image: Alloy.Globals.core.getFilePath($image)});
			
			$views.push($imageView);
			
			Alloy.Globals.core.downloader.downloadFile($image);
		}
		
		$.scrollableView.views = $views;
	}
	
};

Alloy.Globals.core.home.init();