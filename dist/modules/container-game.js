/*! SpringRoll 0.3.0 */
/**
*  @module Core
*  @namespace springroll
*/
(function(undefined)
{
	// Include classes
	var ApplicationPlugin = include('springroll.ApplicationPlugin'),
		PageVisibility = include('springroll.PageVisibility'),
		Bellhop = include('Bellhop');

	/**
	 * Create an app plugin for working with the Game Container, all properties and methods documented
	 * in this class are mixed-in to the main Application
	 * @class ContainerGamePlugin
	 * @extends springroll.ApplicationPlugin
	 */
	var ContainerGamePlugin = function()
	{
		ApplicationPlugin.call(this);

		this.priority = 5;
	};

	// Reference to the prototype
	var p = extend(ContainerGamePlugin, ApplicationPlugin);

	// Init the animator
	p.init = function()
	{
		/**
		 * The default play-mode for the game is continuous, if the game is
		 * running as part of a sequence is it considered in "single play" mode
		 * and the game will therefore close itself.
		 * @property {Boolean} options.singlePlay
		 * @readOnly
		 * @default false
		 */
		this.options.add('singlePlay', false, true);

		/**
		 * The optional play options to use if the game is played in "single play"
		 * mode. These options are passed from the game container to specify
		 * options that are used for this single play session. For instance,
		 * if you want the single play to focus on a certain level or curriculum
		 * such as `{ "shape": "square" }`
		 * @property {Object} options.playOptions
		 * @readOnly
		 */
		this.options.add('playOptions', null, true);

		/**
		 * Send a message to let the site know that this has
		 * been loaded, if the site is there
		 * @property {Bellhop} messenger
		 */
		this.messenger = new Bellhop();
		this.messenger.connect();

		// Handle the learning event
		this.on('learningEvent', function(data)
		{
			this.messenger.send('learningEvent', data);
		});

		// Handle google analtyics event
		this.on('analyticEvent', function(data)
		{
			this.messenger.send('analyticEvent', data);
		});

		// When the preloading is done
		this.once('loaded', function()
		{
			this.messenger.send('loadDone');
		});

		/**
		 * The default play-mode for the game is continuous, if the game is
		 * running as part of a sequence is it considered in "single play" mode
		 * and the game will therefore close itself.
		 * @property {Boolean} singlePlay
		 * @readOnly
		 * @default false
		 */
		this.singlePlay = false;

		/**
		 * The optional play options to use if the game is played in "single play"
		 * mode. These options are passed from the game container to specify
		 * options that are used for this single play session. For instance,
		 * if you want the single play to focus on a certain level or curriculum
		 * such as `{ "shape": "square" }`
		 * @property {Object} playOptions
		 * @readOnly
		 */
		this.playOptions = null;

		/**
		 * When a game is in singlePlay mode it will end.
		 * It's unnecessary to check `if (this.singlePlay)` just
		 * call the method and it will end the game if it can.
		 * @method singlePlayEnd
		 */
		this.singlePlayEnd = function()
		{
			if (this.singlePlay)
			{
				this.endGame();
			}
		};

		/**
		 * Manually close the game, this can happen when playing through once
		 * @method endGame
		 * @param {String} [exitType='game_completed'] The type of exit
		 */
		this.endGame = function(exitType)
		{
			this.trigger('endGame', exitType || 'game_completed');
			this.destroy();
		};

		// Listen when the browser closes or redirects
		window.onunload = window.onbeforeunload = onWindowUnload.bind(this);
	};

	// Handler for when a window is unloaded
	var onWindowUnload = function()
	{
		// Remove listener to not trigger twice
		window.onunload = window.onbeforeunload = null;
		this.endGame('left_site');
		return undefined;
	};

	// Setup the messanger handlers
	p.ready = function(done)
	{
		// Add the options to properties
		this.singlePlay = !!this.options.singlePlay;
		this.playOptions = this.options.playOptions || {};

		// Merge the container options with the current
		// game options
		if (this.messenger.supported)
		{
			//Setup the messenger listeners for site soundMute and captionsMute events
			this.messenger.on(
			{
				soundMuted: onSoundMuted.bind(this),
				captionsMuted: onCaptionsMuted.bind(this),
				musicMuted: onContextMuted.bind(this, 'music'),
				voMuted: onContextMuted.bind(this, 'vo'),
				sfxMuted: onContextMuted.bind(this, 'sfx'),
				captionsStyles: onCaptionsStyles.bind(this),
				pause: onPause.bind(this),
				singlePlay: onSinglePlay.bind(this),
				playOptions: onPlayOptions.bind(this),
				close: onClose.bind(this)
			});

			// Turn off the page hide and show auto pausing the App
			this.autoPause = false;

			//handle detecting and sending blur/focus events
			var messenger = this.messenger;
			this._pageVisibility = new PageVisibility(
				messenger.send.bind(messenger, 'gameFocus', true),
				messenger.send.bind(messenger, 'gameFocus', false)
			);
		}
		done();
	};

	/**
	 * When the container pauses the game
	 * @method onPause
	 * @private
	 * @param {event} e The Bellhop event
	 */
	var onPause = function(e)
	{
		this.paused = !!e.data;
		this.enabled = !this.paused;
	};

	/**
	 * Handler when the sound is muted
	 * @method onSoundMuted
	 * @private
	 * @param {Event} e The bellhop event
	 */
	var onSoundMuted = function(e)
	{
		this.sound.muteAll = !!e.data;
	};

	/**
	 * Handler when the captions are muted
	 * @method onCaptionsMuted
	 * @private
	 * @param {Event} e The bellhop event
	 */
	var onCaptionsMuted = function(e)
	{
		this.captions.muteAll = !!e.data;
	};

	/**
	 * Handler when the context is muted
	 * @method onContextMuted
	 * @private
	 * @param {String} context The name of the sound context
	 * @param {Event} e The bellhop event
	 */
	var onContextMuted = function(context, e)
	{
		this.sound.setContextMute(context, !!e.data);
	};

	/**
	 * The captions style is being set
	 * @method onCaptionsStyles
	 * @private
	 * @param {Event} e The bellhop event
	 */
	var onCaptionsStyles = function(e)
	{
		var styles = e.data;
		var captions = this.captions || {};
		var textField = captions.textField || null;

		// Make sure we have a text field and a DOM object
		if (textField && textField.nodeName)
		{
			textField.className = "size-" + styles.size + " " +
				"bg-" + styles.background + " " +
				"color-" + styles.color + " " +
				"edge-" + styles.edge + " " +
				"font-" + styles.font + " " +
				"align-" + styles.align;
		}
	};

	/**
	 * Handler when a game enters single play mode
	 * @method onPlayOptions
	 * @private
	 * @param {event} e The Bellhop event
	 */
	var onPlayOptions = function(e)
	{
		Object.merge(this.playOptions, e.data || {});
	};

	/**
	 * Handler when a game enters single play mode
	 * @method onSinglePlay
	 * @private
	 */
	var onSinglePlay = function()
	{
		this.singlePlay = true;
	};

	/**
	 * Game container requests closing the game
	 * @method onClose
	 * @private
	 */
	var onClose = function()
	{
		this.endGame('closed_container');
	};

	// Destroy the animator
	p.destroy = function()
	{
		if (this._pageVisibility)
		{
			this._pageVisibility.destroy();
			this._pageVisibility = null;
		}

		// Send the end game event to the container
		this.messenger.send('endGame');
		this.messenger.destroy();
		this.messenger = null;
	};

	// register plugin
	ApplicationPlugin.register(ContainerGamePlugin);

}());