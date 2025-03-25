#!/bin/bash
set -ex

# Remember to update the README.md with the new version!
# Latest release is here: https://github.com/evansiroky/timezone-boundary-builder/releases
TZ="2025b"

rm -rf timezones.geojson.zip dist ne_10m_urban_areas.*
curl -L --retry 3 -C - \
  -O "https://github.com/evansiroky/timezone-boundary-builder/releases/download/$TZ/timezones.geojson.zip" \
  -O "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/10m_cultural/ne_10m_urban_areas.shp" \
  -O "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/10m_cultural/ne_10m_urban_areas.shx"

# Expected sha256sums:
# 76b8c5786af5df4fa18ae615e594347fb464525347038b15f9df15d1396cb7de  ne_10m_urban_areas.shp
# d387658168a5974d5c8b858af2220c0fdcdfa5b69646d36839e358519816140e  ne_10m_urban_areas.shx

# -o: overwrite existing files
# -u: update existing files and create new ones if needed
unzip -o -u timezones.geojson.zip

# sudo apt install -y gdal-bin
ogr2ogr -f GeoJSON ne_10m_urban_areas.json ne_10m_urban_areas.shp
# pack.js takes about a minute to complete.

# `uglifyjs -mc` takes 300ms and results in a 73k file.

# `terser --compress --mangle` takes ~300ms but is 15 bytes larger.

# `esbuild --minify` takes 200ms and is 10 bytes larger.

# the packed sizes are very similar as most of the payload
# is the encoded quadtree.
time node pack.js | ./node_modules/.bin/uglifyjs -mc >tz.js
