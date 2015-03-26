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

function load_spreadsheet(gdoc_url, sheet_name, onloaded)
{
    Tabletop.init({
        key: gdoc_url, callback: onloaded,
        simpleSheet: true, wanted: [sheet_name]
        });
}

function load_city_tracts(city_name, onloaded_tracts)
{
    var api_base = 'http://api.censusreporter.org/1.0',
        info = {};
    
    jQuery.ajax(api_base+'/geo/elasticsearch?size=1&sumlevs=160&q='+escape(city_name),
                {success: onloaded_place});
    
    function onloaded_place(json)
    {
        info.muni_geoid = json.results[0].full_geoid;
        info.display_name = json.results[0].display_name;

        jQuery.ajax(api_base+'/geo/show/tiger2013?geo_ids=140|'+escape(info.muni_geoid),
                    {success: onloaded_geojson});
    }

    function onloaded_geojson(geojson)
    {
        onloaded_tracts(info.muni_geoid, info.display_name, geojson.features);
    }
}

function update_status(message)
{
    document.getElementById('status').innerText = message;
}
