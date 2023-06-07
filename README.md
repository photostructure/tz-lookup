# @photostructure/tz-lookup

[![npm version](https://img.shields.io/npm/v/@photostructure/tz-lookup.svg)](https://www.npmjs.com/package/@photostructure/tz-lookup)
[![Build status](https://github.com/photostructure/tz-lookup/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/photostructure/tz-lookup/actions/workflows/node.js.yml)
[![GitHub issues](https://img.shields.io/github/issues/photostructure/tz-lookup.svg)](https://github.com/photostructure/tz-lookup/issues)

Fast, memory-efficient time zone estimations from latitude and longitude.

## Background

This is a fork of [darkskyapp/tz-lookup](https://github.com/darkskyapp/tz-lookup-oss) which was abandoned in 2020.

The following updates have been made to this fork:

* The time zone shapefiles now use
[2023b](https://github.com/evansiroky/timezone-boundary-builder/releases/tag/2023b). Expect a bunch of changes if you're upgrading from the original `tz-lookup`, including new zone names.

* TypeScript types are now included.

* The test suite now validates the result from this library with the more accurate library, [`geo-tz`](https://github.com/evansiroky/node-geo-tz/).

* GitHub Actions now runs the test suite.

## Caution!

**This package trades speed and size for accuracy.** 

It's 10x (!!) smaller than
[geo-tz](https://github.com/evansiroky/node-geo-tz/)
([73kb](https://bundlephobia.com/package/@photostructure/tz-lookup@7.0.0) vs
[941kb](https://bundlephobia.com/package/geo-tz@7.0.2)).

It's roughly 20x faster than `geo-tz`, as well. As of 2022-09-24, this package
takes roughly 40 nanoseconds per lookup on an AMD 5950x (a very fast desktop CPU). On the same hardware, `geo-tz` takes
1-4 milliseconds per lookup.

**But**. _Yeah, you knew there was a "but" coming._

If you take a random point on the earth, roughly 30% of the results from this package won't match the (accurate) result from `geo-tz`. 

This drops to roughly 10% if you only pick points that are likely [inhabited](https://github.com/darkskyapp/inhabited).

This error rate drops to roughly 5% if you consider time zones (like `Europe/Vienna` and `Europe/Berlin`) that render mostly equivalent time zone offset values.

**If accuracy is important for your application and you don't need to support browsers, use `geo-tz`.**

## Usage

To install:

    npm install @photostructure/tz-lookup

Node.JS usage:

```javascript
var tzlookup = require("@photostructure/tz-lookup");
console.log(tzlookup(42.7235, -73.6931)); // prints "America/New_York"
```

Browser usage:

```html
<script src="tz.js"></script>
<script>
alert(tzlookup(42.7235, -73.6931)); // alerts "America/New_York"
</script>
```

**Please take note of the following:**

*   The exported function call will throw an error if the latitude or longitude
    provided are NaN or out of bounds. Otherwise, it will never throw an error
    and will always return an IANA timezone database string. (Barring bugs.)

*   The timezones returned by this module are approximate: since the timezone
    database is so large, lossy compression is necessary for a small footprint
    and fast lookups. Expect errors near timezone borders far away from
    populated areas. However, for most use-cases, this module's accuracy should
    be adequate.
    
    If you find a real-world case where this module's accuracy is inadequate,
    please open an issue (or, better yet, submit a pull request with a failing
    test) and I'll see what I can do to increase the accuracy for you.

## Sources

Timezone data is sourced from Evan Siroky's [timezone-boundary-builder][tbb].
The database was last updated on 6 June 2023 to use the new 2023b dataset.

To regenerate the library's database yourself, you will need to install GDAL:

```sh
$ brew install gdal # on Mac OS X
$ sudo apt install gdal-bin # on Ubuntu
```

Then, simply execute `rebuild.sh`. Expect it to take 10-30 minutes, depending
on your network connection and CPU.

[tbb]: https://github.com/evansiroky/timezone-boundary-builder/

## License

To the extent possible by law, The Dark Sky Company, LLC has [waived all
copyright and related or neighboring rights][cc0] to this library.

[cc0]: http://creativecommons.org/publicdomain/zero/1.0/

Any subsequent changes since the fork are also licensed via cc0. 
