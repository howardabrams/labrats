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

On Reporting
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
browser's stash of cookies, however, you *can* specify the ID you want
it to use. For instance, assuming that you had a `guid` variable like:

    var guid = 'bcfb3529-0fed-4b05-8414-db3e1d2b11da';

You can pass in this value as a `key` to the `$.labrats()` function:

    $.labrats( { key: guid, name: 'Big Button',
                 callbacks: [ shinyRed, flashyBlue ] } );

**Note:** If a `key` is not specified, the user ID calculated is simply a
large random number. It is NOT a GUID and may not be unique among all
your users. Since it is internal to this plugin and meaningless, it is
obviously not very  useful for tracking and reporting results. This is
why we recommend you specifying your own ID key.

On Hashing Issues
-----------------

The hashing algorithm that comes with this plugin is pretty... uh,
simplistic. Actually, it is downright stupid, and the resulting
distribution isn't great. However, the idea is that you can specify
a hashing algorithm.

The function you give the `hash` must be able to accept a string
and return an integer number, for instance:

      $.labrats.configure( {
           hash: function(key) {
                     return murmurhash3_32_gc(key, 73);
                 }
      });

It seems the [MurmurHash][4] is quite good at distribution, and
[initial experiments][5] show it a good algorithm for this plugin.

  [1]: http://www.jquery.com
  [2]: http://en.wikipedia.org/wiki/A/B_testing
  [3]: https://developers.google.com/analytics/
  [4]: http://en.wikipedia.org/wiki/MurmurHash
  [5]: dispersion/dispersion.html

Function API
------------------

The following details the available functions. While the primary
function is `$.labrats()`, fine-grain control may be had with the
other functions described below.

### $.labrats

Calls a function based on an assigned test group for a user.
The identification key for the user (as well as the name(s) of
the test) can be passed in as function arguments along with two
or more callback functions (note that their order matters).

For instance, for a test that splits the user accounts into three
groups, you could do:

    $.labrats.configure( { numGroups: 3 } ); // Optional
    $.labrats(userid, "Some Test", fn1, fn2, fn3);

The other approach to calling this function is with named parameters.
For instance, the same example could be written:

    $.labrats({ key: userid, name: "Some Test", numGroups:3,
                callbacks: [ fn1, fn2, fn3 ] });

This function returns the results of calling one of the callback
functions.

Note: The size of available pool for tests can be limited (effectively
creating a a pool of people in test groups and another control
group).  For instance:

   $.labrats.group( { key: userId, name: "Another Test", subset: 10,
                      callbacks: [ fn1, fn2, fn3 ],
                      control: fn4 });

Will call the `control` function if the user is part of the 90%
control group, otherwise, it calls the appropriate function in
the `callbacks` array.


### $.fn.labrats

Behaves like the utility function, `$.labrats()`, but the callback
function is given the jQuery selector results. This allows the callback
function to behave as part of a jQuery chain. For instance:

    function fn1() {
       return this.addClass("shiny-red");
    };
    function fn2() {
       return this.addClass("flashy-blue");
    };

    var testCfg = { key: id1, callbacks: [ fn1, fn2 ] };
    $("#logo-test").labrats(testCfg).click(...);

**Note:** Only *named parameters* work as arguments.


### $.labrats.group

Determines the *group number* assigned to a given user. The number
of groups can be specified using the `configure()` function (see below).
The user's `key` is passed in as the parameter, but this should
also take the name of the test as well.

This can either be specified as parameters, as in:

    $.labrats.group( userID, "Large Logo Test" );

Or as a series of keys in an array. The following is equivalent:

    $.labrats.group( [ userID, "Large Logo Test" ] );

Or as a collection of named parameters:

    $.labrats.group( { key: userID, name: "Large Logo Test",
                       numGroups: 2 } );

**Note:** This last approach allows you to specify the number of
groups (instead of calling the `configure()` function).

You can limit the size of available pool (effectively creating a
a pool of people in test groups and another control group).  For
instance:

   $.labrats.group( { key: userId, name: "Another Test",
                      numGroups: 2, subset: 10 });

Will return -1 if the user is part of the 90% control group,
otherwise, it returns either `0` or `1` if it is in one of the
5% sized test groups.


### $.labrats.inGroup

A test to see if a particular 'key' is part of the given group.
Returns `true` if a given key is in the group number, `false`
otherwise.

This function can be called either with named parameters, as in:

    $.labrats.inGroup( 2, { key: userid, name: testname }

Where the first argument is the group number to check, and the
second argument is an object similar to what is passed to the
`$.labrats.group()` function, including:

  - `key` is the identification of the user
  - `name` is the test's name
  - `subset` is the size of the pool, where `100 - subset` is the size of the control group

This function can also be called as a series of parameters:

    $.labrats.inGroup( 2, userid, testname )


### $.labrats.key

Converts a series of arguments into a *key* to use in a
hash. Each function may call this using a few formats.
For instance, as a series of string arguments:

    var key = $.labrats.key("test", "abc", id);

or as an array:

    var key = $.labrats.key([id, "test", "abc"]);

or even as the function's arguments:

    var key = $.labrats.key(arguments);


### $.labrats.getId

Returns an unique identification for the current user's browser.
If this is the first time a user has seen the application, we
generate a new ID (as a random number), otherwise, we return the
ID stored in a cookie.


### $.labrats.configure

This function allows a single object to overwrite some, but not
all configuration values. Acceptable values include:

 - `hash`: A function used to convert a user ID key and test name into a number
 - `numGroups`: The number of test groups to divide the user pool


