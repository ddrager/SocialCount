(function( exports ) {

	// TODO: fix jerkiness when counts load
	// TODO: only one request for counts per url per page (multiple widgets with same url should share requests)
	// TODO: get running with wrap
	var $loadingIndicator;

	function featureTest( prop, unprefixedProp )
	{
		var style = document.createElement('social').style;
			prefixes = 'webkit moz o ms'.split(' ');

		if( unprefixedProp in style ) {
			return true;
		}
		for( var j = 0, k = prefixes.length; j < k; j++ ) {
			if( ( prefixes[ j ] + prop ) in style ) {
				return true;
			}
		}
		return false;
	}

	SocialCount = {
		serviceUrl: '../service/index.php',
		initSelector: '.socialcount',
		activeClass: 'active',
		cache: {},
		thousandCharacter: 'K',
		millionCharacter: 'M',
		missingResultText: '-',
		classes: {
			facebook: '.facebook',
			twitter: '.twitter',
			googleplus: '.googleplus'
		},
		isCssAnimations: function()
		{
			return featureTest( 'AnimationName', 'animationName' );
		},
		isCssTransforms: function()
		{
			return featureTest( 'Transform', 'transform' );
		},
		init: function( $el ) {
			var url = $el.attr('data-url') || location.href,
				orientation = $el.attr('data-orientation' ) || 'horizontal-inline',
				facebookAction = ( $el.attr('data-facebook-action' ) || 'like' ).toLowerCase();

			SocialCount.fetch( url, function complete( data ) {
				var map = SocialCount.classes;
				$el.addClass('js');

				for( var j in data ) {
					if( data.hasOwnProperty(j) ) {
						$el.find( map[j] + ' .count' ).html( SocialCount.normalizeCount( data[j] ) );
					}
				}
			});

			$el.addClass( orientation );
			$el.addClass( facebookAction );

			if( !SocialCount.isCssTransforms() ) {
				$el.addClass('no-transforms');
			}

			if('querySelectorAll' in document && !( window.blackberry && !window.WebKitPoint )) {
				SocialCount.bindEvents( $el, url, facebookAction );
			}
		},
		fetch: function( url, callback ) {
			if( !SocialCount.cache[ url ] ) {
				$.ajax({
					url: SocialCount.serviceUrl,
					data: {
						url: url
					},
					dataType: 'json'
				}).done( function( data ) {
					SocialCount.cache[ url ] = data;

					callback( data );
				});
			} else {
				callback( SocialCount.cache[ url ] );
			}
		},
		normalizeCount: function( count )
		{
			if( !count && count !== 0 ) {
				return SocialCount.missingResultText;
			}
			// > 1M
			if( count >= 1000000 ) {
				return Math.floor( count / 1000000 ) + SocialCount.millionCharacter;
			}
			// > 100K
			if( count >= 100000 ) {
				return Math.floor( count / 1000 ) + SocialCount.thousandCharacter;
			}
			if( count > 1000 ) {
				return ( count / 1000 ).toFixed(1).replace( /\.0/, '' ) + SocialCount.thousandCharacter;
			}
			return count;
		},
		initLoadingIndicator: function()
		{
			// Thanks to http://codepen.io/ericmatthys/pen/FfcEL
			var $div = $(document.createElement('div')),
				dot = '<div class="dot"></div>';

			$div.addClass('loading');

			$div.html( SocialCount.isCssAnimations() ? dot + dot + dot : 'Loading' );

			return $div;
		},
		bindEvents: function( $el, url, facebookAction )
		{
			function bind( $a, html, jsUrl )
			{
				$a.one( 'click', function( event ) {
						$( this ).trigger( 'mouseover' );
						event.preventDefault();
					}).one( 'mouseover', function() {
						var $parent = $( this ).parent(),
							$loading = $loadingIndicator.clone(),
							$content = $(html);

						$parent.addClass(SocialCount.activeClass);
						$loading.appendTo( $parent );
						$parent.append( $content );

						if( jsUrl ) {
							js = document.createElement( 'script' );
							js.src = jsUrl;

							document.body.appendChild( js );
						}

						// FIXME We could add onload to the script or to the iframes, but it's not reliable cross-browser.
						setTimeout(function()
						{
							$loading.remove();
						}, 600 );
					});
			}

			bind( $el.find( SocialCount.classes.facebook + ' a' ),
				'<iframe src="//www.facebook.com/plugins/like.php?href=' + encodeURI( url ) + '&amp;send=false&amp;layout=button_count&amp;width=100&amp;show_faces=true&amp;action=' + facebookAction + '&amp;colorscheme=light&amp;font=arial&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden;" allowTransparency="true"></iframe>' );

			bind( $el.find( SocialCount.classes.twitter + ' a' ),
				'<a href="https://twitter.com/share" class="twitter-share-button" data-count="none">Tweet</a>',
				'//platform.twitter.com/widgets.js' );

			bind( $el.find( SocialCount.classes.googleplus + ' a' ),
				'<div class="g-plusone" data-size="medium" data-annotation="none"></div>',
				'//apis.google.com/js/plusone.js' );
		}
	};

	$(function() {
		$loadingIndicator = SocialCount.initLoadingIndicator();

		$(SocialCount.initSelector).each(function()
		{
			var $el = $(this);
			SocialCount.init($el);
		});
	});

	exports.SocialCount = SocialCount;

})( typeof exports === 'object' && exports || this );