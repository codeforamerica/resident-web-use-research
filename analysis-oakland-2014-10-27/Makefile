tracts-2768.shp: \
        acs/aggregated.csv \
        2768/neighborhoods.shp 2768/regions.shp 2768/zipcodes.shp \
        2768/tracts.shp 2768/districts.shp 2768/east-oakland.shp
	python tract-hoods.py
	ogr2ogr -overwrite -a_srs EPSG:2768 tracts-2768.shp tracts-2768.geojson

acs/aggregated.csv: \
        acs/g20125ca.txt acs/e20125ca0058000.txt acs/tracts-bayarea.txt \
        acs/Sequence_Number_and_Table_Number_Lookup.txt
	cd acs && python aggregate.py

acs/g20125ca.txt: acs/g20125ca.txt.bz2
	bzcat acs/g20125ca.txt.bz2 > acs/g20125ca.txt

acs/e20125ca0058000.txt: acs/e20125ca0058000.txt.bz2
	bzcat acs/e20125ca0058000.txt.bz2 > acs/e20125ca0058000.txt

acs/Sequence_Number_and_Table_Number_Lookup.txt: acs/Sequence_Number_and_Table_Number_Lookup.txt.bz2
	bzcat acs/Sequence_Number_and_Table_Number_Lookup.txt.bz2 > acs/Sequence_Number_and_Table_Number_Lookup.txt

acs/tracts-bayarea.txt: acs/tracts-bayarea.txt.bz2
	bzcat acs/tracts-bayarea.txt.bz2 > acs/tracts-bayarea.txt

2768/neighborhoods.shp: 2768/neighborhoods.tar.bz2
	tar -C 2768 -xjvf 2768/neighborhoods.tar.bz2

2768/regions.shp: 2768/regions.tar.bz2
	tar -C 2768 -xjvf 2768/regions.tar.bz2

2768/zipcodes.shp: 2768/zipcodes.tar.bz2
	tar -C 2768 -xjvf 2768/zipcodes.tar.bz2

2768/tracts.shp: 2768/tracts.tar.bz2
	tar -C 2768 -xjvf 2768/tracts.tar.bz2

2768/districts.shp: 2768/districts.tar.bz2
	tar -C 2768 -xjvf 2768/districts.tar.bz2

2768/east-oakland.shp: 2768/east-oakland.tar.bz2
	tar -C 2768 -xjvf 2768/east-oakland.tar.bz2
