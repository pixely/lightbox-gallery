# Lightbox Gallery

This repo contain's sample SASS and JavaScript used in a previous project to implement a lightbox gallery on a large website.

**Note: This code is only part of a bigger solution, additional dependencies and shared code are not provided here. This repo is intended as an example of some of my previous work only and, whilst you are free to use this code as needed, it is not an out-of-the-box solution**

### Requirements

The gallery had to work to created within a short period and meet numerous requirements including:

* Allowing uses to trigger a lightbox on specified images within our article markup
* Users should be able to navigate directly to the open gallery on a given slide
* Browser history events should be supported
* Advertising should be displayed at a configurable interval
* Related content should be displayed at the end of the gallery
* Interaction events should be tracked using Google Analytics

With these in mind, we created a solution which collects the gallery data from the DOM when the lightbox is initialised and then parsed this through underscore templates to create the markup for the gallery. As users interact with the gallery, mediator ensures the state is passed correctly and additional modules are notified as required. This solution is intended to provide the optimal 
performance that meets the requirements but offer the flexibility to change over time, for example to allow us to change our template language or pull in additional data with AJAX.

### Dependencies

As this code was written with a particular project in mind it has taken advantage of functionality available within the existing project as far as is possible. This list details the primary dependencies, the majority of which were pre-existing within the project.

* jQuery
* RequireJS
* PubSub
* Underscore
* Remodal
* Slick carousel (new dependency for this feature)
* Internal dependencies
  * Ad manager to initialise advertising
  * Google Analytics helper to push events to Google Analytics via the dataLayer provided by Google Tag Manager
  
 

