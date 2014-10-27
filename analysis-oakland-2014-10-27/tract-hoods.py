from osgeo import ogr
from csv import reader, DictReader
import json

neighborhoods_ds = ogr.Open('2768/neighborhoods.shp')
neighborhoods_lyr = neighborhoods_ds.GetLayer(0)

regions_ds = ogr.Open('2768/regions.shp')
regions_lyr = regions_ds.GetLayer(0)

zipcodes_ds = ogr.Open('2768/zipcodes.shp')
zipcodes_lyr = zipcodes_ds.GetLayer(0)

tracts_ds = ogr.Open('2768/tracts.shp')
tracts_lyr = tracts_ds.GetLayer(0)

districts_ds = ogr.Open('2768/districts.shp')
districts_lyr = districts_ds.GetLayer(0)

east_oakland_ds = ogr.Open('2768/east-oakland.shp')
east_oakland_lyr = east_oakland_ds.GetLayer(0)

neighborhoods = dict( [(f.GetField('Name').lower(), f) for f in neighborhoods_lyr] )
regions = dict( [(f.GetField('Name').lower(), f) for f in regions_lyr] )
zipcodes = dict( [(f.GetField('ZCTA5CE10').lower(), f) for f in zipcodes_lyr] )
tracts = dict( [(f.GetField('GEOID10').lower(), f) for f in tracts_lyr] )
districts = dict( [('district '+f.GetField('Name').lower(), f) for f in districts_lyr] )
east_oakland = dict( [(f.GetField('Name').lower(), f) for f in east_oakland_lyr] )

areas, counts = dict(), dict()

