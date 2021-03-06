/**
 * jQuery Plugin for helping with browser-based Multivariate Testing
 * (c) 2013, Howard Abrams <howard.abrams@gmail.com> and others.
 * See LICENSE.txt for details.
 *
 * The primary function is the `$.labrats()` function, however, other
 * supporting functions may be called for fine-grained control/information.
 */

(function( $ ){

   /**
    * Calls a function based on an assigned test group for a user.
    * The identification key for the user (as well as the name(s) of
    * the test) can be passed in as function arguments along with two
    * or more callback functions (note that their order matters).
    *
    * For instance, for a test that splits the user accounts into three
    * groups, you could do:
    *
    *     $.labrats(userid, "Some Test", fn1, fn2, fn3);
    *
    * The other approach to calling this function is with named parameters.
    * For instance, the same example could be written:
    *
    *     $.labrats({ key: userid, name: "Some Test", groups:3,
    *                 callbacks: [ fn1, fn2, fn3 ] });
    *
    * This function returns the results of calling one of the callback
    * functions.
    *
    * The callback function is passed two parameters:
    * 
    *   - `key` referring to the user's ID
    *   - `group` the group number with 0 being the first group, and
    *             -1 meaning this user is part of the control group.
    *
    * Note: The size of available pool for tests can be limited (effectively
    * creating a a pool of people in test groups and another control
    * group).  For instance:
    *
    *    $.labrats({ key: userId, name: "Another Test", subset: 10,
    *                callbacks: [ fn1, fn2, fn3 ],
    *                control: fn4 });
    *
    * Will call the `control` function if the user is part of the 90%
    * control group, otherwise, it calls the appropriate function in
    * the `callbacks` array.
    *
    * (See the `group()` function for details as to the other acceptable values
    * for named parameters)
    */

   $.labrats = function(params) {
     // Save off the original numgroups setting...
     var origNumGroups = $.labrats.settings.groups;

     if (typeof params === 'object') {
       // The number of groups should be the number of callbacks
       $.labrats.settings.groups = params.callbacks.length;

       // Use the new numGroup setting:
       var groupnum = $.labrats.group(params);

       $.labrats.settings.groups = origNumGroups;

       var id = params.key;
       if (! id) {
         id = $.labrats.getId();
       }

       if (groupnum == -1) {    // User is part of the control group
         return params.control.apply(this, [id, groupnum]);
       }
       else {
         return params.callbacks[groupnum].apply(this, [id, groupnum]);
       }
     }
     else {
       var keys  = [];
       var funcs = [];

       for (var i = 0; i < arguments.length; i++) {
         if (typeof arguments[i] === 'function') {
           funcs.push (arguments[i]);
         }
         else {
           keys.push (arguments[i]);
         }
       }

       // The number of groups should be the number of callbacks
       $.labrats.settings.groups = funcs.length;

       var groupnum = $.labrats.group(keys);

       $.labrats.settings.groups = origNumGroups;

       if (funcs[groupnum]) {
         return funcs[groupnum].apply(this, [keys[0], groupnum]);
       }
       else {
         throw("No callback function given for group number: "+groupnum);
       }
     }
   };

   /**
    * Behaves like the utility function, `$.labrats()`, but the callback
    * function is given the jQuery selector results. This allows the callback
    * function to behave as part of a jQuery chain. For instance:
    *
    *     function fn1() {
    *        return this.addClass("shiny-red");
    *     };
    *     function fn2() {
    *        return this.addClass("flashy-blue");
    *     };
    *
    *     var testCfg = { key: id1, callbacks: [ fn1, fn2 ] };
    *     $("#logo-test").labrats(testCfg).click(...);
    *
    * **Note:** Only *named parameters* work as arguments.
    */

   $.fn.labrats = function(params) {
     return $.labrats.apply(this, [params]);
   };

   /**
    * Determines the *group number* assigned to a given user. The number
    * of groups can be specified using the `configure()` function (see below).
    * The user's `key` is passed in as the parameter, but this should
    * also take the name of the test as well.
    *
    * This can either be specified as parameters, as in:
    *
    *     $.labrats.group( userID, "Large Logo Test" );
    *
    * Or as a series of keys in an array. The following is equivalent:
    *
    *     $.labrats.group( [ userID, "Large Logo Test" ] );
    *
    * Or as a collection of named parameters:
    *
    *     $.labrats.group( { key: userID, name: "Large Logo Test",
    *                        groups: 2 } );
    *
    * This last approach allows you to specify the number of
    * groups (instead of calling the `configure()` function).
    *
    * #### Accepted Parameters:
    *
    *  - `key` - The identification of the user account
    *  - `name` - The name of the test. The name is appended to the key in order to compute the hash value. This guarantees that each test has a different distribution of user accounts.
    *  - `groups` - The number of active groups a non-controlled test account can be in. If not given, this defaults to 0.
    *  - `subset` - A percentage (from 0 to 100) that Specifies the size of the test pool. User accounts that hash outside this value are part of the control. If not specified, this defaults to `100` (meaning, no control group).
    *  - `slices` - Divides the test pool into discreet slices where a user account can be in only one slice. This allows distinct test groups that don't overlap essentially guaranteeing that a user account could be in at most, one test group. The slices works for a given `name` parameter.
    *  - `slice` - The name of the slice this user should belong in order to qualify for being part of a test group.
    *  - `hash` - The function used to convert the *string* into a number than can be divided into the different test buckets.
    *
    * #### Limit Test Pool with `subset`
    *
    * You can limit the size of available pool (effectively creating a
    * a pool of people in test groups and another *control group*).  For
    * instance:
    *
    *     $.labrats.group( { key: userId, name: "Another Test",
    *                        groups: 2, subset: 10 });
    *
    * Will return `-1` if the user is part of the 90% control group,
    * otherwise, it returns either `0` or `1` if it is in one of the
    * 5% sized test groups.
    *
    * #### Slicing Test Pool
    *
    * With multiple tests, a random distribution algorithm means that some
    * users will end up in more than one test group. The `slices` option
    * divides the test pool into discreet subgroups, and the `slice` option
    * specifies which slice to use for a particular test.
    *
    * For instance, suppose you have some experiments that are quite invasive,
    * (perhaps even conflicting if a person ended up as a lab rat in more than one),
    * we could define the first experiment to use the first slice:
    *
    *     $.labrats.group( { key: userId, name: "serious tests",
    *                        slices: 3, slice: 0, groups: 2 });
    *
    * The second experiment would use the next *slice*:
    *
    *     $.labrats.group( { key: userId, name: "serious tests",
    *                        slices: 3, slice: 1, groups: 2 });
    *
    * Notice the test name for the group of slices must be the same.
    *
    * This slicing feature can be combined with the `subset` feature to
    * keep a control group out. Also, when using the subset and the slicing
    * features, the `groups` option can be unspecified in order to default
    * to `1` (a single test group).
    *
    * With five experiments where each experiment is in a slice with
    * two test groups, we might have a distribution illustrated in
    * this diagram:
    *
    * ![Distribution for Test 1](visuals/slice_graph.png)
    */

   $.labrats.group = function(params) {
     if (! params) {
       params = {};
     }

     var key, controlValue,
         groups = $.labrats.settings.groups,
         slices, slice, subset = 100,
         keyValue,
         hash = params.hash || $.labrats.settings.hash;

     if ($.isArray(params)) {
       key = $.labrats.key(params);
       keyValue = parseInt(hash(key));
     }
     else if (typeof params === 'object') {
       if (params.key) {
         key = params.key + params.name;
       }
       else {
         key = $.labrats.getId() + params.name;
       }
       keyValue = parseInt(hash(key));
       groups = params.groups || groups;

       if (params.slices != null && params.slice != null) {
         slices = params.slices;
         slice  = params.slice;
       }
       if (params.subset) {
         subset = params.subset;
         controlValue = keyValue % 100;
       }
     }
     else {
       key = $.labrats.key(arguments);
       keyValue = parseInt(hash(key));
     }

     if (!key) {
       // Still no key? Use random number stored in cookie
       key = $.labrats.getId();
     }

     if (controlValue && controlValue > subset) {
       return -1;  // In the control group...
     }

     if ( (slices && keyValue % slices == slice) || !slices) {
       return keyValue % groups;
     }
     else {
       return -1;   // Aren't part of the slice, then user is
     }              // part of the control group.
   };

   /**
    * A test to see if a particular 'key' is part of the given group.
    * Returns `true` if a given key is in the group number, `false`
    * otherwise.
    *
    * This function can be called either with named parameters, as in:
    *
    *     $.labrats.inGroup( 2, { key: userid, name: testname }
    *
    * Where the first argument is the group number to check, and the
    * second argument is an object similar to what is passed to the
    * `$.labrats.group()` function, including:
    *
    *   - `key` is the identification of the user
    *   - `name` is the test's name
    *   - `subset` is the size of the pool, where `100 - subset` is the
    *      size of the control group
    *
    * This function can also be called as a series of parameters:
    *
    *     $.labrats.inGroup( 2, userid, testname )
    */

   $.labrats.inGroup = function(groupnum, opts) {
     if (typeof opts === 'object') {
       return $.labrats.group(opts) === groupnum;
     }
     else {
       var args = Array.prototype.slice.call(arguments);
       var groupnum = args.shift();
       return $.labrats.group(args) == groupnum;
     }
   };

   /**
    * Converts a series of arguments into a *key* to use in a
    * hash. Each function may call this using a few formats.
    * For instance, as a series of string arguments:
    *
    *     var key = $.labrats.key("test", "abc", id);
    *
    * or as an array:
    *
    *     var key = $.labrats.key([id, "test", "abc"]);
    *
    * or even as the function's arguments:
    *
    *     var key = $.labrats.key(arguments);
    */

   $.labrats.key = function(a) {
     var params;
     if ($.isArray(a)) {
       params = a;
     }
     else if (typeof a === 'object') {
       params = arguments[0];
     }
     else {
       params = arguments;
     }

     var key = params[0];
     for (var i = 1; i < params.length; i++) {
       if (params[i]) {
         switch (typeof params[i]) {
           case "string":
             key += params[i];
             break;
           case "function":
             break;
           default:
             key += params[i].toString();
         }
       }
     }
     return key;
   };

   /**
    * Sets a particular cookie with a given key and value. Both values
    * will be escaped.
    */

   function setCookie(key,value) {
     document.cookie = escape(key) + "=" + escape(value);
   }

   /**
    * Simple function for retrieving a particular cookie by its key.
    * If the cookie has not be set, then this returns null.
    */

   function getCookie(key) {
     return unescape(document.cookie.replace(new RegExp("(?:(?:^|.*;\\s*)" +
                                                        escape(key).replace(/[\-\.\+\*]/g, "\\$&") +
                                                        "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*)|.*"), "$1")) || null;
   }

   /**
    * Returns an unique identification for the current user's browser.
    * If this is the first time a user has seen the application, we
    * generate a new ID (as a random number), otherwise, we return the
    * ID stored in a cookie.
    */

   $.labrats.getId = function() {
     var label = 'labrats_userID',
            id = getCookie(label);
     if (id == null) {
       id = Math.floor( Math.random() * 100000000 ).toString();
       setCookie(label, id);
     }
     return id;
   };

   /**
    * Configuration settings begins with 'default values'. However,
    * the 'configure()' function can be called with a map of key/value
    * pairs to override any of these settings.
    */

   $.labrats.settings = {

     // This hash function is pretty stupid, and should NOT be used.
     // However, if you are just playing around with this project... fine.
     hash: function(key) {
       var results = 0;
       for(c in key) {
         results += key.charCodeAt(c);
       }
       // console.log("Key:", key, "Hash:", results);
       return Math.abs(results);
     }
   };

   /**
    * This function allows a single object to overwrite some, but not
    * all configuration values. Acceptable values include:
    *
    *  - `hash`: A function used to convert a user ID key and test name into a number
    *  - `groups`: The number of test groups to divide the user pool
    */

   $.labrats.configure = function(config) {
     for (var key in config) {
       if (config.hasOwnProperty(key)) {
         $.labrats.settings[key] = config[key];
       }
     }
   };

 })( jQuery );
