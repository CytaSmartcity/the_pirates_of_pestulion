#!/bin/sh

# primary setup
# createuser --no-superuser --no-createrole --createdb osm
# createdb -E UTF8 -O osm osm
# psql -d osm -c "CREATE EXTENSION postgis;"
# psql -d osm -c "CREATE EXTENSION hstore;" # only required for hstore support
# echo "ALTER USER osm WITH PASSWORD 'osm';" |psql -d osm

# osm2pgsql
dropdb osm
createdb -E UTF8 -O osm osm
psql -d osm -c "CREATE EXTENSION postgis;"
psql -d osm -c "CREATE EXTENSION hstore;" # only required for hstore support
osm2pgsql -c -G -U osm -d osm data/greece-latest.osm.pbf

#imposm
# dropdb osm
# createdb -E UTF8 -O osm osm
# psql -d osm -c "CREATE EXTENSION postgis;"
# psql -d osm -c "CREATE EXTENSION hstore;" # only required for hstore support
# imposm3 import -mapping imposm.mapping.yml -read data/cyprus-latest.osm.pbf -write -connection postgis://osm:osm@localhost/osm  -optimize -deployproduction