names = '''
Oakland neighborhood (known)

longfellow
longfellow


dimond
east oakland
north oakland
rockridge
mcclymonds
piedmont avenue
adams point
longfellow
lakeside
downtown
dimond
west oakland
longfellow
san antonio
santa fe
upper dimond
downtown
glenview
adams point
lakeside
lakeside
north oakland
piedmont avenue
montclair
piedmont avenue
temescal
temescal
temescal
rockridge
montclair
montclair
rockridge
montclair
montclair

glenview
oakmore
upper rockridge
temescal
north oakland
cleveland heights
lakeside
upper rockridge
temescal
piedmont avenue
oakland ave/ harrison st
maxwell park
dimond
upper laurel
chinatown
east oakland
sheffield village
laurel
piedmont avenue
downtown
rockridge
rockridge
piedmont avenue
golden gate
laurel
temescal
cleveland heights
golden gate
laurel

rockridge
mosswood
downtown
north oakland
crocker highland
produce & waterfront
dimond
lakeside
oakland ave/ harrison st
seminary
lakeside
eastmont hills
upper rockridge
redwood heights
lynn/ highland park
rockridge
longfellow
ivy hill
fruitvale
san antonio
golden gate
lynn/ highland park
west oakland
rockridge
downtown
glenview
adams point
golden gate
laurel
rockridge
piedmont avenue
temescal
caballo hills
longfellow
piedmont avenue
rockridge
lakeshore
montclair
grand lake
temescal
temescal
north oakland
mosswood
piedmont avenue
crocker highland
maxwell park
central east oakland
adams point
glenview

north oakland
piedmont avenue
temescal
bushrod
upper rockridge
west oakland
temescal
sequoyah
piedmont avenue

santa fe
adams point
oakland ave/ harrison st
longfellow
temescal
longfellow
longfellow
west oakland
millsmont
bella vista
longfellow
piedmont avenue
dimond
upper dimond
dimond
dimond
adams point
temescal
adams point
temescal
reservoir hill/ meadow brook
san antonio
santa fe
upper dimond
temescal
bella vista
upper dimond
longfellow

upper dimond
east oakland
lakeside
piedmont avenue
piedmont avenue
grand lake
crocker highland
west oakland
oakmore
dimond
rockridge
rockridge
east oakland
montclair
claremont
fruitvale
grand lake
maxwell park
piedmont avenue
crocker highland
piedmont pines
grand lake
mosswood
temescal
laurel
montclair
piedmont pines
san antonio
claremont
redwood heights
piedmont pines
northeast hills
dimond
lakeside
north kennedy tract
rockridge
downtown
grand lake
glenview
rockridge
adams point
laurel

west oakland

montclair
west oakland
district 2
north oakland
redwood heights
laurel
northgate
north kennedy tract
golden gate
cleveland heights
downtown
east oakland
north kennedy tract
piedmont avenue
north kennedy tract
leona heights
piedmont avenue
lakeshore
laurel
north kennedy tract

piedmont avenue
east oakland
allendale
allendale
montclair
laurel
lakeshore
fruitvale
montclair
longfellow
longfellow
reservoir hill/ meadow brook
produce & waterfront
clinton
fruitvale
glenview
north oakland
allendale
produce & waterfront
lynn/ highland park
montclair
rockridge
prescott
produce & waterfront
adams point
east oakland
chinatown
durant manor
toler heights
redwood heights
adams point
cleveland heights
lakeside
sequoyah
temescal
adams point
golf links
produce & waterfront
fruitvale
harrington
upper laurel
redwood heights
trestle glen
montclair
clinton
longfellow
produce & waterfront
allendale
montclair
oakmore
dimond
cleveland heights
montclair

adams point
north kennedy tract
southeast hills
shafter
san antonio
maxwell park
produce & waterfront
oakmore
melrose
upper rockridge
glenview
crocker highland
oakmore
rockridge
rockridge
crocker highland
golden gate
sequoyah
94605
oakmore
ivy hill
temescal
cleveland heights
clawson
piedmont pines

downtown
temescal
piedmont pines
rockridge
elmhurst
rockridge
west oakland
upper rockridge
oakmore
upper dimond

caballo hills
prescott

lincoln highlands
hoover/ foster
upper dimond
piedmont pines
montclair
west oakland
adams point
claremont
cleveland heights
webster
woodminster
golden gate
fruitvale
crocker highland
laurel
produce & waterfront
millsmont
produce & waterfront

upper dimond
upper rockridge
oakmore
south prescott
longfellow
fruitvale
sequoyah
lakeside
millsmont
produce & waterfront
montclair
west oakland
bushrod
rockridge
montclair
maxwell park
montclair
produce & waterfront
adams point
lakeside
94605
produce & waterfront
chinatown
north kennedy tract
grand lake
caballo hills
rockridge
sequoyah
produce & waterfront
sequoyah
downtown
sequoyah
piedmont pines
sequoyah
piedmont avenue
southeast hills
upper rockridge
north kennedy tract
dimond
dimond
rockridge
ivy hill
laurel
rockridge
melrose
eastmont hills
adams point
montclair
sequoyah
dimond
montclair
grand lake
fruitvale
grand lake
montclair
tuxedo
montclair

northeast hills
rockridge
golden gate
chinatown
north kennedy tract

lincoln highlands
west oakland
west oakland
fruitvale
west oakland
laurel
east oakland
old city/ produce & waterfront
oakmore
north kennedy tract
sequoyah
oakmore
district 1
oakmore
crocker highland
oakmore
piedmont avenue
longfellow
tuxedo
adams point
adams point
montclair
shafter
oakmore
rockridge
temescal
melrose
dimond
east oakland
oakland ave/ harrison st
adams point
northeast hills
east oakland
crocker highland
eastmont hills
downtown
north oakland
montclair
montclair
oakmore
bartlett
grand lake
cleveland heights
redwood heights
fruitvale
north stonehurst
glenview
oakmore
glenview
dimond
montclair
produce & waterfront
bushrod
fairfax
temescal
downtown
downtown
dimond
santa fe
santa fe
crocker highland
golden gate
rockridge
downtown
downtown
oakmore
dimond
adams point
golden gate
north kennedy tract
94602
caballo hills
lakeside
rockridge
fairview park
north kennedy tract
east oakland
grand lake
acorn/ acorn industrial
west oakland
downtown
sausal creek
bella vista
adams point
chinatown
montclair
rockridge
east oakland
north oakland
piedmont avenue
oakmore
montclair
adams point
woodminster
piedmont avenue
chinatown
north oakland
south prescott

dimond
sequoyah
rockridge
west oakland
produce & waterfront
west oakland
dimond
rockridge
east peralta
oakmore
rockridge
fruitvale
montclair
montclair
produce & waterfront
rockridge
east oakland
west oakland
lynn/ highland park
maxwell park
san antonio
piedmont avenue
produce & waterfront
adams point
fruitvale
temescal
oakmore
piedmont avenue
northeast hills
cleveland heights
cleveland heights
lincoln highlands
lakeshore
fruitvale
downtown
downtown
cleveland heights
fruitvale
lakeshore

bushrod
redwood heights
forestland
lakeside
crocker highland
north oakland
laurel
lincoln highlands
lynn/ highland park
laurel
golden gate
downtown
grand lake
frick
grand lake
piedmont pines
glenview
southeast hills
piedmont avenue
dimond
lakeside
longfellow
santa fe
grand lake
temescal
maxwell park
northgate
adams point
temescal
northgate
rockridge
montclair
laurel
downtown
north kennedy tract
94609
west oakland
adams point
crocker highland

adams point
mosswood
redwood heights
rockridge
crocker highland
webster
94610

santa fe
montclair
94612
downtown
glenview
bancroft business/ havenscourt

rockridge

adams point
lakeshore
west oakland
dimond
san antonio
montclair
sheffield village
lakeshore
montclair
southeast hills
bella vista
lakeside
longfellow
piedmont avenue
west oakland
adams point
southeast hills
sequoyah
sequoyah
north oakland
sequoyah
produce & waterfront
chabot park
southeast hills
sequoyah
redwood heights
94606
longfellow
downtown
fruitvale
temescal
leona heights
lower hills
longfellow
cleveland heights
caballo hills
longfellow
temescal
redwood heights
piedmont pines
montclair
east oakland
ivy hill
prescott
upper rockridge
lakeside
glenview
sobrante park
west oakland
chinatown
piedmont avenue
redwood heights
produce & waterfront
cleveland heights
old city/ produce & waterfront
west oakland
lakeshore
oakland ave/ harrison st
cleveland heights
toler heights
rockridge
temescal
eastmont hills
redwood heights

shafter
northgate
temescal
clinton
temescal
longfellow
maxwell park
maxwell park
fruitvale
clawson
glenview
west oakland
crocker highland
maxwell park
crocker highland
rockridge
glenview
adams point
lakeside
upper dimond
peralta/ laney
allendale
sequoyah
cleveland heights
downtown
upper rockridge
crocker highland
temescal
rockridge
cleveland heights
oakmore
bella vista
94610
sequoyah
mcclymonds
san antonio
sequoyah
seminary
mosswood
redwood heights
northgate
cleveland heights
west oakland
grand lake
redwood heights
temescal
waverly
east oakland
san antonio
north oakland
east oakland
toler heights

longfellow
maxwell park
rockridge
94612
cleveland heights
laurel
prescott
eastmont hills
glenview
piedmont avenue
west oakland
produce & waterfront
north oakland
sequoyah
bartlett
laurel
adams point
south prescott
downtown
fairview park
94605
tuxedo
district 6
produce & waterfront
adams point
fruitvale
redwood heights
northeast hills
bushrod
grand lake
downtown
maxwell park
lakeside
ivy hill
montclair
las palmas
eastmont
montclair
west oakland
claremont
redwood heights
temescal
old city/ produce & waterfront
laurel
longfellow
piedmont pines
montclair
94611
longfellow
upper dimond
district 4
upper rockridge
rockridge
golden gate
downtown
glenview
crocker highland
north oakland
rockridge
west oakland
produce & waterfront
claremont
leona heights
rockridge
fruitvale
millsmont
adams point
rockridge
gaskill
clawson
fruitvale
piedmont avenue
pill hill
san antonio
rockridge
downtown
temescal
millsmont
piedmont pines
north oakland
north kennedy tract
eastmont
lakeside
adams point
fruitvale
rockridge
bushrod
woodminster
temescal
temescal
clawson
fruitvale
southeast hills
cleveland heights
san antonio
clawson
montclair
downtown
lakeside
clawson
ralph bunche
lakeside
adams point
glenview
temescal
rockridge
north kennedy tract
piedmont avenue
sequoyah
adams point
produce & waterfront
north oakland
adams point
adams point
montclair
glenview
hoover/ foster

longfellow
94605
dimond
west oakland
temescal
prescott
produce & waterfront
reservoir hill/ meadow brook
northeast hills
grand lake
adams point
produce & waterfront
temescal
oakmore
94609
montclair
old city/ produce & waterfront
crestmont
rockridge
bushrod
upper dimond

fremont
central east oakland
crocker highland
east oakland
north oakland
cleveland heights
grand lake
bushrod
rockridge
montclair
crocker highland
sequoyah

san antonio
maxwell park
montclair
produce & waterfront
maxwell park
woodminster
seminary
lynn/ highland park
laurel
oakmore
mills college
laurel
produce & waterfront
pill hill
rockridge
grand lake
dimond
94606
southeast hills
adams point
montclair
lynn/ highland park
sequoyah
temescal
lakeside
fruitvale
bushrod
temescal
east oakland
lakeside
santa fe
rockridge
upper rockridge
temescal
temescal
fruitvale
district 6
reservoir hill/ meadow brook
caballo hills

east oakland
bushrod
crocker highland
mills college
chinatown
piedmont avenue
maxwell park
temescal
produce & waterfront
east oakland
golden gate
dimond
longfellow
upper rockridge
north oakland
hoover/ foster
north kennedy tract
rockridge
grand lake
laurel
lynn/ highland park
piedmont pines
piedmont avenue
rockridge
longfellow
mills college
north oakland
adams point
west oakland
west oakland
school
northgate
piedmont avenue
94612
west oakland
adams point
rockridge
west oakland
west oakland
94606
temescal
fruitvale
north oakland
rockridge
millsmont
rockridge
rockridge
rockridge
sequoyah
montclair
laurel
east oakland
laurel
fruitvale
fruitvale
east oakland
east oakland
elmhurst
fremont
fruitvale
fruitvale
central east oakland
fruitvale
fruitvale
san antonio
94603
central east oakland
central east oakland
east oakland
fruitvale
west oakland
94603
lakeside

chinatown
san antonio
94602

94619
chinatown
east oakland
downtown



southeast hills
southeast hills






























































'''

