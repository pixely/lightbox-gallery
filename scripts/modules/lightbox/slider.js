define(['jquery', 'underscore', 'pubsub', 'slick'], function ($, _, pubSub, slick) {
    'use strict';

    var defaults = {
        selectors: {
            sliderTemplate: '.js-tmpl-slick',
            lightboxContainer: '.js-gallery-content',
            mainSlider: '.js-slick-slider',
            thumbnailsSlider: '.js-slick-thumbnails',
            thumbnailLink: ".js-slider-thumbnail-link",
            nextSlideArrow: '.js-next-slide',
            prevSlideArrow: '.js-prev-slide',
            bothSlideArrows: '.js-slider-arrow',
            sliderNav: '.js-slider-nav',
            skipAdText: '.js-ad-text'
        },
        cssClasses: {
            disabled: 'is-disabled',
            hidden: 'is-hidden'
        }
    },
        config;

    var render = function (options) {
        config = $.extend({}, defaults, options);

        // Parse the array containing slide markup through an underscore template which renders markup for a slider
        var sliderTemplate = _.template($(config.selectors.sliderTemplate).html());
        var sliderMarkup = sliderTemplate(config.slideTemplates);

        // Inject slider into the DOM
        $(config.selectors.lightboxContainer).html(sliderMarkup);

        // Initialise slick slider for main slider
        $(config.selectors.mainSlider).slick({
            asNavFor: config.selectors.thumbnailsSlider,
            adaptiveHeight: true,
            prevArrow: config.selectors.prevSlideArrow,
            nextArrow: config.selectors.nextSlideArrow,
            caseEase: 'ease',
            infinite: false,
            initialSlide: config.initialSlide
        });

        // Initialise secondary slider for thumbnail slide navigation
        $(config.selectors.thumbnailsSlider).slick({
            arrows: false,
            asNavFor: config.selectors.mainSlider,
            centerMode: true,
            centerPadding: 0,
            cssEase: 'ease',
            infinite: false,
            initialSlide: config.initialSlide,
            slidesToShow: (config.slideTemplates.thumbnails.length === 3) ? 2 : 3,
            swipeToSlide: false
        });

        // Pass slide change events through to other modules using pubSub
        $(config.selectors.mainSlider).on('beforeChange', function (event, slick, currentSlide, nextSlide) {
            if (nextSlide !== currentSlide) {
                pubSub.publish('slide-change', {
                    action: nextSlide > currentSlide ? 'Forward' : 'Back',
                    currentSlide: currentSlide,
                    newSlide: nextSlide
                });
            }
        });

        // Listen for clicks on slide thumbnails and trigger a slide change
        $(config.selectors.thumbnailLink).on("click", function () {
            var slideIndex = $(this).attr("data-slick-index");
            goToSlide(slideIndex);
        });

    };

    // Passes properties to slick.js to enable or disable
    var setSlickOption = function (slider, option, value) {        
       $.each(option, function (i, property) {            
            slider.slick('slickSetOption', property, value);
        });               
    };

    var toggleSliderActivation = function (str) {
        var sliderArrows = $(config.selectors.bothSlideArrows);        
        var mainSlider = $(config.selectors.mainSlider);
        var navigationWrapper = $(config.selectors.sliderNav).eq(0);
        var navSlider = $(config.selectors.thumbnailsSlider);
        var disabledClass = config.cssClasses.disabled;
        var AdText = $(config.selectors.skipAdText);
        var slickPropertyValue;
        var slickProperties = ['swipe', 'touchMove', 'accessibility'];

        if (str === 'enable') {
            AdText.removeClass(config.cssClasses.hidden);
            sliderArrows.attr('aria-disabled', false).removeClass('slick-disabled');
            navigationWrapper.removeClass(disabledClass);
            slickPropertyValue = true;            

        } else if (str === 'disable') {
            sliderArrows.attr('aria-disabled', true).addClass('slick-disabled');
            navigationWrapper.addClass(disabledClass);
            slickPropertyValue = false;
        }

        // disables key inputs on slider while slideshow is disabled for viewability
        setSlickOption(mainSlider, slickProperties, slickPropertyValue);
        setSlickOption(navSlider, slickProperties, slickPropertyValue);
    };

    var goToSlide = function (slideIndex) {
        $(config.selectors.mainSlider).slick('slickGoTo', slideIndex);
    };

    return {
        render: render,
        goToSlide: goToSlide,
        toggleSliderActivation: toggleSliderActivation
    };
});
