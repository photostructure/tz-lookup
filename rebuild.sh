#!/bin/bash
set -ex

# Latest release is here: https://github.com/evansiroky/timezone-boundary-builder/releases
TZ="2023d"

rm -rf timezones.geojson.zip dist ne_10m_urban_areas.*
curl -L --retry 3 -C - \
  -O "https://github.com/evansiroky/timezone-boundary-builder/releases/download/$TZ/timezones.geojson.zip" \
  -O 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_urban_areas.zip'
unzip -u timezones.geojson.zip
unzip -u ne_10m_urban_areas.zip
ogr2ogr -f GeoJSON ne_10m_urban_areas.json ne_10m_urban_areas.shp
node pack.js | ./node_modules/.bin/uglifyjs -mc >tz.js
