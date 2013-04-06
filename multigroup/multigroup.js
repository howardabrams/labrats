/**
 * The complete experiment "suite" amounts to four function calls. Two
 * using the built-in hashing algorithm, and the second two using the
 * murmur hash.
 */

var keys = [];

var test1 = {
  groupA: 0,   // ~ 25%
  groupB: 0,   // ~ 25%
  control: 0   // ~ 50%
};

var test2 = {
  groupA: {
    from1A: 0,
    from1B: 0,
    from1C: 0
  },
  groupB: {
    from1A: 0,
    from1B: 0,
    from1C: 0
  },
  control: {
    from1A: 0,
    from1B: 0,
    from1C: 0
  }
};

$(function() {
    $.labrats.configure(
        {   hash: function(key) {
                return murmurhash3_32_gc(key, 73);
            }
        });

    generateKeys();
    experiment();
    console.log("test 1", test1);
    console.log("test 2", test2);
    displayResults();
});

function generateKeys() {
  var i;

  for (i = 0; i < 1000; i++) {
      keys[i] = createGUID();
  }
}

function experiment() {
  for (i = 0; i < 1000; i++) {
    var key   = keys[i];
    var group1 = $.labrats.group( { key: key, name: 'what the hell', 
                                    numGroups: 2, subset: 50} );
    var group2 = $.labrats.group( { key: key, name: 'test-2', 
                                    numGroups: 2, subset: 50} );

    // console.log("key", key, "test1", group1, "test2", group2);

    switch(group1) {
      case 0:  // GroupA
        test1.groupA++;
        switch(group2) {
          case 0:  // GroupA
            test2.groupA.from1A++;
            break;
          case 1:  // GroupB
            test2.groupB.from1A++;
            break;
          case -1: // Control
            test2.control.from1A++;
            break;
        }
        break;
      case 1:  // GroupB
        test1.groupB++;
        switch(group2) {
          case 0:  // GroupA
            test2.groupA.from1B++;
            break;
          case 1:  // GroupB
            test2.groupB.from1B++;
            break;
          case -1: // Control
            test2.control.from1B++;
            break;
        }
        break;
      case -1: // Control
        test1.control++;
        switch(group2) {
          case 0:  // GroupA
            test2.groupA.from1C++;
            break;
          case 1:  // GroupB
            test2.groupB.from1C++;
            break;
          case -1: // Control
            test2.control.from1C++;
            break;
        }
        break;
    }
  }
}

function displayResults() {

    displayResult('.group1A', test1.groupA);
    displayResult('.group1B', test1.groupB);
    displayResult('.group1C', test1.control);

    displayResult('.group2AA', test2.groupA.from1A);
    displayResult('.group2AB', test2.groupA.from1B);
    displayResult('.group2AC', test2.groupA.from1C);

    displayResult('.group2BA', test2.groupB.from1A);
    displayResult('.group2BB', test2.groupB.from1B);
    displayResult('.group2BC', test2.groupB.from1C);

    displayResult('.group2CA', test2.control.from1A);
    displayResult('.group2CB', test2.control.from1B);
    displayResult('.group2CC', test2.control.from1C);
}


function displayResult(id, value) {
    $(id).html(value).css('width', value);
} 

/**
 * Header function for each of the experiments.
 *
 *   - name: The number of the experiment, 1, 2, 3, etc.
 *   - size: The size of the sample size, e.g. 10000
 *   - numGroups: The number of test buckets to split the sample, e.g. 2
 *                for a 50/50 test
 */

function exp_helper( name, size, numGroups ) {
  var i, j, k, results = [];

  // Begin by initializing the results array, and creating a "graph"
  // for each group.

  var el = $('#experiment'+name);

  $.labrats.configure( { numGroups: numGroups } );

  // Step through the same size, creating an ID, and incrementing
  // the count for the group the ID belongs.

  for (i = 0; i < size; i++) {
    var key   = keys[i];
    var group = $.labrats.group( key );
    results[group]++;
  }

  // For each "graph" we put the number and the set the CSS width
  for (j = 0; j < numGroups; j++) {
    $("#experiment" + name + " .group" + j).html(results[j]).css("width", results[j]);
  }
  console.log("Experiment " + name + " Results:", results);
}

/**
 * This is the algorithm for creating fake UIs.
 */

function createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
  });
}

/**
 * Creates a RFC4122-compliant GUID, see http://www.ietf.org/rfc/rfc4122.txt
 * This may not be a good enough random distribution.
 */

function createGUID() {

  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return uuid;
}

/**
 ,* JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 ,*
 ,* @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 ,* @see http://github.com/garycourt/murmurhash-js
 ,* @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 ,* @see http://sites.google.com/site/murmurhash/
 ,*
 ,* @param {string} key ASCII only
 ,* @param {number} seed Positive integer only
 ,* @return {number} 32-bit positive integer hash
 ,*/

function murmurhash3_32_gc(key, seed) {
  var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

  remainder = key.length & 3; // key.length % 4
  bytes = key.length - remainder;
  h1 = seed;
  c1 = 0xcc9e2d51;
  c2 = 0x1b873593;
  i = 0;

  while (i < bytes) {
    k1 =
      ((key.charCodeAt(i) & 0xff)) |
      ((key.charCodeAt(++i) & 0xff) << 8) |
      ((key.charCodeAt(++i) & 0xff) << 16) |
      ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;

    k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
    h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
  }

  k1 = 0;

  switch (remainder) {
  case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
  case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
  case 1: k1 ^= (key.charCodeAt(i) & 0xff);

    k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= k1;
  }

  h1 ^= key.length;

  h1 ^= h1 >>> 16;
  h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}
