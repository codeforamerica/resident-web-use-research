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
 * Container class for survey response objects.
 *
 * fields is a dictionary of response fields.
 * feature is a GeoJSON feature.
 */
function Response(fields, feature)
{
    this.fields = fields;
    this.feature = feature;
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
 * onsuccess called with list of Response objects.
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
        var responses = [];
    
        try {
            if(data.length == 0) {
                return onerror('Zero rows returned', ttop);
            }
        
            if(data[0][GEO_COLUMN] == undefined) {
                return onerror('Missing "Geographic Area" column', ttop);
            }
            
            for(var i = 0; i <= data.length; i++) {
                if(data[i]) {
                    var fields = data[i],
                        feature;
                
                    try {
                        feature = JSON.parse(fields[GEO_COLUMN]);
                        delete fields[GEO_COLUMN];

                    } catch(error) {
                        feature = null;
                    }
                    
                    responses.push(new Response(fields, feature));
                }
            }

        } catch(error) {
            return onerror('Caught error: ' + error.message);
        }
    
        onsuccess(responses);
    }
}

/**
 * Load city census tracts from Census Reporter, pass to callback function.
 *
 * onloaded_tracts called with city GEOID, name, and list of Tract objects.
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
            
            if(feature.properties.aland > 0)
            {
                tracts.push(new Tract(feature.properties.geoid, feature));
            }
        }
        
        onloaded_tracts(info.muni_geoid, info.display_name, tracts);
    }
}

/**
 * Load city census data tables from Census Reporter, pass to callback function.
 *
 * onloaded_all_data called with list of Tract objects.
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

/**
 * Correlate geographic overage of neighborhoods with Census tracts.
 *
 * responses is a list of response GeoJSON features.
 * tracts is a list of Tract objects, each modified by reference.
 *
 * oncorrelated called with list of Tract objects.
 */
function correlate_geographies(responses, tracts, oncorrelated)
{
    console.log('Responses:', responses.length);
    console.log('One response:', responses[0]);
    
    console.log('Tracts:', tracts.length);
    console.log('One tract:', tracts[0]);
    
    for(var i = 0; i < responses.length; i++)
    {
        var response = responses[i],
            // Overall population estimated to lie within this response.
            population_estimate = 0,
            // Tract-by-tract shares of overall population.
            intersection_pops = {};
        
        for(var j = 0; j < tracts.length; j++)
        {
            var tract = tracts[j],
                intersection = turf.intersect(tract.feature, response.feature);
            
            if(intersection)
            {
                var tract_share = turf.area(intersection) / turf.area(tract.feature),
                    intersection_pop = tract_share * tract.data['B01003001'].estimate;
                
                population_estimate += intersection_pop;
                intersection_pops[tract.geoid] = intersection_pop;
            
                //console.log('Tract ' + tract.feature.properties.name + ' intersects area ' + response.feature.properties.ZCTA5CE10 + ' by ' + Math.round(share * 100) + '%');
            }
        }
    
        console.log('Response', response.feature.properties.ZCTA5CE10, '-- est.', population_estimate.toFixed(0), 'people');
        
        for(var j = 0; j < tracts.length; j++)
        {
            var tract = tracts[j],
                share = intersection_pops[tract.geoid] / population_estimate;
            
            if(share)
            {
                tract.responses += share;
            }
        }
    }
    
    var total = 0;
    
    for(var i = 0; i < tracts.length; i++)
    {
        console.log('Tract', tracts[i].geoid, '-- est.', tracts[i].responses.toFixed(3), 'responses');
        total += tracts[i].responses;
    }
    
    console.log('Total', total.toFixed(3));
    
    oncorrelated(tracts);
}

/**
 * Calculate coefficient of determination for tract responses, return R-squared.
 *
 * tracts is a list of Tract objects.
 * numerator is required data column to calculate against.
 * denominator is optional data column to calculate against.
 */
function calculate_regression(tracts, numerator, denominator)
{
    var points = [],
        total = 0;
    
    for(var i = 0; i < tracts.length; i++)
    {
        var tract = tracts[i],
            population = tract.data[numerator].estimate,
            responses = tract.responses;
        
        if(denominator)
        {
            population /= tract.data[denominator].estimate;
        }
        
        if(!isNaN(population))
        {
            points.push([population, responses]);
            total += responses;
        }
    }
    
    var average = total / points.length;
    
    // Calculate linear regression using ordinary least squares
    var result = regression('linear', points),
        ss_residual = 0, ss_total = 0;
    
    for(var i = 0; i < points.length; i++)
    {
        var actual = points[i][1],
            expected = result.points[i][1];
        
        ss_residual += Math.pow(actual - expected, 2);
        ss_total += Math.pow(actual - average, 2);
    }
    
    var r_squared = 1 - ss_residual / ss_total;
    
    console.log(numerator, ss_total, 'total', ss_residual, 'residual', points.length, 'points', average, 'average', 'R^2:', r_squared);
    
    return r_squared;
}

function update_status(message)
{
    document.getElementById('status').innerText = message;
}
