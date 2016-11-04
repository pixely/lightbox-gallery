define(['jquery', 'pubsub', 'modules/lightbox/lightbox'], function ($, pubSub, lightbox) {
    'use strict';

    var initialise = function (config) {

        // Initialise lightbox gallery
        lightbox.init();

    };

    return {
        init: initialise
    }
});
