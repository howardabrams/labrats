This `lab-rats` project provides a [jQuery plugin][1] for doing
*multi-variate testing* ([A/B Tests][2]) on the client's browser... or
in other words, treating your customers like lab rats in order to
engineer the best web application.

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

### Step 2. Call the `labrats()` for Test Subject

The final step amounts to having the `labrats()` function call one of the
callback functions for the user based on their group.

    $.labrats( { name: 'Big Button',
                 callbacks: [ shinyRed, flashyBlue ] } );

That is all that is needed to get a barebones test showing different
button styles to different users.

Reporting
---------

Of course, a multivariate test is not really an experiement without
the scientific principles of observations and reporting.

While I really can't help you in this regard, let me assume that
you've written a `tracking()` function that can send a message to
something like [Google Analytics][3].

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

    $.labrats( { key: guid, name: 'Big Button',
                 callbacks: [ shinyRed, flashyBlue ] } );

On Hashing Issues
-----------------

The hashing algorithm that comes with this plugin is pretty... uh,
simplistic. Actually, it is downright stupid. However, the idea is
that you can specify which hashing algorithm to use.

The function you give the `hash` must be able to accept a string
and return an integer number, for instance:

      $.labrats.configure( {
           hash: function(key) {
                     return murmurhash3_32_gc(key, 73);
                 }
      });

I understand that the [MurmurHash][4] would be especially useful for
this plugin.

Note: If you don't specify the user's "key" (and let the plugin
calculate a random one), you do not need to give it a special hash
function, as it won't be used... you know, since the random ID is
already a number ;-)


  [1]: http://www.jquery.com
  [2]: http://en.wikipedia.org/wiki/A/B_testing
  [3]: https://developers.google.com/analytics/
  [4]: http://en.wikipedia.org/wiki/MurmurHash
