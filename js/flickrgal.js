if (typeof window !== 'undefined') window.addEventListener("load", function(event) {
    var searchTerm
    if (window.location.search) {
        searchTerm = window.location.search.slice(1);
        console.log("searchTerm: " + searchTerm);
    }
    FlickrGal.init(searchTerm);
});

function Flickr(options) {
	var APIKEY = options.apiKey;
	var USERID = options.userId;

	function handleRequest(event) {
		var request = event.target;
		var	responseData = JSON.parse(request.responseText);

		if (request.readyState === XMLHttpRequest.DONE) {
			if (request.status === 200) {

				switch (request.type){
					case 'collections':
						build_collections(responseData, options);
						var currentState = gallery.imageGrid.childNodes;
						Array.prototype.forEach.call(currentState, function(node) {
							FlickrGal.prevState.push(node);
						});
						break;

					case 'photosets':
						insert_albums(responseData, request.id);
						break;
				}
			} else {
				console.log('Flickr ' + request.type + ' request failed!');
			}
		}
	}

	function makeUrl(type, id) {
		var endpoint = 'https://api.flickr.com/services/rest/?method=';

		// Request methods
		switch(type) {
			case 'collections':
				endpoint += 'flickr.collections.getTree'
				break;
			case 'photosets':
				endpoint += 'flickr.photosets.getPhotos'
					+ '&photoset_id='
					+ id
					+ '&extras=description'
				break;
		}

		// Common params
		endpoint += '&format=json'
			+ '&nojsoncallback=1'
			+ '&api_key='
			+ APIKEY
			+ '&user_id='
			+ USERID;

		return endpoint;
	}

	function makeApiRequest(type, id) {
		var request 	= new XMLHttpRequest();

		request.open('GET', makeUrl(type, id), true);
		request.type = type;
		request.id = id;
		request.onload = handleRequest;
		request.send();
	}

	return {
		makeApiRequest: makeApiRequest
	}
}

if (typeof window !== 'undefined') window.FlickrGal = {
	init: function(searchTerm) {
			this.albumCount = 0;
			this.searchTerm = searchTerm;
			this.albums = []; // Stores full album / photoset information
			this.lightboxSet = []; // Stores the set of images open in lightbox
			this.prevState = []; // Stores objects to be re-inserted later

			window.gallery = $('#flickrgal');

		  if (gallery) {
				// FlickrGal template
				gallery.className = 'hide';

				var lightboxTemplate = document.createElement('div');
				lightboxTemplate.id = 'lightbox';
				lightboxTemplate.className = 'hide';

				var lightboxUi = document.createElement('div');
				lightboxUi.id = 'lightbox-ui';

				var imageStageEl = document.createElement('div');
				imageStageEl.id = 'stage';

				var	lightboxControls = '<div class="close" title="Close (Esc)"></div>'
					+ '<div id="controls"><div id="arrow-left" class="prev" title="Prev"></div>'
					+ '<div id="arrow-right" class="next" title="Next"></div></div>';
				var	infoEl = '<div id="info_container"><div id="info"><div id="title"></div>'
					+ '<div id="description"></div></div></div>';
				var imageBoxEl = '<div id="image-box-container"><div><div id="image-box"></div></div></div>';

				lightboxUi.innerHTML = lightboxControls + infoEl;
				imageStageEl.innerHTML = imageBoxEl;
				lightboxTemplate.appendChild(lightboxUi);
				lightboxTemplate.appendChild(imageStageEl);

				var	loadingGallery = '<div id="loading-gallery"><div>Loading...</div></div>';
				var imageGridBox = '<div id="image-grid"></div>';

				gallery.insertAdjacentHTML('afterbegin', loadingGallery);
				gallery.insertAdjacentHTML('beforeend', imageGridBox);
				gallery.appendChild(lightboxTemplate);

				gallery.imageGrid = $('#image-grid');
				var lightbox = $('#lightbox');

				lightbox.image = $('#image-box');
				lightbox.imageTitle = $('#info > #title');
				lightbox.imageDesc = $('#info > #description');
				gallery.loading = $('#loading-gallery');
				// End FlickrGal template
		  }

			this.loadGallery({
				apiKey: gallery.getAttribute('data-apikey'),
				userId: gallery.getAttribute('data-userid')
			});
	},
	loadGallery: function(options) {
		if(!options.apiKey) throw "Api key not set";
	  if(!options.userId) throw "User ID not set";

		// Get the collection names
		options.set = to_lower_case(JSON.parse(gallery.getAttribute('data-collections')));
		options.set.indexOf('all') >= 0 ? options.getAll = true : options.getAll = false;
		options.setHasTitles = gallery.hasAttribute('data-titles') ? true : false;

		[].forEach.call(
			document.querySelectorAll(".close,.prev,.next"),
			function(el) {
				el.addEventListener("click", handle_click);
			}
		)

		window.addEventListener('keydown', handle_keys);

		this.gallery = new Flickr({
			apiKey: options.apiKey,
			userId: options.userId,
			getAll: options.getAll,
			set: options.set,
			setHasTitles: options.setHasTitles
		});

		this.gallery.makeApiRequest('collections');
	}
}

