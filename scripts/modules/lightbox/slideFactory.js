define(['jquery', ], function ($) {
    'use strict';

    var config = {
        templateSelectors: {
            slideStandard: ".js-tmpl-gallery-slide-standard",
            slideAdvert: ".js-tmpl-gallery-slide-advert",
            slideEndPlate: ".js-tmpl-gallery-slide-endPlate",
            thumbStandard: ".js-tmpl-gallery-thumb-standard",
            thumbText: ".js-tmpl-gallery-thumb-text",
            sectionRelated: ".js-tmpl-gallery-related",
            sectionContent: ".js-tmpl-gallery-content",
            sectionHeadings: ".js-tmpl-gallery-headings",
            sectionIndex: ".js-tmpl-gallery-index",
            adSlot: ".js-tmpl-gallery-adSlot"
        },
        domSelectors: {
            mainSlide: ".js-slick-slider",
            slideAttr: "data-slick-index",
            index: ".js-subtmpl-index",
            headings: ".js-subtmpl-headings",
            adSlot: ".js-subtmpl-adSlot",
            skipAdText: ".js-ad-text"
        },
        textLabels: {
            advert: "Advertisement",
            endPlate: "End of Gallery"
        },
        cssClasses: {
            hidden: 'is-hidden'
        },
        fadeDuration: 300 // keep synched up with same option on slideMediator.js
    };

    // PRIVATE
    var getCurrentSlideNode = function (slideIndex) {
        return $(config.domSelectors.mainSlide).find("[" + config.domSelectors.slideAttr + "='" + slideIndex + "']");
    };

    // PUBLIC
    // Takes: thumbnail type string and thumbnail data object
    // Returns: parsed thumbnail HTML
    var parseThumb = function (slideType, slideData) {

        var template, markup;

        if (slideType === "standard") {

            template = _.template(config.templates.thumbStandard);
            markup = template({ image: slideData.image });

        } else if (slideType === "advert") {

            template = _.template(config.templates.thumbText);
            markup = template({ text: config.textLabels.advert });

        } else if (slideType === "endPlate") {

            template = _.template(config.templates.thumbText);
            markup = template({ text: config.textLabels.endPlate });

        }

        return markup;
    };


    // PUBLIC
    // Takes: slide type string and slide data object
    // Returns: parsed slide HTML (top section)
    var parseSlide = function (slideType, slideData) {
        
        var template, markup;
        
        if (slideType === "standard") {
            
            template = _.template(config.templates.slideStandard);
            markup = template({ image: slideData.image });

        } else if (slideType === "advert") {

            template = _.template(config.templates.slideAdvert);
            markup = template({});

        } else if (slideType === "endPlate") {

            var readNext = slideData[0];
            template = _.template(config.templates.slideEndPlate);
            markup = template({ readNext: readNext });

        }

        return markup;
    };


    // PUBLIC
    // Takes: slide type string and slide data object
    // Returns: parsed slide HTML (bottom section)
    var parseContent = function (slideType, slideData) {

        var template, markup;

        if (slideType === "standard") {

            template = _.template(config.templates.sectionContent);

            // Parse subtemplates to be passed as functions into the main template
            var indexTemplate = _.template(config.templates.sectionIndex);
            var headingsTemplate = _.template(config.templates.sectionHeadings);

            // Produce temporary data object to pass on all the data into the main template
            // including the subtemplate functions which will be executed inside of it
            var slideContent = {
                heading: slideData.heading,
                text: slideData.text,
                index: {
                    currentSlide: slideData.currentSlide,
                    totalSlides: slideData.totalSlides
                },
                subTemplates: {
                    renderIndex: indexTemplate,
                    renderHeadings: headingsTemplate
                }
            };

            markup = template(slideContent);

            return markup;
            
        } else if (slideType === "endPlate") {

            // Purposely ignores the first entry in the array
            var relatedArticles = [];
            for (var i = 1, total = slideData.length; i < total; i++) {
                relatedArticles.push(slideData[i]);
            }            

            template = _.template(config.templates.sectionRelated);
            markup = template({ relatedArticles: relatedArticles });

            return markup;
        } else {

            // No markup returned for advert slides
            return "";
        }

    };


    // PUBLIC
    // Takes: slide data object
    // Returns: nothing
    // Does: parse headings template and injects it in the DOM
    var updateSlideContentText = function (slideData) {

        // TODO: ensure slideData is populated with the right data
        var indexTemplate = _.template(config.templates.sectionIndex);
        var headingsTemplate = _.template(config.templates.sectionHeadings);

        var slideContent = {
            heading: slideData.heading,
            text: slideData.text,
            index: {
                currentSlide: slideData.currentSlide,
                totalSlides: slideData.totalSlides
            }
        };

        // Render both templates
        var indexMarkup = indexTemplate({ currentSlide: slideContent.index.currentSlide, totalSlides: slideContent.index.totalSlides });
        var headingsMarkup = headingsTemplate({ heading: slideContent.heading, text: slideContent.text });

        // Inject new markup in the document
        $(config.domSelectors.index).html(indexMarkup);
        $(config.domSelectors.headings).fadeOut(config.fadeDuration, function () {
            $(this).html(headingsMarkup).fadeIn(config.fadeDuration);
        });

    };


    var injectAdSlot = function (adSlotData) {

        var adSettings = {
            id: adSlotData.slideData.id,
            sizes: JSON.stringify(adSlotData.slideData.sizes),
            position: adSlotData.slideData.targets.pos[0]
        };

        var template = _.template(config.templates.adSlot);
        var markup = template(adSettings);

        var adSlideNode = getCurrentSlideNode(adSlotData.slideIndex);
        adSlideNode.find(config.domSelectors.adSlot).html(markup);
    };


    var resetAdSlot = function (slideIndex) {
        var adSlideNode = getCurrentSlideNode(slideIndex);
        adSlideNode.find(config.domSelectors.adSlot).empty();
        adSlideNode.find(config.domSelectors.skipAdText).addClass(config.cssClasses.hidden);
    };
    

    var initialise = (function () {
        config.templates = {};
        $.each(config.templateSelectors, function (key, value) {
            config.templates[key] = $(value).html();
        });
    })();

    return {
        parseSlide: parseSlide,
        parseThumb: parseThumb,
        parseContent: parseContent,
        updateSlideContentText: updateSlideContentText,
        injectAdSlot: injectAdSlot,
        resetAdSlot: resetAdSlot
    };
});
