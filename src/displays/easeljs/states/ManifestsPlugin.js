/**
 *	@module EaselJS States
 *	@namespace springroll.easeljs
 *	@requires Core, States, Tasks, UI, Sound, EaselJS Display, EaselJS UI
 */
(function(undefined)
{
	// Import classes
	var ApplicationPlugin = include('springroll.ApplicationPlugin'),
		Debug,
		LoadTask,
		BaseState,
		AssetManager;

	/**
	 *	A createjs-based Game to load manifests
	 *	@class ManifestsPlugin
	 *	@extends springroll.ApplicationPlugin
	 *	@param {int} [options.fps=30] The framerate to use for the main display
	 *	@param {Function} [options.display=springroll.easeljsDisplay] The
	 *	display class to use as the default display.
	 *	@param {Boolean} [options.displayOptions.clearView=true] If the stage view
	 *	should be cleared everytime in CreateJS stage.
	 */
	var ManifestsPlugin = function()
	{
		ApplicationPlugin.call(this);
	};

	// Extend base plugin
	var p = extend(ManifestsPlugin, ApplicationPlugin);

	// Initialize the plugin
	p.setup = function()
	{
		/**
		 *	Event when the manifest is finished loading
		 *	@event manifestLoaded
		 *	@param {springroll.TaskManager} manager The task manager
		 */

		/**
		 *	The path to the concatinated FLA exported manifests. It's useful
		 *	to load all the manifests at once. This JSON object contains a
		 *	dictionary of state alias and contains an array of manifest assets
		 *	(e.g. `{"id": "PlayButton", "src": "assets/images/button.png"}`.
		 *	Set to null and no manifest will be auto-loaded.
		 *	@property {String} options.manifestsPath
		 *	@readOnly
		 *	@default null
		 */
		this.options.add('manifestsPath', null, true);

		// Change the defaults
		this.options.override('fps', 30);
		this.options.override('display', include('springroll.easeljs.EaselJSDisplay'));
		this.options.override('displayOptions', { clearView: true });
		this.options.override('canvasId', 'stage');

		Debug = include('springroll.Debug', false);
		LoadTask = include('springroll.LoadTask');
		BaseState = include('springroll.easeljs.BaseState');
		AssetManager = include('springroll.easeljs.AssetManager');
		
		//initialize the AssetManager once for the application.
		AssetManager.init();

		/**
		 *	The collection of loading assets by state
		 *	@property {object} _manifests
		 *	@private
		 */
		this._manifests = {};

		/**
		 *	Read-only getter to return _manifests
		 *	@property {object} manifests
		 *	@readOnly
		 */
		Object.defineProperty(this, "manifests",
		{
			get: function()
			{
				return this._manifests;
			}
		});

		// When config loads, load the manifests
		this.once('loading', function(tasks)
		{
			var manifestsPath = this.options.manifestsPath;

			if (manifestsPath)
			{
				tasks.push(new LoadTask(
					"manifests",
					manifestsPath,
					onManifestsLoaded.bind(this)
				));
			}
			else if (DEBUG && Debug)
			{
				Debug.info("Application option 'manifestsPath' is empty, set to automatically load manifests JSON");
			}
		});
	};

	/**
	 *	Callback to when manifests have been loaded
	 *	@method onManifestsLoaded
	 *	@private
	 *	@param {array} tasks The collection of preload tasks
	 */
	var onManifestsLoaded = function(result, task, manager)
	{
		Object.merge(this._manifests, result.content);
		this.trigger('manifestLoaded', manager);
	};

	// clean up
	p.teardown = function()
	{
		this._manifests = null;
	};

	ApplicationPlugin.register(ManifestsPlugin);

}());