for name in names.split('\n'):
    key = name.lower()

    if key in neighborhoods:
        print key, 'is a neighborhood'
        if key not in areas:
            areas[key] = neighborhoods[key]
    elif key in zipcodes:
        print key, 'is a zipcode'
        if key not in areas:
            areas[key] = zipcodes[key]
    elif key in regions:
        print key, 'is a region'
        if key not in areas:
            areas[key] = regions[key]
    elif key in districts:
        print key, 'is a district'
        if key not in areas:
            areas[key] = districts[key]
    elif key in east_oakland:
        print key, 'is east oakland'
        if key not in areas:
            areas[key] = east_oakland[key]
    else:
        print repr(key), 'is nothing'
        continue
    
    counts[key] = 1 + counts.get(key, 0)

tract_counts = dict()

for (key, area) in sorted(areas.items()):
    print key, counts[key]
    
    responses = counts[key]
    area_geom = area.GetGeometryRef()
    
    for (geoid, tract) in tracts.items():
        tract_geom = tract.GetGeometryRef()
        if not area_geom.Intersects(tract_geom) or not area_geom.Intersection(tract_geom):
            continue

        share = area_geom.Intersection(tract_geom).Area() / area_geom.Area()
        
        if share < .05:
            continue
        
        tract_counts[geoid] = (responses * share) + tract_counts.get(geoid, 0.)

