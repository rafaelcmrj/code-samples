Alloy.Globals.core.character = {

	interval: 0,
	totalTexts: 0,
	current: 0,
	json: '',
	currentTexts: null,
	
	init: function()
	{
		Alloy.Globals.core.character.events();
	},
	
	events: function()
	{
		
	},

	show: function ($page)
	{
		Titanium.API.info($page);
		
		clearInterval(Alloy.Globals.core.character.interval);
		
		Alloy.Globals.core.character.current = 0;
		
		$.title.text = "";
		
		$car = Alloy.Globals.core.character.json.car;
		
		if ($car.character[$page])
		{		
			Alloy.Globals.core.character.currentTexts = $car.character[$page];
			
			if (Alloy.Globals.core.character.currentTexts.length > 0)
			{
				Alloy.Globals.core.character.totalTexts = Alloy.Globals.core.character.currentTexts.length;
				
				$.image.opacity = 1;
				$.text.opacity = 1;
				
				Alloy.Globals.core.character.setText();
				Alloy.Globals.core.character.interval = setInterval(Alloy.Globals.core.character.setText, 7000);
			}
		}
		else
		{
			Alloy.Globals.core.character.current = 0;
			
			$.image.opacity = 0.3;
			$.text.opacity = 0;
		}		
	},
	
	setText: function()
	{
		if (Alloy.Globals.core.character.current == Alloy.Globals.core.character.totalTexts)
		{
			Alloy.Globals.core.character.current = 0;
		}
		
		$.title.text = Alloy.Globals.core.character.currentTexts[Alloy.Globals.core.character.current];
		
		Alloy.Globals.core.character.current++;
	},
	
	setData: function($json)
	{
		Alloy.Globals.core.character.json = JSON.parse(Titanium.App.Properties.getString('json'));
	},
	
	moveToTopLeft: function()
	{
		$imagePosition = 25;
		$textPosition = $imagePosition + $.image.size.width + 10;
		
		$animateImage = Titanium.UI.createAnimation({left: $imagePosition});
		$animateText = Titanium.UI.createAnimation({left: $textPosition});
		
		$.image.animate($animateImage);
		$.text.animate($animateText);
	},
	
	moveToTopRight: function()
	{
		$imagePosition = Titanium.Platform.displayCaps.platformWidth - $.image.size.width - 25;
		$textPosition = $imagePosition - 10 - $.text.size.width;
		
		$animateImage = Titanium.UI.createAnimation({left: $imagePosition});
		$animateText = Titanium.UI.createAnimation({left: $textPosition});
		
		$.image.animate($animateImage);
		$.text.animate($animateText);
	}	
};

Alloy.Globals.core.character.init();
