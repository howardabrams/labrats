This `lab-rats` project provides a jQuery plugin for doing
*multi-variate testing* (A/B Tests)... or in other words, treating
your customers like lab rats in order to engineer the best web
application.

Quick Start
----------

To give an example of how to use this plugin, let's pretend you want
to measure the results of changing the look of the *sign up button*.
This experiment will split your visitors into two equal
"groups". Group 0 will be shown the Shiny Red button, and Group 1 will
be shown the Flashy Blue button. We call this test, the **Big Button**
experiment.

Taking advantage of the `labrats` plugin is a simple two step process:

### Step 1. Create a Function for each Group

Each group will have a special function that will change or render the
page slightly differently:

    function shinyRed() {
        $('#big-button').addClass('shiny-red');
    }

    function flashyBlue() {
        $('#big-button').addClass('flashy-blue');
    }

Normally, you would put an element to report which element is shown to
which user, but we'll get to that in a minute.

### Step 2. Call the Function for Test Subject

The final step amounts to having the `labrats()` function call one of the
callback functions for each user based on their group.

    $.labrats( { name: 'Big Button', numGroups: 2,
                 callbacks: [ shinyRed, flashyBlue ] } );

That is all that is needed to get a barebones test showing different
button styles to different users.

Reporting
---------

Of course, a multivariate test is not really an experiement without
the scientific principles of observations and reporting.

While I really can't help you in this regard, let me assume that
you've written a `tracking()` function that can send a message to
something like Google Analytics.

Now, we just need to change our functions a wee bit:

    function shinyRed() {
        tracking('shown', 'shiny-red', guid);
        $('#big-button').addClass('shiny-red').click( function(){
            tracking('clicked', 'shiny-red', guid);
        });
    }

    function flashyBlue() {
        tracking('shown', 'flashy-blue, guid);
        $('#big-button').addClass('flashy-blue').click( function(){
            tracking('clicked', 'flashy-blue, guid);
        });
    }

On Identifying Users
-------------

The plugin keeps track of a user account by storing a unique ID in the
browser's stash of cookies, however, you can specify the ID you want
it to use. For instance, assuming that you had a `guid` variable like:

    var guid = 'bcfb3529-0fed-4b05-8414-db3e1d2b11da';

You can pass in this as a `key` to the `$.labrats()` function:

    $.labrats( { key: guid, name: 'Big Button', numGroups: 2,
                 callbacks: [ shinyRed, flashyBlue ] } );
