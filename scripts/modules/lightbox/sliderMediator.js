define(['jquery', 'pubsub', 'modules/lightbox/slider', 'modules/lightbox/contentScraper', 'modules/lightbox/slideFactory'], function ($, pubSub, slider, contentScraper, slideFactory) {
    'use strict';

    var defaults = {
        slide: 0,
        adverts: {
            slideData: {
                id: "div-gpt-ad-300x250_gallery",
                unitName: null,
                targets: { "pos": ["gallery"] },
                sizes: [[[0, 0], [300, 250]]]
            },
            frequency: '3,5,8,[10]',
            advertDelay: 1000,
            isLoaded: false
        },
        selectors: {
            slideContent: '.js-slide-content'
        },
        slideCount: 0,
        standardSlides: [], // holds the data for all standard slides
        endPlate: {}, // holds the data for the end plate articles
        combinedSlideData: [], // holds the combined data for standard, advert and end plate slides
        combinedSlideTemplates: [], // holds the built templates for each slide type
        fadeDuration: 300, // keep synched up with same option on slideFactory.js
    },
        config;

    // Collect all the data for standard slides and store withing config.standardSlides
    var collectStandardSlides = function () {

        var slideData,
            standardSlides = [];

        config.slideCount = contentScraper.countSlides();
        
        for (var i = 0; i < config.slideCount; i++) {

            slideData = contentScraper.fetchSlideContent(i);

            if (typeof slideData === 'object') {
                standardSlides.push({
                    slideIndex: i,
                    slideType: 'standard',
                    slideData: slideData
                });
            }

        }

        return standardSlides;

    };

    // Collect data for the end plate slide type and store in config.endPlate
    var collectEndPlate = function () {

        var slideData = contentScraper.fetchEndPlate(),
            endPlate = {};

        if (typeof slideData === 'object') {
            endPlate = {
                slideType: 'endPlate',
                slideData: slideData
            };
        }

        return endPlate;

    };

    // Go through our three slide types to build up a collection of slide data in the correct order
    var buildData = function () {

        var sliderData = [];

        // Convert our ad frequency variable into an array
        config.adverts.slides = (config.adverts.frequency !== null) ? config.adverts.frequency.replace(/\s+/g, '').split(',') : [];

        // Collect all data types as individual parts before joining them up into order
        config.standardSlides = collectStandardSlides();

        // Check wether there is data for an end plate
        var endPlateContent = collectEndPlate();
        if (endPlateContent.slideData.length > 0) {
            config.endPlate = endPlateContent;
        }

        for (var i = 0; i < config.slideCount; i++) {

            sliderData.push($.extend(config.standardSlides[i], { slideRef: (i+1) }));

            // Update the standardSlides object with it's new slide index so we can retrospectively  
            // work out a standard slides position within the whole slider array
            config.standardSlides[i].slideIndex = sliderData.length - 1;

            // If this slide should be followed by an ad, but not additionally the end slide, then inject an ad slide now
            if (attachAd(i) ) {
                sliderData.push({
                    slideType: 'advert',
                    slideData: config.adverts.slideData
                });
            }

        }

        // Finally attach the end plate if there is one
        if (endPlateContent.slideData.length > 0) {
            sliderData.push(config.endPlate);
        }

        return sliderData;

    };

    // Take the complete data set and return an array with each slide containing it's processed markup
    var collectTemplates = function (sliderData) {

        var slider = {};
            slider.slides = [];
            slider.thumbnails = [];

        for (var i = 0; i < sliderData.length; i++) {

            slider['slides'].push({
                type: sliderData[i].slideType,
                markup: slideFactory.parseSlide(sliderData[i].slideType, sliderData[i].slideData)
            });

            slider['thumbnails'].push({
                type: sliderData[i].slideType,
                index: sliderData[i].slideRef,
                markup: slideFactory.parseThumb(sliderData[i].slideType, sliderData[i].slideData)
            });

        }

        return slider;

    };

    // Calculate how long the next interval between ad slides should be
    var nextAdSlide = function () {

        if (config.adverts.slides !== null && config.adverts.slides.length > 0) {
            if (config.adverts.slides[0].indexOf('[') !== -1) {
                
                return parseInt(config.adverts.slides[0].replace(/[^0-9]/g, '')) - 1;
            } else {
                return parseInt(config.adverts.slides.shift()) - 1;
            }
        }

    };

    // Check if this slide should be followed by an advert
    var attachAd = function (currentSlide) {

        if (typeof config.nextAdSlide === 'undefined') {
            config.nextAdSlide = nextAdSlide();
        }

        // Check if this slide requires an ad injection, and is not going to be followed by an end plate
        if (config.nextAdSlide == currentSlide && currentSlide < (config.slideCount -1)) {
            config.nextAdSlide = (currentSlide+1) + nextAdSlide();
            return true;
        } else {
            return false;
        }

    };

    // Collect the template for slide content and inject it into the DOM
    var gatherSlideContentTemplate = function (slide) {

        var slideContentData = $.extend(slide.slideData, { totalSlides: config.slideCount, currentSlide: slide.slideRef }),
            slideContent = slideFactory.parseContent(slide.slideType, slideContentData);

        $(config.selectors.slideContent).fadeOut(config.fadeDuration, function () {
            $(this).html(slideContent).fadeIn(config.fadeDuration);
        });

    };

    var enableSlider = function () {
        slider.toggleSliderActivation('enable');        
    };


    // Run any logic required on slide changes; binds all the magic together
    var slideChanged = function (slide) {

        var currentSlide = config.combinedSlideData[slide.newSlide],
            slideType = currentSlide.slideType;

        // Update the outer content template of the slide when changing slide types
        if (slideType !== config.combinedSlideData[slide.currentSlide].slideType) {
            gatherSlideContentTemplate(config.combinedSlideData[slide.newSlide]);
        }
        
        if (slideType === 'advert') {            
            // Create object with all data needed to inject an ad into the current slide
            var adSlotData = {
                slideIndex: slide.newSlide,
                slideData: currentSlide.slideData
            };

            config.adverts.isLoaded = false;

            slideFactory.injectAdSlot(adSlotData);
            
            // Load ad here
            require(['modules/Dfp/AdManager'], function (adManager) {

                slider.toggleSliderActivation('disable');

                window.googletag = window.googletag || {};
                window.googletag.cmd = window.googletag.cmd || [];

                googletag.cmd.push(function () {

                    // Initialise an advert
                    adManager.addSlot({
                        id: config.adverts.slideData.id,
                        unitName: config.adverts.slideData.unitName,
                        targets: config.adverts.slideData.targets,
                        sizes: config.adverts.slideData.sizes
                    });

                    // Bind listener to fire when gallery ad slot has loaded and update flag
                    googletag.pubads().addEventListener('slotRenderEnded', function (event, ad) {
                        var slotId = event.slot.getSlotElementId();
                        if (slotId === config.adverts.slideData.id) {
                            config.adverts.isLoaded = true;
                        }
                    });
                });
            });
                       

            // check if gallery ad slot has loaded after 4 seconds. enable gallery if ad doesn't load.
            // When ad loads, delay for 1 sec (for viewability) before enabling gallery again 
            var monitorAdLoading = (function () {                
                var count = 0;
                var timer = window.setInterval(function () {
                    if (config.adverts.isLoaded === true || count >= 8) {                        
                        window.clearInterval(timer);
                        window.setTimeout(enableSlider, config.adverts.advertDelay);
                    } else {
                        count++;
                    }
                }, 500);
            })();

        } else {            
           
            slideFactory.resetAdSlot(slide.currentSlide);

            if (slideType === 'standard') {

                // Update the inner content section of the slide
                slideFactory.updateSlideContentText($.extend(currentSlide.slideData, { totalSlides: config.slideCount, currentSlide: currentSlide.slideRef }));

                // Send pubSub event to url handler knows the update the url
                pubSub.publish('update-url', config.combinedSlideData[slide.newSlide].slideRef);

                require(['modules/googleAnalytics'], function (googleAnalytics) {
                    googleAnalytics.pushEvent('galleryEvent', 'Gallery', slide.action, window.location.href);
                });
            }
        }
    };

    // Load modules for functionality within slide content
    var loadAdditionalModules = function () {
        require(['modules/socialShare'], function (socialShare) {
            socialShare.init();
        });
    };

    // Returns the index of standard slide within the combined slideset
    var computeSlideIndex = function (slideNumber) {

        // Check we're trying to reach a slide which actually exists
        if (typeof slideNumber === 'number' && slideNumber <= config.standardSlides.length) {
            return config.standardSlides[slideNumber].slideIndex;
        } else {
            return 0;
        }

    };

    var changeSlide = function (options) {
        // Set a default value for initial slide if required
        options.slide = options.slide ? (options.slide - 1) : 0;
        slider.goToSlide(computeSlideIndex(options.slide));
    }

    var initialise = function(options) {
        config = $.extend({}, defaults, options);
     
        // Set a default value for initial slide if required
        config.slide = config.slide ? (config.slide - 1) : 0;

        // Gather all of the data from contentScraper (which looks at the DOM)
        // Order into an array of slide data
        config.combinedSlideData = buildData();
        
        // Use slideFactory to parse our slide data into markup using our templates
        config.combinedSlideTemplates = collectTemplates(config.combinedSlideData);

        // config.slide allows a slideMediator to be passed a slide index to navigate to,
        // this is passed as an index of standard slides, not the entire slide collection.
        // computeSlideIndex converts the standard slide index into the correct index value.
        config.slide = computeSlideIndex(config.slide);

        // We now know the structure of our slides and their order so we pass it
        // through to slider.render which will build the slider onto the page
        slider.render({
            initialSlide: config.slide,
            slideTemplates: config.combinedSlideTemplates
        });

        // Populate the slide content area
        gatherSlideContentTemplate(config.combinedSlideData[config.slide]);

        // Slides contain additional functionality, let's load that JS now
        //loadAdditionalModules(); - not yet being used
        
        pubSub.subscribe('slide-change', function (e, data) {
            slideChanged(data);
        });

    };

    return {
        init: initialise,
        changeSlide: changeSlide
    };
});
