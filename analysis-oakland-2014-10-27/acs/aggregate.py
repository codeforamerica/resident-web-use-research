from __future__ import division
from csv import DictReader, reader, writer

bayarea_tracts = dict()

with open('tracts-bayarea.txt') as file:
    rows = DictReader(file, dialect='excel-tab')
    
    for row in rows:
        tract_geoid = row['State FIPS'] + row['County FIPS'] + row['Tract']
        bayarea_tracts[tract_geoid] = {
            'housing units': row['H00010001'],
            'total population': row['P0010001'],
            }
        
        if row['P0080001'] != '0':
            total = float(row['P0080001'])
            white = float(row['P0080003'])
            black = float(row['P0080004'])
            asian = float(row['P0080006'])
            other = total - white - black - asian
        
            bayarea_tracts[tract_geoid].update({
                'white percent': 100 * white / total,
                'black percent': 100 * black / total,
                'asian percent': 100 * asian / total,
                'other race percent': 100 * other / total,
                })
        
        if row['P0090001'] != '0':
            total = float(row['P0090001'])
            latin = float(row['P0090002'])
            other = total - latin
        
            bayarea_tracts[tract_geoid].update({
                'latin percent': 100 * latin / total,
                'nonlatin percent': 100 * other / total,
                })
        
        '''
        H1. HOUSING UNITS [1]
            Universe: Housing units
            Total H00010001 42 9

        P0010001 - TOTAL POPULATION
        
        P8. RACE [71]
            Universe: Total population
            Total: P0080001 03 9
            Population of one race: P0080002 03 9
                White alone P0080003 03 9
                Black or African American alone P0080004 03 9
                American Indian and Alaska Native alone P0080005 03 9
                Asian alone P0080006 03 9
                Native Hawaiian and Other Pacific Islander alone P0080007 03 9
                Some Other Race alone P0080008 03 9
                Two or More Races: P0080009 03 9

        P12. SEX BY AGE [49]
            Universe: Total population
            Total: P0120001 04 9
                Male: P0120002 04 9
                    Under 5 years P0120003 04 9
                    5 to 9 years P0120004 04 9
                    10 to 14 years P0120005 04 9
                    15 to 17 years P0120006 04 9
                    18 and 19 years P0120007 04 9
                    20 years P0120008 04 9
                    21 years P0120009 04 9
                    22 to 24 years P0120010 04 9
                    25 to 29 years P0120011 04 9
                    30 to 34 years P0120012 04 9
                    35 to 39 years P0120013 04 9
                    40 to 44 years P0120014 04 9
                    45 to 49 years P0120015 04 9
                    50 to 54 years P0120016 04 9
                    55 to 59 years P0120017 04 9
                    60 and 61 years P0120018 04 9
                    62 to 64 years P0120019 04 9
                    65 and 66 years P0120020 04 9
                    67 to 69 years P0120021 04 9
                    70 to 74 years P0120022 04 9
                    75 to 79 years P0120023 04 9
                    80 to 84 years P0120024 04 9
                    85 years and over P0120025 04 9
                Female: P0120026 04 9
                    Under 5 years P0120027 04 9
                    5 to 9 years P0120028 04 9
                    10 to 14 years P0120029 04 9
                    15 to 17 years P0120030 04 9
                    18 and 19 years P0120031 04 9
                    20 years P0120032 04 9
                    21 years P0120033 04 9
                    22 to 24 years P0120034 04 9
                    25 to 29 years P0120035 04 9
                    30 to 34 years P0120036 04 9
                    35 to 39 years P0120037 04 9
                    40 to 44 years P0120038 04 9
                    45 to 49 years P0120039 04 9
                    50 to 54 years P0120040 04 9
                    55 to 59 years P0120041 04 9
                    60 and 61 years P0120042 04 9
                    62 to 64 years P0120043 04 9
                    65 and 66 years P0120044 04 9
                    67 to 69 years P0120045 04 9
                    70 to 74 years P0120046 04 9
                    75 to 79 years P0120047 04 9
                    80 to 84 years P0120048 04 9
                    85 years and over P0120049 04 9

        '''

acs_tracts, acs_area_ids = dict(), set()

with open('g20125ca.txt') as file:
    ''' ACSSF CA080000003021     060019223053000401000                                                                                                                                    08000US060019223053000401000            Census Tract 4010, Oakland city, Oakland CCD, Alameda County, California                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
    '''
    for line in file:
        summary_level = line[178:181]
        
        if summary_level != '140':
            # not a tract
            continue
        
        state_fips = line[25:27]
        county_fips = line[27:30]
        tract_id = line[40:46]
        tract_geoid = state_fips + county_fips + tract_id
        acs_area_id = line[13:20]
    
        acs_tracts[tract_geoid] = acs_area_id
        acs_area_ids.add(acs_area_id)

#
# quick idiot check for missing bay area tracts
#
if (set(bayarea_tracts.keys()) - set(acs_tracts.keys())):
    raise Exception()

acs_rows = dict()

with open('Sequence_Number_and_Table_Number_Lookup.txt') as file:
    for row in DictReader(file, dialect='excel'):
        if row['Table Title'] == 'MEDIAN HOUSEHOLD INCOME IN THE PAST 12 MONTHS (IN 2012 INFLATION-ADJUSTED DOLLARS)':
            income_column = int(row['Start Position']) - 1
            print '{0} ({1})'.format(income_column, row['Start Position'])

with open('e20125ca0058000.txt') as file:
    rows = reader(file, dialect='excel')
    
    for row in rows:
        acs_area_id = row[5]
        med_income = row[income_column]
        acs_rows[acs_area_id] = None if (med_income == '.') else int(med_income)

#
# quick idiot check for missing ACS area IDs
#
if (acs_area_ids - set(acs_rows.keys())):
    raise Exception()

#
# Now look up the actual stuff
#
with open('aggregated.csv', 'w') as file:
    out = writer(file, dialect='excel')
    out.writerow(('geoid', 'total population', 'housing units', 'median income',
                  'white percent', 'black percent', 'asian percent',
                  'other race percent', 'latin percent', 'non latin percent'))
    
    for (tract_id, sf1_data) in sorted(bayarea_tracts.items()):
        acs_area_id = acs_tracts[tract_id]
        args = tract_id, acs_area_id, acs_rows[acs_area_id], sf1_data['total population'], sf1_data['housing units']

        print 'Tract {0} ({1}) ${2}, {3} people, {4} homes'.format(*args), sf1_data

        row = (
            tract_id, sf1_data['total population'], sf1_data['housing units'],
            acs_rows[acs_area_id], sf1_data.get('white percent', None), sf1_data.get('black percent', None),
            sf1_data.get('asian percent', None), sf1_data.get('other race percent', None),
            sf1_data.get('latin percent', None), sf1_data.get('non latin percent', None)
            )
        out.writerow(row)
