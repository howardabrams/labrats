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
  equal( $.labrats.settings.hash('A'),   65,   "ASCII A, eh?!" );
  equal( $.labrats.settings.hash('abc'), 294,  "Passed!" );
  equal( $.labrats.settings.hash(id2),   2507, "What about a GUID?" );
  equal( $.labrats.settings.hash(''),    0,    "Empty strings hash to 0" );
  equal( $.labrats.settings.hash(345),   0,    "Numbers don't have a hash" );
});

/**
 * group()
 */

test( "Basic two group selection", function() {
  $.labrats.configure( { groups: 2 } );

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
  $.labrats.configure( { groups: 2 } );

  switch ($.labrats.group("Some Test", id1)) {
    case 0:
      ok(true, "Expected to be in second group.");
      break;
    case 1:
      ok(true, "Part of the second group.");
      break;
    }
});

test( "Two groups with Test Names passed as arrays", function() {
  $.labrats.configure( { groups: 2 } );

  switch ($.labrats.group(["Some Test", id1])) {
    case 0:
      ok(true, "Expected to be in second group.");
      break;
    case 1:
      ok(true, "Part of the second group.");
      break;
    }
});

test( "Group settings passed as named parameters", function() {

    equal($.labrats.group( { name: "Some Test", key: id1,
                             groups: 2}),
          1,  /* Expectation */
          "Expected to be in second group");
});

test( "Group settings with named parameters and settings", function() {
    $.labrats.configure( { groups: 10 } );

    equal($.labrats.group( { name: "Some Test", key: id1 }), 3,
          "Expected to be in fourth (3) group");
});

test( "Group settings outside a control group", function() {
    equal($.labrats.group( { key: id2, name: "Some Test",
                             groups: 2, subset: 50,
                             hash: groupBhash}), 1,
          "Expected to be in the control group");
});

test( "Group settings within a control group", function() {
    equal($.labrats.group( { key: id1, name: "Another Test",
                             groups: 2, subset: 50,
                             hash: controlled}), -1,
          "Expected to be in the control group");
});

/**
 * inGroup()
 */

test( "inGroup with named parameters", function() {

  ok( $.labrats.inGroup(1, {key: id2, groups: 2}),
      "Expected to be in second group");
  ok( $.labrats.inGroup(1, {key: id2, name: 'Some Test',
                            groups: 2}),
      "Expected to be in second group");
});

test( "inGroup with ordered parameters", function() {
  $.labrats.configure( { groups: 2 } );
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
        $.labrats({ key: id1, groups: 2,
                          callbacks: [ f1, f2 ] }),
        "f2", "Expected f2 to be called.");

    equal(
        $.labrats({ key: id2, name: "Some Test", groups:2,
                          callbacks: [ f1, f2 ] }),
        "f2", "Expected f2 to be called.");
});

test("see if callbacks get the correct key", function() {
  
    var callback = function(id, groupnum) {
        return "f" + (groupnum+1) + "-" + id;
    };

    equal(
        $.labrats({ key: id1,
                    callbacks: [ callback, callback ] }),
        "f2-"+id1, "Expected f2 and id to be called.");

});


test("split test of a basic 50/50 test but only 10% pool", function() {

    var fn1 = function() {
        return "fn1";
    };
    var fn2 = function() {
        return "fn2";
    };
    var fn3 = function() {
        return "fn3";
    };

    equal(
      $.labrats({ key: id1, subset: 10, control: fn3,
                  hash: controlled,
                  callbacks: [ fn1, fn2 ] }),
      "fn3", "Expected the control fn to be called.");

    equal(
      $.labrats({ key: id2, name: "Some Test", subset: 50,
                  hash: groupBhash,
                  callbacks: [ fn1, fn2 ], control: fn3 }),
      "fn2", "Expected fn2 to be called.");
});

test("split test of a basic 50/50 test using ordered parameters", function() {

    $.labrats.configure( { groups: 3 } );

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
          "f1", "Expected f1 to be called.");

    equal($.labrats(id2, "Some Test", f1, f2, f3),
          "f3", "Expected f3 to be called.");
});

test("split test without specifying groups", function() {
    // Clear out any numGroup setting
    delete($.labrats.settings.groups);

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
          "f1", "Expected f1 to be called.");

    equal($.labrats(id2, "Some Test", f1, f2, f3),
          "f3", "Expected f3 to be called.");
});


test("split test with unmatched callbacks and groups", function() {
    // Set the number of groups to an incorrect number
    $.labrats.configure( { groups: 30 } );

    var f1 = function() {
        return "f1";
    };
    var f2 = function() {
        return "f2";
    };

    equal($.labrats(id1, f1, f2),
          "f2", "Expected f2 to be called.");
});

test("split test from a jQuery selector chain", function() {

    var fn1 = function() {
      return this.html("fn1");
    };
    var fn2 = function() {
      return this.html("fn2");
    };

    var params = { key: id1, groups: 2,
                   callbacks: [ fn1, fn2 ] };
    var element = $("#split-test-1").labrats(params).html();

    equal(element, "fn2", "Expected f2 to be called.");
});


/**
 * getID()
 */

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
      var group = $.labrats.group( { groups:2 } );
      equal($.labrats.group( { groups:2 } ), group,
          "Expected to be in sixth (5) group");
    }
});

test("group given no parameters should still work", function() {
  if (cookiesAllowed()) {
    $.labrats.configure( { groups:3 } );
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

/**
 * This hashing function makes sure the result is always in the first
 * group (group 0).
 */

function groupAhash(id) {
  return 0;
}

/**
 * This hashing function makes sure the result is always in the second
 * group (group 1).
 */

function groupBhash(id) {
  console.log("Key:", id);
  return 1;
}

/**
 * This hashing function makes sure the result is always in the control
 * group (as it always returns -1).
 */

function controlled(id) { // We ignore the id parameter
  return -1;
}
