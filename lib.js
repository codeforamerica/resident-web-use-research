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
    console.log('loading', gdoc_url, sheet_name);

    Tabletop.init({
        key: gdoc_url, callback: onloaded,
        simpleSheet: true, wanted: ['Survey Results All']
        });
}

function load_city_tracts(city_name, onloaded_tracts)
{
    var api_base_href = 'http://api.censusreporter.org/1.0';
    
    var url = api_base_href+'/geo/elasticsearch?size=1&sumlevs=160&q='+escape(city_name),
        result = jQuery.ajax(url, {async: false}),
        muni_geoid = result.responseJSON.results[0].full_geoid,
        display_name = result.responseJSON.results[0].display_name;

    function onloaded_geojson(geojson)
    {
        onloaded_tracts(muni_geoid, display_name, geojson.features);
    }

    var url = api_base_href+'/geo/show/tiger2013?geo_ids=140|'+muni_geoid,
        result = jQuery.ajax(url, {async: true, success: onloaded_geojson});
}

function update_status(message)
{
    document.getElementById('status').innerText = message;
}
