var GEO_COLUMN = 'Geographic Area',
    CR_API_BASE = 'http://api.censusreporter.org/1.0',
    CR_API_PAGE = 25;

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

function load_city_tracts(city_name, onloaded_tracts)
{
    var info = {};
    
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
        onloaded_tracts(info.muni_geoid, info.display_name, geojson.features);
    }
}

function load_tract_data(original_tracts, onloaded_all_data)
{
    var output_tracts = [],
        source_tracts = original_tracts.slice();
    
    load_data();
    
    function load_data()
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
            geoids.push(tract.properties.geoid);
            request_tracts.push(tract);
        }
        
        console.log(source_tracts.length, request_tracts.length, output_tracts.length);

        jQuery.ajax(CR_API_BASE+'/data/show/acs2013_5yr?table_ids='+tables+'&geo_ids='+geoids.join(','),
                    {success: function(response) { onloaded_data(request_tracts, response.data) }});
    }
    
    function onloaded_data(request_tracts, data)
    {
        while(request_tracts.length)
        {
            var tract = request_tracts.shift();
            tract.data = data[tract.properties.geoid];
            output_tracts.push(tract);
        }
        
        load_data();
    }
}

function update_status(message)
{
    document.getElementById('status').innerText = message;
}
