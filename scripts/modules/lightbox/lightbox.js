define(['jquery', 'pubsub', 'modules/lightbox/sliderMediator'], function ($, pubSub, sliderMediator) {
    'use strict';

    var defaults = {
            selectors: {
                lightbox: '.js-lightbox',
                lightboxParent: '.remodal-wrapper',
                trigger: '.js-lightbox-trigger',
                remodalId: 'lightbox'
            },
            cssClasses: {
                lightboxParent: 'remodal-wrapper--no-padding'
            },
            prevHash: '',
            scrollPos: ''
        },
        config;

    // Track the gallery event
    var trackEvent = function (type) {
        require(['modules/googleAnalytics'], function (googleAnalytics) {
            googleAnalytics.pushEvent('galleryEvent', 'Gallery', type, window.location.href);
        });
    };

    var trackPageview = function () {
        require(['modules/googleAnalytics'], function (googleAnalytics) {
            googleAnalytics.trackPageview(window.location.href);
        });
    }

    // Pass the new hash for populating the modal
    var parseHash = function (hash) {

        // Do not run if hash is same as before
        if (hash === config.prevHash) {
            return;
        } else {
            config.prevHash = hash;
        }

        var lbInstance = $('[data-remodal-id=lightbox]').remodal();
        var lbState = lbInstance.getState();
        
        // Parse hash from URL and pass its number as initial slide into sliderMediator
        var slideIndexFromHash = hash.substring(hash.indexOf("-") + 1);
   
        if (lbState === 'closed') {

            lbInstance.open();
            trackEvent('Open');

            // Set the hash once on a click event
            window.location.hash = hash;

            // If the Gallery is opening now, initialise slideMediator and pass along slide index from the Hash
            sliderMediator.init({ slide: slideIndexFromHash });
            
        }
        else {

            // If the Gallery is already open, call changeSlide method from (already initialised) slideMediator
            sliderMediator.changeSlide({ slide: slideIndexFromHash });
            
        }

    };

    //check for slide hash on initial load
    var checkHash = function () {
        //if we have a slide hash, parse the hash
        var hash = window.location.hash;
        if (hash.indexOf('#slide') > -1) {
            parseHash(hash);
        }
    };

    // Subscribe to update URL event published
    var subscribeHashUpdateEvent = function () {
        pubSub.subscribe("update-url", function (e, data) {
            window.location.hash = "slide-" + data;
        });
    };

    var initialise = function (options) {
        config = $.extend({}, defaults, options);

        checkHash();

        subscribeHashUpdateEvent();

        // attach class to supress padding on parent
        $(config.selectors.lightbox).parent(config.selectors.lightboxParent).addClass(config.cssClasses.lightboxParent);

        //watch for hash change events
        window.onhashchange = function () {
            if (window.location.hash.indexOf('#slide-') != -1) {
                config.scrollPos = $(window).scrollTop();
                parseHash(window.location.hash);
                trackPageview();
                
            }
        };
        $(document).on('closed', '.js-lightbox', function (e) {
            trackEvent('Close');
            config.prevHash = '';
            //reposition the page at its original position before opening gallery
            $(window).scrollTop(config.scrollPos);
        });
    };

    return {
        init: initialise
    };
});
