/**
*  @module Core
*  @namespace springroll
*/
(function()
{
	// Include classes
	var ApplicationPlugin = include('springroll.ApplicationPlugin');

	/**
	 * Create an app plugin for Loader, all properties and methods documented
	 * in this class are mixed-in to the main Application
	 * @class LoaderPlugin
	 * @extends springroll.ApplicationPlugin
	 */
	var LoaderPlugin = function()
	{
		ApplicationPlugin.call(this);

		// Higher priority for loader
		this.priority = 100;
	};

	// Reference to the prototype
	var p = extend(LoaderPlugin, ApplicationPlugin);

	// Init the animator
	p.setup = function()
	{
		/**
		 * Reference to the loader singleton
		 * @property {springroll.Loader} loader
		 */
		var Loader = include('springroll.Loader');
		var loader = this.loader = Loader.init();

		/**
		 * Override the end-user browser cache by adding
		 * "?v=" to the end of each file path requested. Use
		 * for developmently, debugging only!
		 * @property {Boolean} options.cacheBust
		 * @default DEBUG
		 */
		this.options.add('cacheBust', DEBUG)
		.respond('cacheBust', function()
		{
			return loader.cacheManager.cacheBust;
		})
		.on('cacheBust', function(value)
		{
			loader.cacheManager.cacheBust = (value == "true" || !!value);
		});

		/**
		 * The optional file path to prefix to any relative file
		 * requests this is a great way to load all load requests
		 * with a CDN path.
		 * @property {String} options.basePath
		 */
		this.options.add('basePath', null);

		/**
		 * The current version number for your application. This
		 * number will automatically be appended to all file
		 * requests. For instance, if the version is "0.0.1" all
		 * file requests will be appended with "?v=0.0.1"
		 * @property {String} options.version
		 */
		this.options.add('version', null, true);

		/**
		 * Path to a text file which contains explicit version
		 * numbers for each asset. This is useful for controlling
		 * the live browser cache. For instance, this text file
		 * would have an asset on each line followed by a number:
		 * `assets/config/config.json 2` would load
		 * `assets/config/config.json?v=2`
		 * @property {String} options.versionsFile
		 */
		this.options.add('versionsFile', null, true);
	};

	// Preload task
	p.preload = function(done)
	{
		var versionsFile = this.options.versionsFile;
		if (versionsFile)
		{
			// Try to load the default versions file
			Loader.instance.cacheManager.addVersionsFile(versionsFile, done);
		}
		else
		{
			done();
		}
	};

	// Destroy the animator
	p.teardown = function()
	{
		if (this.loader)
		{
			this.loader.destroy();
			this.loader = null;
		}
	};

	// register plugin
	ApplicationPlugin.register(LoaderPlugin);

}());