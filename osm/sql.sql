 psql -d dbname -t -A -F"," -c "select * from table_name" > output.csv


--select Distinct highway, count(*) from planet_osm_point group by highway
SELECT ST_AsGeoJSON(way) from planet_osm_point where highway='traffic_signals';

-- psql -d osm -t -A -F"," -c "SELECT ST_AsGeoJSON(way) from planet_osm_point where highway='traffic_signals';" > traffic_signals_greece.json

psql -d osm -t -A -F"," -c "SELECT ST_AsGeoJSON(ST_Transform(way, 4326))from planet_osm_point where highway='traffic_signals';" > traffic_signals_greece.json
