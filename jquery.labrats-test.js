/**
 * Test the public functions (API) available in the
 * `jquery.labrats.js` file.
 *
 * This uses the QUnit testing framework.
 */

// Default Hash Function

var id1 = 'bcfb3529-0fed-4b05-8414-db3e1d2b11da';
var id2 = 'af4a8646-effa-422b-9152-adc07b0fb625';

/**
 * key()
 */
test("Make key from arguments", function() {
  equal( $.labrats.key('abc'),      'abc');
  equal( $.labrats.key('a', 'bc'),  'abc');
  equal( $.labrats.key('abc', 123), 'abc123', "Numbers treated like strings");
  equal( $.labrats.key('abc', function(){return 'bling';}), 'abc',
       "Functions should be ignored.");
});

test("Make key from array", function() {
  equal( $.labrats.key(['abc']),      'abc');
  equal( $.labrats.key(['a', 'bc']),  'abc');
  equal( $.labrats.key(['abc', 123]), 'abc123', "Numbers treated like strings");
  equal( $.labrats.key(['abc', function(){return 'bling';}]), 'abc',
         "Functions should be ignored.");
});

test("Make a key from a functions' arguments", function() {
    (function() {
        equal( $.labrats.key(arguments), 'abc');
    })('abc');

    (function() {
        equal( $.labrats.key(arguments), 'abc123');
    })('abc', 123);
});

/**
 * hash()
 */

test( "Default Hash Function", function() {
  equal( $.labrats.settings.hash('A'),   65,        "ASCII A, eh?!" );
  equal( $.labrats.settings.hash('abc'), 689,       "Passed!" );
  equal( $.labrats.settings.hash(id2),   358197635, "What about a GUID?" );
  equal( $.labrats.settings.hash(''),    0,         "Empty strings hash to 0" );
  equal( $.labrats.settings.hash(345),   0,         "Numbers don't have a hash" );
});

/**
 * group()
 */

test( "Basic two group selection", function() {
  $.labrats.configure( { numGroups: 2 } );

  switch ($.labrats.group(id2)) {
    case 0:
      ok(false, "Expected to be in second group.");
      break;
    case 1:
      ok(true, "Part of second group.");
      break;
    }
});

test( "Two groups with Test Names", function() {
  $.labrats.configure( { numGroups: 2 } );

  switch ($.labrats.group("Some Test", id1)) {
    case 0:
      ok(true, "Part of first group.");
      break;
    case 1:
      ok(false, "Expected to be in first group.");
      break;
    }
});

test( "Two groups with Test Names passed as arrays", function() {
  $.labrats.configure( { numGroups: 2 } );

  switch ($.labrats.group(["Some Test", id1])) {
    case 0:
      ok(true, "Part of first group.");
      break;
    case 1:
      ok(false, "Expected to be in first group.");
      break;
    }
});

test( "Group settings passed as named parameters", function() {

    equal($.labrats.group( { name: "Some Test", key: id1,
                             numGroups: 2}),
          1,  /* Expectation */
          "Expected to be in second group");
});

test( "Group settings with named parameters and settings", function() {
    $.labrats.configure( { numGroups: 10 } );

    equal($.labrats.group( { name: "Some Test", key: id1 }), 5,
          "Expected to be in sixth (5) group");
});

/**
 * inGroup()
 */

test( "inGroup with named parameters", function() {

  ok( $.labrats.inGroup({groupnum: 1, key: id2, numGroups: 2}),
      "Expected to be in second group");
  ok( $.labrats.inGroup({groupnum: 1, key: id2, name: 'Some Test',
                         numGroups: 2}),
      "Expected to be in second group");
});

test( "inGroup with ordered parameters", function() {
  $.labrats.configure( { numGroups: 2 } );
  ok( $.labrats.inGroup(1, id2), "Expected to be in second group");
});

/**
 * labrats()
 */

test("split test of a basic 50/50 test", function() {

    var f1 = function() {
        return "f1";
    };
    var f2 = function() {
        return "f2";
    };

    equal(
        $.labrats({ key: id1, numGroups: 2,
                          callbacks: [ f1, f2 ] }),
        "f2", "Expected f2 to be called.");

    equal(
        $.labrats({ key: id2, name: "Some Test", numGroups:2,
                          callbacks: [ f1, f2 ] }),
        "f2", "Expected f2 to be called.");
});

test("split test of a basic 50/50 test using ordered parameters", function() {

    $.labrats.configure( { numGroups: 3 } );

    var f1 = function() {
        return "f1";
    };
    var f2 = function() {
        return "f2";
    };
    var f3 = function() {
        return "f3";
    };

    equal($.labrats(id1, f1, f2, f3),
          "f2", "Expected f2 to be called.");

    equal($.labrats(id2, "Some Test", f1, f2, f3),
          "f3", "Expected f3 to be called.");
});

test("split test with insufficient callbacks", function() {
    $.labrats.configure( { numGroups: 3 } );

    var f1 = function() {
        return "f1";
    };

    throws( function() { $.labrats(id1, f1); },
            "No function should be called.");
});

test("split test from a jQuery selector chain", function() {

    var fn1 = function() {
      return this.html("fn1");
    };
    var fn2 = function() {
      console.log("fn2", this);
      return this.html("fn2");
    };

    var params = { key: id1, numGroups: 2,
                   callbacks: [ fn1, fn2 ] };
    var element = $("#split-test-1").labrats(params).html();

    equal(element, "fn2", "Expected f2 to be called.");
});

test("getID should return the same value repeatedly.", function() {
    // JavaScript doesn't allow setting/reading cookies if the file
    // is from the local file system, so if we can ignore this test
    // if we can't set cookies ...

    if (cookiesAllowed()) {
      var label = "labrats_userID";
      document.cookie = label + "=";   // Clear cookie

      var id1 = $.labrats.getId();
      var id2 = $.labrats.getId();

      equal(id2, id1, "Expected to get the same ID when called twice.");
    }
});

test("group should use a default key if one isn't given", function() {
    if (cookiesAllowed()) {
      var group = $.labrats.group( { numGroups:2 } );
      equal($.labrats.group( { numGroups:2 } ), group,
          "Expected to be in sixth (5) group");
    }
});

test("group given no parameters should still work", function() {
  if (cookiesAllowed()) {
    $.labrats.configure( { numGroups:3 } );
    var group = $.labrats.group();
    equal($.labrats.group(), group,
          "Expected to be in sixth (5) group");
  }
});


function cookiesAllowed() {
  document.cookie = "foo=bar";
  if (document.cookie == '') {
    ok(true);
    return false;
  }
  else {
    return true;
  }
}
