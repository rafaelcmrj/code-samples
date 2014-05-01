Alloy.Globals.core.ads = {
	
	id: 0,
	ad: null,
		
	events: function()
	{
		$.email.addEventListener('singletap', Alloy.Globals.core.ads.email);
		$.telephone.addEventListener('singletap', Alloy.Globals.core.ads.telephone);
		$.chat.addEventListener('singletap', Alloy.Globals.core.ads.chat);
		$.like.addEventListener('singletap', Alloy.Globals.core.ads.like);
		$.complaint.addEventListener('singletap', Alloy.Globals.core.ads.complaint);
		$.containerPhoto.addEventListener('singletap', Alloy.Globals.core.ads.author);
	},
	
	author: function()
	{
		Alloy.Globals.core.main.openProfile(Alloy.Globals.core.ads.ad.id_objects_users);
	},
	
	email: function()
	{
		$emailDialog = Titanium.UI.createEmailDialog();
		$emailDialog.subject = 'Estou interessado no seu anúncio no Sobra da Obra';
		$emailDialog.toRecipients = [Alloy.Globals.core.ads.ad.author_email];
		$emailDialog.messageBody = 'Olá, estou interessado no seu anúncio: ' + $.title.text;
		$emailDialog.open();
	},
	
	telephone: function()
	{
		Titanium.Platform.openURL('tel:' + Alloy.Globals.core.ads.ad.author_telephone);
	},
	
	chat: function()
	{
		$window = Alloy.createController('conversation').getView();
		Alloy.Globals.core.main.open($window);
		
		$id = Alloy.Globals.core.ads.ad.id_objects_users;
		$name = $.author.text;
		
		Alloy.Globals.core.conversation.read($id, $name);
	},
	
	like: function()
	{
		$data = {};
		$data.to = Alloy.Globals.core.ads.ad.id_objects;
		
		if (Alloy.Globals.core.ads.ad.liked == '1')
		{
			$.removeClass($.like, 'selected');
			Alloy.Globals.core.ads.ad.liked = false;
			$data.liked = 0;
		}
		else
		{
			$.addClass($.like, 'selected');
			Alloy.Globals.core.ads.ad.liked = true;
			$data.liked = 1;
		}
		
		$params = Alloy.Globals.core.helpers.serialize($data);
		
		Alloy.createCollection('liked').fetch({data: $params});
	},
	
	complaint: function()
	{
		$data = {};
		$data.to = Alloy.Globals.core.ads.ad.id_objects;
		
		if (Alloy.Globals.core.ads.ad.complainted == '1')
		{
			$.removeClass($.complaint, 'selected');
			Alloy.Globals.core.ads.ad.complainted = '0';
			$data.complainted = 0;
		}
		else
		{
			$.addClass($.complaint, 'selected');
			Alloy.Globals.core.ads.ad.complainted = '1';
			$data.complainted = 1;
		}
		
		$params = Alloy.Globals.core.helpers.serialize($data);
		
		Alloy.createCollection('complainted').fetch({data: $params});
	},
	
	init: function()
	{
		Alloy.Globals.core.ads.events();
		
		Alloy.Globals.core.ads.postLayout();
		
		Alloy.Globals.core.ads.getRelatedProducts();
	},
	
	show: function()
	{
		
	},
	
	hide: function()
	{
		
	},
	
	read: function($id)
	{
		$ads = Alloy.createCollection('ads');
			
		$data = {};
		$data.id = $id;
		
		$params = Alloy.Globals.core.helpers.serialize($data);
	
		$ads.fetch({success: Alloy.Globals.core.ads.onFetch, data: $params});
	},
	
	onFetch: function($model, $json)
	{
		$ad = $json[0];
		
		Alloy.Globals.core.ads.ad = $ad;
		
		$.title.text = $ad.title;
		$.author.text = $ad.author;
		$.price.text = 'R$ ' + $ad.price;
		$.description.text = $ad.description;
		$.transaction.text = 'Tipo:\n' + Alloy.Globals.core.ads.getTitleKindOfTransactions($ad.id_kind_of_transactions);
		$.condition.text = 'Estado:\n' + Alloy.Globals.core.ads.getTitleKindOfConditions($ad.id_kind_of_conditions);
		$.location.text = 'Local:\n' + $ad.location;
		
		if ($ad.author_photo)
		{
			$.photo.image = $ad.author_photo;
		}
		
		if ($ad.images)
		{
			Alloy.Globals.core.ads.mountImages($ad.images);
		}
		else
		{
			$.gallery.height = 0;
		}
		
		if ($ad.id_kind_of_transactions != 1)
		{
			$.containerPrice.visible = false;
			$.containerPrice.width = 0;
		}
		
		if ($ad.liked == '1')
		{
			$.addClass($.like, 'selected');
		}

		if ($ad.complainted == '1')
		{
			$.addClass($.complaint, 'selected');
		}
		
		if (!$ad.author_email || Alloy.Globals.core.ads.ad.id_objects_users == Titanium.App.Properties.getObject('logged').id_objects)
		{
			$.email.visible = false;
			$.email.width = 0;
			$.email.left = 0;
		}
		
		if (!$ad.author_telephone || Alloy.Globals.core.ads.ad.id_objects_users == Titanium.App.Properties.getObject('logged').id_objects)
		{
			$.telephone.visible = false;
			$.telephone.width = 0;
			$.telephone.left = 0;
		}
		
		if (Alloy.Globals.core.ads.ad.id_objects_users == Titanium.App.Properties.getObject('logged').id_objects)
		{
			$.chat.visible = false;
			$.chat.width = 0;
			$.chat.left = 0;
		}
		
		Alloy.Globals.core.ads.init();
	},
	
	mountImages: function($images)
	{
		$images = $images.split(',');
		
		for ($i in $images)
		{
			$image = $images[$i];
			
			$imageView = Titanium.UI.createImageView({image: $image});
			
			$.gallery.addView($imageView);
		}
	},
	
	postLayout: function()
	{		
		if ($.features.size.height < $.containerDescription.size.height)
		{
			$.features.height = $.containerDescription.size.height;
		}
		else
		{
			$.containerDescription.height = $.features.size.height;
		}
	},
	
	getRelatedProducts: function()
	{	
		$data = {};
		$data.id = Alloy.Globals.core.ads.ad.id;
		$data.related = true;
			
		$params = Alloy.Globals.core.helpers.serialize($data);
	
		$.related.fetch({data: $params, success: Alloy.Globals.core.ads.postLayout});
	},
	
	getTitleKindOfConditions: function($id)
	{
		switch (Number($id))
		{
			case 1:
				return 'Novo';
			break;
			case 2:
				return 'Usado';
			break;
		}
	},
	
	getTitleKindOfTransactions: function($id)
	{
		switch (Number($id))
		{
			case 1:
				return 'Venda';
			break;
			case 2:
				return 'Troca';
			break;
			case 3:
				return 'Doação';
			break;
		}
	}
	
};