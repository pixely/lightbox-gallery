define(['jquery'], function ($) {
    'use strict';

    var config = {
        selectors: {
            shared: {
                sliderWrapper: '.js-slider-slide',
                sliderImage: '.js-slider-image',
                sliderText: '.js-slider-text',
                sliderHeading: '.js-slider-heading',
                sliderLink: '.js-slider-link'
            },
            slideCollectionWrapper: '.js-slider-content-wrap',
            relatedCollectionWrapper: '.js-slider-related-wrap'                       
        }
    },
    slideCount = null,
    slideArray = [];

    // scrapes data from slide image
    var scrapeImageData = function (imageNode) {
        var image = {};
        image.alt = imageNode.attr('alt');
        image.title = imageNode.attr('title');
        image.url = imageNode.data('slider-image-url');
        return image;
    }

    // deletes empty object key/values
    var deleteEmptyProps = function (dataObject) {

        var keys = Object.keys(dataObject); 

        keys.forEach(function (thisKey) {           

            if (typeof dataObject[thisKey] === 'object') {
                deleteEmptyProps(dataObject[thisKey]);
            } else {
                if (!dataObject[thisKey]) {
                    delete dataObject[thisKey];
                }
            }

            if (typeof dataObject[thisKey] === 'object' && $.isEmptyObject(dataObject[thisKey])) {
                delete dataObject[thisKey];
            };
        });

        return dataObject;
    };

    // scrapes content of slide and creates slide object
    var scrapeSlideContent = function (containerEl) {
        var slideImage = containerEl.find(config.selectors.shared.sliderImage);
        var sliderHeading = containerEl.find(config.selectors.shared.sliderHeading);
        var sliderLink = containerEl.find(config.selectors.shared.sliderLink);

        var slideProps = {};
        slideProps.image = scrapeImageData(slideImage);
        slideProps.text = $.trim(containerEl.find(config.selectors.shared.sliderText).html());
        slideProps.heading = $.trim(sliderHeading.text());
        slideProps.url = sliderLink.attr('href');
        return deleteEmptyProps(slideProps);
    };


    // returns single slide object
    var fetchSlideContent = function (slideIndex) {  
        var i = slideIndex;
        var currentSlide = $(slideArray[i]).eq(0);
        return scrapeSlideContent(currentSlide);
    };


    // returns number of slides
    var countSlides = function () {
        return slideCount;
    };


    // returns an array of related content slide objects
    var fetchEndPlate = function () {
        var endPlateContent = [];        
        var relatedWrapper = $(config.selectors.relatedCollectionWrapper);

        relatedWrapper.each(function () {            
            var relatedItems = $(this).find(config.selectors.shared.sliderWrapper);

            relatedItems.each(function () {
                endPlateContent.push(scrapeSlideContent($(this)));
            });
        });        

        return endPlateContent;        
    };

    // when init runs, it scans slides and disregards slides without an image. All valid slides are then stored in an array.
    var init = (function () {        
        var slides = $(config.selectors.slideCollectionWrapper).find(config.selectors.shared.sliderWrapper);
        slides.each(function () {            
            if ( $(this).find(config.selectors.shared.sliderImage).length ) {                
                slideArray.push($(this));
                slideCount++;
            }
        });
    })();

    return {
        countSlides: countSlides,
        fetchSlideContent: fetchSlideContent,
        fetchEndPlate: fetchEndPlate
    };
});