####

# people, housing units by tract GEOID
population = dict()

with open('tracts.txt') as file:
    for row in DictReader(file, dialect='excel-tab'):
        geoid = row['State FIPS'] + row['County FIPS'] + row['Tract']
        population[geoid] = int(row['P0010001']), int(row['H00010001'])

####

extras = dict()

with open('acs/aggregated.csv') as file:
    for row in DictReader(file, dialect='excel'):
        geoid = row['geoid']
        del row['geoid']
        extras[geoid] = dict([(key, None if val is '' else float(val))
                              for (key, val) in row.items()])

####

features = list()
geojson = dict(type='FeatureCollection', features=features)

for (geoid, weighted_count) in tract_counts.items():
    tract = tracts[geoid]
    density = 1000000. * weighted_count / tract.GetField('ALAND10')
    people, houses = population[geoid]
    represent = 1000 * weighted_count / people if people else 0
    properties = dict(geoid=geoid, responses=weighted_count, density=density, P1=people, H1=houses, represent=represent)
    properties.update(extras[geoid])
    feature = dict(type='Feature', properties=properties)
    feature['geometry'] = json.loads(tract.GetGeometryRef().ExportToJson())
    features.append(feature)

with open('tracts-2768.geojson', 'w') as file:
    json.dump(geojson, file)

####

print ''

from scipy.stats import linregress

measures = [
    ('White', 'white percent'),
    ('Black', 'black percent'),
    ('Hispanic', 'latin percent'),
    ('Asian', 'asian percent'),
    ('Income', 'median income'),
    ]

correlations = []

for (name, property) in measures:
    data = [[f['properties']['responses'], f['properties'][property]] for f in features]
    data = linregress([pair for pair in data if None not in pair])
    correlations.append((data[2], '{} r-value: {:.2f}'.format(name, data[2])))

for (_, words) in sorted(correlations, key=lambda (a, b): abs(a), reverse=True):
    print words