// FUNCTIONS
// Selectors
function $(el){
		return document.querySelector(el);
}
//Event Handlers
function handle_click(event){
	var el = event.currentTarget;
	var type = el.className;
	console.log(type)

	switch(type){
		case 'navigate-back':
		gallery.imageGrid.innerHTML = "";
		for(var element in FlickrGal.prevState) {
			gallery.imageGrid.appendChild(FlickrGal.prevState[element]);
		}

		gallery.loading.style.display = 'none';
		break;
		case 'album':
    if (typeof window !== 'undefined') window.pageYOffset = document.documentElement.scrollTop = document.body.scrollTop = 0;
			var requestedAlbum = el.id;
			insert_images(requestedAlbum);
			break;
		case 'image':
			var	requestedImage = el.id;
			var album = el.getAttribute('album-id');
			if (is_link(requestedImage, album)) {
				redirect_to_link(requestedImage, album);
				console.log('link');
			} else {
				insert_lightbox(requestedImage, album);
				lightbox.classList.remove('hide');
				console.log('lightbox:');
			}
			break;
		case 'close':
			lightbox.classList.add('hide');
			break;
		case 'prev':
			prev();
			break;
		case 'next':
			next();
			break;
	}
}
function handle_keys(event){
	var key = event.keyCode;
	switch(key){
		case 39:
			next();
			break;
		case 37:
			prev();
			break;
		case 27:
			lightbox.classList.add('hide');
			break;
	}
}
//End Event Handlers
function prev(){
	var focus = document.getElementById(FlickrGal.lightboxSet[0]);
	focus.classList.add('hide-stage-image');
	var move = FlickrGal.lightboxSet.pop();
	FlickrGal.lightboxSet.unshift(move);
	focus = document.getElementById(FlickrGal.lightboxSet[0])
	focus.classList.remove('hide-stage-image');
	lightbox.imageTitle.innerHTML = focus.getAttribute('data-title');
	lightbox.imageDesc.innerHTML = focus.getAttribute('data-description');
}
function next(){
	var focus = document.getElementById(FlickrGal.lightboxSet[0]);
	focus.classList.add('hide-stage-image');
	var move = FlickrGal.lightboxSet.shift();
	FlickrGal.lightboxSet.push(move);
	focus = document.getElementById(FlickrGal.lightboxSet[0])
	focus.classList.remove('hide-stage-image');
	lightbox.imageTitle.innerHTML = focus.getAttribute('data-title');
	lightbox.imageDesc.innerHTML = focus.getAttribute('data-description');
}
// Create New blank elements
function Element(type){
	this.el = document.createElement('div');
	this.el.className = type;
	this.loading = document.createElement('div');
	this.loading.className = 'image-loading';
	this.inner = document.createElement('div');
	this.inner.className = 'inner';
	this.dummy = document.createElement('div');
	this.dummy.className = 'dummy';
	this.title = document.createElement('div');
	this.desc = document.createElement('div');
}
// Finds position in albums array for a given id
function get_album_pos(id){
	var position = "";
	for (var album in FlickrGal.albums){
		FlickrGal.albums[album].id == id ? position = album : false
	}
	return position;
}
function get_album_id_by_search_term(searchTerm){
	var searchTerm = searchTerm.replace(/["'?= ]*/gi, "").toLowerCase();
	var id = "";
	for (var album in FlickrGal.albums){
		var albumName = FlickrGal.albums[album].title.replace(/["'?= ]*/gi, "").toLowerCase();
		if (albumName.startsWith(searchTerm)) {
			id = FlickrGal.albums[album].id;
		}
	}
	return id;
}
function to_lower_case(array){
	for(name in array){
			array[name] = array[name].toString().toLowerCase();
	}
	return array;
}
// Appends background images and fades them in
function fade_in_image(id, url){
	var newElement = document.getElementById(id);
		newElement.style.backgroundImage = 'url(' + url + ')';
	var isLoading = newElement.querySelector('.image-loading');
		isLoading ? isLoading.style.opacity = 0 : false;
}
function build_image_url(image, size){
	var url = 	'https://farm'
				+ image.farm
				+ '.staticflickr.com/'
				+ image.server
				+ '/'
				+ image.id
				+ '_'
				+ image.secret
				+ '_'
				+ size
				+ '.jpg';
	return url;
}
function build_album(collection, collectionName, collectionID, options) {
	var sets = collection.set
	for(var set in sets){
		FlickrGal.albums.push({
			id: sets[set].id,
			collectionName: collectionName,
			collectionID: collectionID, // Not hooked up yet
			title: sets[set].title,
			description: sets[set].description,
			images: []
		});
	}
	if (options.setHasTitles) {
		gallery.imageGrid.insertAdjacentHTML('beforeend', '<h3 class="collection-title">'
			+ collectionName
			+ '</h3><div class="collection '
			+ 'collection-'
			+ collectionID
			+ '"></div>');
	}
}
// 	Builds collections of albums from flickr 'photosets'
function build_collections(data, options) {
		var allCollections = data.collections.collection;
		for(var collection in allCollections){
			var collectionObject = allCollections[collection];
			var collectionName = collectionObject.title;
			var collectionID = collectionObject.id;

			if (options.getAll) {
				build_album(collectionObject, collectionName, collectionID, options);
			}else if (options.set.indexOf(collectionName.toLowerCase()) >= 0) {
				build_album(collectionObject, collectionName, collectionID, options);
			}
		}

		gallery.loading.style.display = 'none';

		// Build the albums for a collection
		Array.prototype.forEach.call(FlickrGal.albums, function(album) {
			var newAlbum = new Element('album');

			newAlbum.el.id = album.id;
			newAlbum.title.innerHTML = album.title;
			newAlbum.el.setAttribute('collection-name', album.collectionName);
			newAlbum.el.setAttribute('collection-id', album.collectionID);

			// Todo, hook up descriptions somewhere
			newAlbum.inner.appendChild(newAlbum.title);
			newAlbum.el.appendChild(newAlbum.loading);
			newAlbum.el.appendChild(newAlbum.dummy);
			newAlbum.el.appendChild(newAlbum.inner);
			newAlbum.el.addEventListener('click', handle_click);

			if (options.setHasTitles) {
				gallery.imageGrid.querySelector('.collection-' + newAlbum.el.getAttribute('collection-id')).appendChild(newAlbum.el);
			}else{
				gallery.imageGrid.appendChild(newAlbum.el);
			}
		});
		// Request images for albums
		Array.prototype.forEach.call(FlickrGal.albums, function(album) {
			FlickrGal.gallery.makeApiRequest('photosets', album.id);
		});        
		// Initial gallery fade in
		gallery.classList.remove('hide');
};
function insert_albums(data, id){
	FlickrGal.albumCount++;
	// Organise and push image data to albums array
	var position = get_album_pos(id);
	var allImages = data.photoset.photo;
	Array.prototype.forEach.call(allImages, function(image) {
		var imageObject = {};
		var primaryImageUrl;
		imageObject.id = image.id;
		imageObject.farm = image.farm;
		imageObject.server = image.server;
		imageObject.secret = image.secret;
		imageObject.title = image.title;
		imageObject.description = image.description;
		imageObject.is_primary = image.isprimary;
		FlickrGal.albums[position].images.push(imageObject);

		// Set album cover image
		if (imageObject.is_primary == 1) {
			primaryImageUrl = build_image_url(imageObject, 'n');
			// Append image and fade it in
			fade_in_image(id, primaryImageUrl);
		}else{
			// Fallback to set the primary photo to the first photo returned in the album is isprimary is not set
			primaryImageUrl = build_image_url(FlickrGal.albums[position].images[0], 'n');
			fade_in_image(id, primaryImageUrl);
		}
	});

	// code to start directly inside an album, but wait until all albums are loaded first
	if (FlickrGal.albumCount === FlickrGal.albums.length && FlickrGal.searchTerm) {
		var gotoAlbumId = get_album_id_by_search_term(FlickrGal.searchTerm);
		if (gotoAlbumId)
			insert_images(gotoAlbumId);
	}
}
function insert_images(id){
	gallery.imageGrid.innerHTML = "";

	var position = get_album_pos(id);
	var images = FlickrGal.albums[position].images
	var size = 'z';

	Array.prototype.forEach.call(images, function(image) {
		var imageUrl = build_image_url(image, 'n');
		var newImage = new Element('image');
		var imageID = image.id;

		newImage.el.id = imageID;
		newImage.el.setAttribute('album-id', id);

		newImage.el.appendChild(newImage.dummy);
		newImage.el.appendChild(newImage.inner);
		newImage.el.addEventListener('click', handle_click);
		gallery.imageGrid.appendChild(newImage.el);

		// Append image and fade it in
		fade_in_image(imageID, imageUrl);
	});
    
    var navigateBack = new Element('image');
        navigateBack.inner.classList.remove('inner');
        navigateBack.inner.classList.add('navigate-back');
        navigateBack.inner.innerHTML = '<div>Back</div>';
        navigateBack.inner.addEventListener('click', handle_click);
        navigateBack.el.appendChild(navigateBack.dummy);
        navigateBack.el.appendChild(navigateBack.inner);
        gallery.imageGrid.appendChild(navigateBack.el);
}
function insert_lightbox(id, album){
	FlickrGal.lightboxSet = [];
	var position = get_album_pos(album);
	var callingAlbum = FlickrGal.albums[position].images;
	var stageID = 'stage-' + id;

	lightbox.image.innerHTML = '';
	Array.prototype.forEach.call(callingAlbum, function(image) {
		var currentImage = document.getElementById(image.id);
		var initialUrl = currentImage.style.backgroundImage;
		var largeImageUrl = build_image_url(image, 'b');
		var newImage = document.createElement('img');
			newImage.id = 'stage-' + image.id;
			newImage.classList.add('hide-stage-image');
			newImage.style.backgroundImage = initialUrl;
			newImage.style.backgroundSize = 'contain';
			newImage.style.maxHeight = '100%';
			newImage.style.maxWidth = '100%';
			newImage.style.position = 'absolute';
			newImage.style.margin = 'auto';
			newImage.style.top = 0;
			newImage.style.right = 0;
			newImage.style.bottom = 0;
			newImage.style.left = 0;
			newImage.setAttribute('data-title', image.title);
			newImage.setAttribute('data-description', image.description._content);
			newImage.setAttribute('src', largeImageUrl);
			newImage.setAttribute('title', image.title);
			newImage.setAttribute('alt', image.title);

			// Append divs with large image inserts
//			var largeImageUrl = build_image_url(image, 'b')
//			newImage.innerHTML = '<div style="background-image: url('
//				+ largeImageUrl
//				+ ')"></div>';
//			newImage.innerHTML = '<img src="' + largeImageUrl + '" title="' + image.title + '" alt="' + image.title + '" style="max-height:100%; max-width:100%; position: absolute; margin: auto; top: 0; right: 0; bottom: 0;left: 0;">'

			lightbox.image.appendChild(newImage);
			FlickrGal.lightboxSet.push(newImage.id);
	});

	var activePos = FlickrGal.lightboxSet.indexOf(stageID);
	var top = FlickrGal.lightboxSet.slice(activePos);
	var bottom = FlickrGal.lightboxSet.slice(0, activePos);

	FlickrGal.lightboxSet = top.concat(bottom);

	// Set the selected image title and description in the lightbox
	lightbox.imageTitle.innerHTML = document.getElementById(FlickrGal.lightboxSet[0]).getAttribute('data-title');
	lightbox.imageDesc.innerHTML = document.getElementById(FlickrGal.lightboxSet[0]).getAttribute('data-description');

	document.getElementById(stageID).classList.remove('hide-stage-image');
}

function redirect_to_link(id, album){
    var position = get_album_pos(album);
	var callingAlbum = FlickrGal.albums[position].images;

	lightbox.image.innerHTML = '';
    var image = callingAlbum.find(image => {
      return image.id === id
    });
    console.log("image description: " + image.description._content);
    var link = image.description._content
    .replace("<a href='", "")
    .replace("<a href=\"", "")
    .replace("<a href=", "")
    .replace(/\" .*/i, "")
    .replace(/' .*/i, "")
    .replace(/ .*/i, "");
    console.log("cleaned up link: " + link);
    console.log("redirect...");
    window.location.href = link;
}

function is_link(id, album)
{
    var position = get_album_pos(album);
    var callingAlbum = FlickrGal.albums[position].images;

    lightbox.image.innerHTML = '';
    var image = callingAlbum.find(image => {
      return image.id === id
    });
    
    if (image.description._content.startsWith("<a href")
        || image.description._content.startsWith("http")
        || image.description._content.startsWith("www.")
    )
    {
        return true;
    }
    else {
        return false;
    }
}
