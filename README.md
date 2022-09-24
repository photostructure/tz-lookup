# @photostructure/tz-lookup

Fast, memory-efficient time zone lookups from latitude and longitude.

## What's this fork do?

This is a fork of `tz-lookup` originally written by [DarkSkyApp](https://github.com/darkskyapp/tz-lookup-oss) who archived the project in 2020.

* ✨ The time zone shapefiles now use
[2021c](https://github.com/evansiroky/timezone-boundary-builder/releases/tag/2021c). Expect a bunch of changes if you're upgrading from the original `tz-lookup`, including new zone names.

* ✨ TypeScript types are now included

* ✨ The test suite now validates the result from this library with the more accurate library, [`geo-tz`](https://github.com/evansiroky/node-geo-tz/)

* ✨ The test suite is automatically run by GitHub Actions

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
The database was last updated on 24 September 2022 to use the new 2021c dataset.

To regenerate the library's database yourself, you will need to install GDAL:

```
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
