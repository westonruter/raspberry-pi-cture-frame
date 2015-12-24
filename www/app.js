/* global Backbone, _ */
/* exported app */
var app = (function() {
	var self = {
		defaultAppState: {
			currentIndex: parseInt( localStorage.getItem( 'initialIndex' ), 10 ),
			photosCollection: null,
			paused: false,
			slideDuration: parseInt( localStorage.getItem( 'slideDuration' ), 10 ),
			photoFetchInterval: 60 * 1000, /* ms (1 minute) */
			error: null
		},
		maxDuration: 10 * 1000,
		minDuration: 1000
	};
	if ( _.isNaN( self.defaultAppState.currentIndex ) ) {
		self.defaultAppState.currentIndex = 0;
	}
	if ( _.isNaN( self.defaultAppState.slideDuration ) ) {
		self.defaultAppState.slideDuration = 4000;
	}

	$.ajaxSetup({ cache: false });

	_.templateSettings = {
		evaluate:    /<#([\s\S]+?)#>/g,
		interpolate: /\{\{\{([\s\S]+?)\}\}\}/g,
		escape:      /\{\{([^\}]+?)\}\}(?!\})/g,
		variable:    'data'
	};

	self.PhotoModel = Backbone.Model.extend({
		id: null,
		local_src: null,
		datetime: null
	});
	self.PhotosCollection = Backbone.Collection.extend({
		url: '/photo-cache/manifest.json',
		model: self.PhotoModel
	});

	self.AppState = Backbone.Model.extend({

		defaults: self.defaultAppState,

		/**
		 * Convenience method for getting the photos collection.
		 *
		 * @returns {self.PhotosCollection}
		 */
		getPhotosCollection: function () {
			return this.get( 'photosCollection' );
		},

		/**
		 * Get current index.
		 *
		 * @returns Number}
		 */
		getCurrentIndex: function() {
			return this.get( 'currentIndex' );
		},

		/**
		 * Get next index.
		 *
		 * @returns {Number} The next index.
		 */
		getNextIndex: function () {
			var model = this, i;
			i = ( model.get( 'currentIndex' ) + 1 ) % model.getPhotosCollection().length;
			return i;
		},

		/**
		 * Increment current index.
		 *
		 * @returns {Number} The new index.
		 */
		incrementCurrentIndex: function() {
			var model = this;
			model.set( 'currentIndex', model.getNextIndex() );
			return model.get( 'currentIndex' );
		},

		/**
		 * Get previous index.
		 *
		 * @returns {Number}
		 */
		getPreviousIndex: function () {
			var model = this, i;
			i = ( model.get( 'currentIndex' ) - 1 );
			if ( i < 0 ) {
				i = model.getPhotosCollection().length + i;
			}
			return i;
		},

		/**
		 * Decrement current index.
		 *
		 * @returns {Number} The new index.
		 */
		decrementCurrentIndex: function() {
			var model = this;
			model.set( 'currentIndex', model.getPreviousIndex() );
			return model.get( 'currentIndex' );
		}
	});

	self.AppView = Backbone.View.extend({

		/**
		 * Set up the app.
		 *
		 * This is the main app gateway.
		 */
		initialize: function() {
			var view = this;

			view.template = _.template( $( '#root-template' ).html() );

			view.state = new self.AppState({
				photosCollection: view.collection
			} );
			view.collection.on( 'sync', function() {
				view.state.set( 'error', '' );
				view.render();
			} );
			view.collection.on( 'error', function( collection, resp, options ) {
				var error;
				if ( 'Not Found' === options.errorThrown ) {
					error = 'Photo manifest not created yet.';
				} else {
					error = options.errorThrown;
				}
				view.state.set( 'error', error );
				view.render();
			} );
			view.state.on( 'change', function() {
				view.render();

				// Persist the initialIndex in localStorage so that the same photo will appear when app reloads.
				localStorage.setItem( 'initialIndex', view.state.getCurrentIndex() );
				localStorage.setItem( 'slideDuration', view.state.get( 'slideDuration' ) );

				view.resetAutoAdvance();
			} );
			view.resetAutoAdvance();
			setInterval(
				function() {
					view.collection.fetch();
				},
				view.state.get( 'photoFetchInterval' )
			);
		},

		/**
		 * Clear the auto-advance timeout, and then re-set it for the duration if not paused.
		 */
		resetAutoAdvance: function () {
			var view = this;
			if ( view.timeoutId ) {
				clearTimeout( view.timeoutId );
			}
			if ( ! view.state.get( 'paused' ) ) {
				view.timeoutId = setTimeout(
					function () {
						view.state.incrementCurrentIndex();
					},
					view.state.get( 'slideDuration' )
				);
			}
		},

		events: {
			'click .next': 'clickNextButton',
			'click .previous': 'clickPreviousButton',
			'click .pause': 'clickPauseButton',
			'click .speed': 'clickSpeedButton',
			'click .play': 'clickPlayButton'
		},

		/**
		 * Click handler for next button.
		 *
		 * @param {Event} e Event object.
		 */
		clickNextButton: function( e ) {
			e.preventDefault();
			this.state.incrementCurrentIndex();
		},

		/**
		 * Click handler for previous button.
		 *
		 * @param {Event} e Event object.
		 */
		clickPreviousButton: function( e ) {
			e.preventDefault();
			this.state.set( 'paused', true );
			this.state.decrementCurrentIndex();
		},

		/**
		 * Click handler for pause button.
		 *
		 * @param {Event} e Event object.
		 */
		clickPauseButton: function( e ) {
			e.preventDefault();
			this.state.set( 'paused', true );
		},

		/**
		 * Click handler for play button.
		 *
		 * @param {Event} e Event object.
		 */
		clickPlayButton: function( e ) {
			e.preventDefault();
			this.state.set( 'paused', false );
		},

		/**
		 * Click handler for speed button.
		 *
		 * @param {Event} e Event object.
		 */
		clickSpeedButton: function( e ) {
			e.preventDefault();
			var slideDuration = this.state.get( 'slideDuration' );

			if ( slideDuration < 1000 ) {
				slideDuration = 1000;
			} else if ( slideDuration >= self.maxDuration ) {
				slideDuration = 500;
			} else {
				slideDuration += 1000;
			}

			this.state.set( 'slideDuration', slideDuration );
		},

		/**
		 * Get the current photo.
		 *
		 * @returns {self.PhotoModel}
		 */
		getCurrentPhoto: function() {
			return this.collection.at( this.state.getCurrentIndex() );
		},

		/**
		 * Get the next photo.
		 *
		 * @returns {self.PhotoModel}
		 */
		getNextPhoto: function() {
			return this.collection.at( this.state.getNextIndex() );
		},

		/**
		 * Get the previous photo.
		 *
		 * @returns {self.PhotoModel}
		 */
		getPreviousPhoto: function() {
			return this.collection.at( this.state.getPreviousIndex() );
		},

		/**
		 * Render the application state onto the template.
		 */
		render: function() {
			var view = this, templateData = {}, prevPrefetchImg, nextPrefetchImg, datetime, error;

			error = view.state.get( 'error' );
			if ( ! error && 0 === view.collection.length ) {
				error = 'No photos available';
			}
			if ( error ) {
				templateData.error = error;
			} else {
				datetime = new Date( view.getCurrentPhoto().get( 'datetime' ) );
				templateData = _.extend(
					{
						next_photo_src: view.getNextPhoto().get( 'local_src' ),
						prev_photo_src: view.getPreviousPhoto().get( 'local_src' ),
						datetimeLocale: datetime.toLocaleDateString()
					},
					view.state.attributes,
					view.getCurrentPhoto().attributes
				);
				prevPrefetchImg = new Image();
				prevPrefetchImg.src = view.getPreviousPhoto().get( 'local_src' );
				nextPrefetchImg = new Image();
				nextPrefetchImg.src = view.getNextPhoto().get( 'local_src' );
			}

			view.$el.html( view.template( templateData ) );
		}

	});

	self.photos = new self.PhotosCollection();

	self.view = new self.AppView({
		collection: self.photos,
		el: '#app'
	});

	self.photos.fetch();

	return self;
}());
