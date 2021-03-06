/**
 * @module UI
 * @namespace springroll
 * @requires Core
 */
(function()
{
	// Class imports
	var ScaleManager;

	/**
	 *	A single UI item that needs to be resized,
	 *	this is an internal class that you would not need to interact with.
	 *
	 *	@class ScaleItem
	 *	@param {PIXI.DisplayObject|createjs.DisplayObject} display The item to affect
	 *	@param {String} align The vertical-horizontal alignment shorthand
	 *	@param {springroll.ScreenSettings} designedScreen The original screen the item was designed for
	 *	@param {DisplayAdapter} adapter The display adapter
	 */
	var ScaleItem = function(display, align, designedScreen, adapter)
	{
		if (!ScaleManager)
		{
			ScaleManager = include('springroll.ScaleManager');
		}

		// Break align into parts
		align = align.split('-');

		/**
		 *	What vertical screen location the item should be aligned to: "top", "center", "bottom"
		 *	@property {String} vertAlign
		 */
		this.vertAlign = align[0];

		/**
		 *	What horizontal screen location the item should be aligned to: "left", "center", "right"
		 *	@property {String} horiAlign
		 */
		this.horiAlign = align[1];

		/**
		 *	If this element should be aligned to the title safe area, not the actual screen.
		 *	Values of "horizontal" and "vertical" make the title safe calculations take place only
		 *	for one direction.
		 *	@property {Boolean|String} titleSafe
		 *	@default false
		 */
		this.titleSafe = false;

		/**
		 *	Maximum scale allowed in physical size
		 *	@property {Number} maxScale
		 *	@default 1
		 */
		this.maxScale = 1;

		/**
		 *	Minimum scale allowed in physical size
		 *	@property {Number} minScale
		 *	@default 1
		 */
		this.minScale = 1;

		/**
		 *	If the UI element is centered horizontally
		 *	@property {Boolean} centeredHorizontally
		 *	@default false
		 */
		this.centeredHorizontally = false;

		/**
		 *  The reference to the interface item we're scaling
		 *  @private
		 *  @property {PIXI.DisplayObject|createjs.DisplayObject} _display
		 */
		this._display = display;

		/**
		 *  The original screen the item was designed for
		 *  @private
		 *  @property {ScreenSettings} _designedScreen
		 */
		this._designedScreen = designedScreen;

		/**
		 *  The adapter for universal scale, rotation size access
		 *  @property {Object} _adapter
		 *  @private
		 */
		this._adapter = adapter;

		var scale = adapter.getScale(display);
		var position = adapter.getPosition(display);

		/**
		 *  Original X scale of the item
		 *  @property {Number} origScaleX
		 *  @default 0
		 */
		this.origScaleX = scale.x || 1;

		/**
		 *  The original Y scale of the item
		 *  @property {Number} origScaleY
		 *  @default 0
		 */
		this.origScaleY = scale.y || 1;

		/**
		 *  Original width in pixels
		 *  @property {Number} origWidth
		 *  @default 0
		 */
		this.origWidth = display.width || 0;

		/**
		 *  The original bounds of the item with x, y, right, bottom, width, 
		 *	height properties. Used to determine the distance to each edge of
		 *	the item from its origin
		 *  @property {Object} origBounds
		 */
		this.origBounds = adapter.getLocalBounds(display);

		/**
		 *  Original horizontal margin in pixels
		 *  @property {Number} origMarginHori
		 *  @default 0
		 */
		this.origMarginHori = 0;

		/**
		 *  Original vertical margin in pixels
		 *  @property {Number} origMarginVert
		 *  @default 0
		 */
		this.origMarginVert = 0;

		switch (this.vertAlign)
		{
			case ScaleManager.ALIGN_TOP:
			{
				this.origMarginVert = position.y + this.origBounds.y * scale.y;
				break;
			}
			case ScaleManager.ALIGN_CENTER:
			{
				this.origMarginVert = designedScreen.height * 0.5 - position.y;
				break;
			}
			case ScaleManager.ALIGN_BOTTOM:
			{
				this.origMarginVert = designedScreen.height - (position.y + this.origBounds.bottom * scale.y);
				break;
			}
		}

		switch (this.horiAlign)
		{
			case ScaleManager.ALIGN_LEFT:
			{
				this.origMarginHori = position.x + this.origBounds.x * scale.x;
				break;
			}
			case ScaleManager.ALIGN_CENTER:
			{
				this.origMarginHori = designedScreen.width * 0.5 - position.x;
				break;
			}
			case ScaleManager.ALIGN_RIGHT:
			{
				this.origMarginHori = designedScreen.width - (position.x + this.origBounds.right * scale.x);
				break;
			}
		}
	};

	// Reference to the prototype
	var p = ScaleItem.prototype = {};

	if (DEBUG)
	{
		p.toString = function()
		{
			return "[ScaleItem (vertAlign='" + this.vertAlign + "', horiAlign='" + this.horiAlign + "')]";
		};
	}

	/**
	 * Get the current display item
	 * @property {PIXI.DisplayObject|createjs.DisplayObject} display
	 * @readOnly
	 */
	Object.defineProperty(p, 'display',
	{
		get: function()
		{
			return this._display;
		}
	});

	/**
	 *  Adjust the item scale and position, to reflect new screen
	 *  @method resize
	 *  @param {Number} displayWidth The current screen width
	 *  @param {Number} displayHeight The current screen height
	 */
	p.resize = function(displayWidth, displayHeight)
	{
		var adapter = this._adapter;
		var _display = this._display;
		var _designedScreen = this._designedScreen;
		var origBounds = this.origBounds;
		var origScaleX = this.origScaleX;
		var origScaleY = this.origScaleY;
		var defaultRatio = _designedScreen.width / _designedScreen.height;
		var currentRatio = displayWidth / displayHeight;
		var overallScale = currentRatio >= defaultRatio ?
			displayHeight / _designedScreen.height :
			displayWidth / _designedScreen.width;
		var scaleToHeight = currentRatio >= defaultRatio;
		var letterBoxWidth = 0;
		var letterBoxHeight = 0;

		if (scaleToHeight)
		{
			letterBoxWidth = (displayWidth - _designedScreen.width * overallScale) / 2;
		}
		else
		{
			letterBoxHeight = (displayHeight - _designedScreen.height * overallScale) / 2;
		}

		// Optional clamps on the min and max scale of the item
		var itemScale = overallScale;
		if (this.minScale && itemScale < this.minScale)
		{
			itemScale = this.minScale;
		}
		else if (this.maxScale && itemScale > this.maxScale)
		{
			itemScale = this.maxScale;
		}

		adapter.setScale(_display, origScaleX * itemScale, "x");
		adapter.setScale(_display, origScaleY * itemScale, "y");

		// Positioning
		var m;
		var x;
		var y;

		// Vertical margin
		m = this.origMarginVert * overallScale;

		// Determine if vertical alignment should be title safe
		var titleSafe = this.titleSafe === true || this.titleSafe === "vertical";

		switch (this.vertAlign)
		{
			case ScaleManager.ALIGN_TOP:
			{
				if (titleSafe)
				{
					y = letterBoxHeight + m - origBounds.y * origScaleY * itemScale;
				}
				else
				{
					y = m - origBounds.y * origScaleY * itemScale;
				}
				break;
			}
			case ScaleManager.ALIGN_CENTER:
			{
				y = displayHeight * 0.5 - m;
				break;
			}
			case ScaleManager.ALIGN_BOTTOM:
			{
				if (titleSafe)
				{
					y = displayHeight - letterBoxHeight - m -
						origBounds.bottom * origScaleY * itemScale;
				}
				else
				{
					y = displayHeight - m - origBounds.bottom * origScaleY * itemScale;
				}
				break;
			}
		}

		// Set the position
		if (y !== null)
		{
			adapter.setPosition(_display, y, "y");
		}

		// Horizontal margin
		m = this.origMarginHori * overallScale;

		// Determine if horizontal alignment should be title safe
		titleSafe = this.titleSafe === true || this.titleSafe === "horizontal";

		switch (this.horiAlign)
		{
			case ScaleManager.ALIGN_LEFT:
			{
				if (titleSafe)
				{
					x = letterBoxWidth + m - origBounds.x * origScaleX * itemScale;
				}
				else
				{
					x = m - origBounds.x * origScaleX * itemScale;
				}
				break;
			}
			case ScaleManager.ALIGN_CENTER:
			{
				if (this.centeredHorizontally)
				{
					x = (displayWidth - _display.width) * 0.5;
				}
				else
				{
					x = displayWidth * 0.5 - m;
				}
				break;
			}
			case ScaleManager.ALIGN_RIGHT:
			{
				if (titleSafe)
				{
					x = displayWidth - letterBoxWidth - m -
						origBounds.right * origScaleX * itemScale;
				}
				else
				{
					x = displayWidth - m - origBounds.right * origScaleX * itemScale;
				}
				break;
			}
		}

		// Set the position
		if (x !== null)
		{
			adapter.setPosition(_display, x, "x");
		}
	};

	/**
	 *	Destroy this item, don't use after this
	 *	@method destroy
	 */
	p.destroy = function()
	{
		this._adapter = null;
		this.origBounds = null;
		this._display = null;
		this._designedScreen = null;
	};

	// Assign to namespace
	namespace('springroll').ScaleItem = ScaleItem;

}());