function closeHelp()
{
	$animation = Titanium.UI.createAnimation({top: Titanium.Platform.displayCaps.platformHeight, duration: 300});
	$.help.close($animation);
}

function mountHashtags()
{
	hashtags = Alloy.Globals.hashtags.hashtags;
	
	for (hashtag in hashtags)
	{
		description = hashtags[hashtag];		
		hashtag = '#' + hashtag;
		
		sizeWidth = Alloy.Globals.getTextLength(hashtag, {font: {fontSize: 15, fontFamily: "HelveticaNeue-ThinCond"}});
		margin = 7;
		
		viewTag = Titanium.UI.createView({width: sizeWidth + (margin * 2)});
		labelTag = Titanium.UI.createLabel({text: hashtag, width: sizeWidth});
		
		$.addClass(viewTag, 'tag');
		$.addClass(labelTag, 'labelTag');
				
		viewTag.add(labelTag);
		
		$.scrollView.add(viewTag);
		
		viewDescription = Titanium.UI.createView();
		labelDescription = Titanium.UI.createLabel({text: description});
		
		$.addClass(viewDescription, 'description');
		$.addClass(labelDescription, 'labelDescription');
				
		viewDescription.add(labelDescription);
		
		$.scrollView.add(viewDescription);
	}
}

mountHashtags();