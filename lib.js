var GEO_COLUMN = 'Geographic Area',
    CR_API_BASE = 'http://api.censusreporter.org/1.0',
    CR_API_PAGE = 25;

/**
 * Container class for census tract objects.
 *
 * feature is a GeoJSON feature.
 * geoid is the Census GEOID.
 * data is unitialized and later holds a Census data dictionary.
 */
function Tract(geoid, feature)
{
    this.geoid = feature.properties.geoid;
    this.feature = feature;
    this.responses = 0.0;
    this.data = null;
}

/**
 * Borrowed from http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript.
 */
function get_query_variable(variable)
{
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for(var i = 0; i < vars.length; i++)
    {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable)
        {
            return decodeURIComponent(pair[1]);
        }
    }
    
    console.log('Query variable %s not found', variable);
}

/**
 * Load spreadsheet data with Tabletop, call one of two callback functions.
 *
 * onsuccess called with list of row objects.
 * onerror called with error message and Tabletop instance.
 */
function load_spreadsheet(gdoc_url, sheet_name, onsuccess, onerror)
{
    Tabletop.init({
        key: gdoc_url, callback: callback,
        simpleSheet: true, wanted: [sheet_name]
        });
    
    function callback(data, ttop)
    {
        try {
            if(data.length == 0) {
                return onerror('Zero rows returned', ttop);
            }
        
            if(data[0][GEO_COLUMN] == undefined) {
                return onerror('Missing "Geographic Area" column', ttop);
            }
            
            for(var i = 0; i <= data.length; i++) {
                if(data[i]) {
                    try {
                        data[i][GEO_COLUMN] = JSON.parse(data[i][GEO_COLUMN]);

                    } catch(error) {
                        data[i][GEO_COLUMN] = null;
                    }
                }
            }

        } catch(error) {
            return onerror('Caught error: ' + error.message);
        }
    
        onsuccess(data);
    }
}

/**
 * Load city census tracts from Census Reporter, pass to callback function.
 *
 * onloaded_tracts called with city GEOID, name, and list of tract objects.
 */
function load_city_tracts(city_name, onloaded_tracts)
{
    var info = {muni_geoid: null, display_name: null};
    
    jQuery.ajax(CR_API_BASE+'/geo/elasticsearch?size=1&sumlevs=160&q='+escape(city_name),
                {success: onloaded_place});
    
    function onloaded_place(json)
    {
        info.muni_geoid = json.results[0].full_geoid;
        info.display_name = json.results[0].display_name;

        jQuery.ajax(CR_API_BASE+'/geo/show/tiger2013?geo_ids=140|'+escape(info.muni_geoid),
                    {success: onloaded_geojson});
    }

    function onloaded_geojson(geojson)
    {
        var feature,
            tracts = [];
        
        while(geojson.features.length)
        {
            feature = geojson.features.shift();
            tracts.push(new Tract(feature.properties.geoid, feature));
        }
        
        onloaded_tracts(info.muni_geoid, info.display_name, tracts);
    }
}

/**
 * Load city census data tables from Census Reporter, pass to callback function.
 *
 * onloaded_all_data called with list of tract objects.
 */
function load_tract_data(original_tracts, onloaded_all_data)
{
    var output_tracts = [],
        source_tracts = original_tracts.slice();
    
    load_more_data();
    
    function load_more_data()
    {
        if(source_tracts.length == 0)
        {
            return onloaded_all_data(output_tracts);
        }
        
        var request_tracts = [],
            tables = 'B01003,B03002,B19013,B19301,B25003',
            geoids = [];
        
        while(geoids.length < CR_API_PAGE && source_tracts.length)
        {
            var tract = source_tracts.shift();
            request_tracts.push(tract);
            geoids.push(tract.geoid);
        }
        
        console.log(source_tracts.length, request_tracts.length, output_tracts.length);

        jQuery.ajax(CR_API_BASE+'/data/show/acs2013_5yr?table_ids='+tables+'&geo_ids='+geoids.join(','),
                    {success: function(response) { onloaded_data(request_tracts, response.data) }});
    }
    
    function onloaded_data(request_tracts, data)
    {
        while(request_tracts.length)
        {
            var tract = request_tracts.shift(),
                datum = data[tract.geoid];

            tract.data = {
                // total population
                'B01003001': { estimate: datum['B01003'].estimate['B01003001'],
                               error: datum['B01003'].error['B01003001'] },
                // hispanic population
                'B03002012': { estimate: datum['B03002'].estimate['B03002012'],
                               error: datum['B03002'].error['B03002012'] },
                // white population
                'B03002003': { estimate: datum['B03002'].estimate['B03002003'],
                               error: datum['B03002'].error['B03002003'] },
                // black population
                'B03002004': { estimate: datum['B03002'].estimate['B03002004'],
                               error: datum['B03002'].error['B03002004'] },
                // asian population
                'B03002006': { estimate: datum['B03002'].estimate['B03002006'],
                               error: datum['B03002'].error['B03002006'] },
                // other race population
                'B0300200x': { estimate: datum['B03002'].estimate['B03002005'] + datum['B03002'].estimate['B03002007'] + datum['B03002'].estimate['B03002008'] + datum['B03002'].estimate['B03002009'],
                               error: undefined },
                // median household income
                'B19013001': { estimate: datum['B19013'].estimate['B19013001'],
                               error: datum['B19013'].error['B19013001'] },
                // per-capita income
                'B19301001': { estimate: datum['B19301'].estimate['B19301001'],
                               error: datum['B19301'].error['B19301001'] },
                // total housing
                'B25003001': { estimate: datum['B25003'].estimate['B25003001'],
                               error: datum['B25003'].error['B25003001'] },
                // owner-occupied housing
                'B25003002': { estimate: datum['B25003'].estimate['B25003002'],
                               error: datum['B25003'].error['B25003002'] }
                };

            output_tracts.push(tract);
        }
        
        load_more_data();
    }
}

function update_status(message)
{
    document.getElementById('status').innerText = message;
}
