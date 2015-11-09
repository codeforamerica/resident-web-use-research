var RESPONSES = 'Survey responses',
    GREENS = 'Greens_05', BLUES = 'Blues_05', ORANGES = 'YlOrBr_05',
    GEO_COLUMN = 'Geographic Area',
    CR_API_BASE = 'http://api.censusreporter.org/1.0',
    CR_API_PAGE = 60;

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
        
        onsuccess(responses, 'https://docs.google.com/spreadsheets/d/'+ttop.key+'/pubhtml');
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
            feature.id = feature.properties.geoid;
            
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
                datum = data[tract.geoid],
                sq_km = tract.feature.properties.aland / 1000000;
            
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
                               error: datum['B25003'].error['B25003002'] },

                // people per square km.
                'population density':
                    { estimate: datum['B01003'].estimate['B01003001'] / sq_km,
                         error: datum['B01003'].error['B01003001'] / sq_km },
                'hispanic density':
                    { estimate: datum['B03002'].estimate['B03002012'] / sq_km,
                         error: datum['B03002'].error['B03002012'] / sq_km },
                'white density':
                    { estimate: datum['B03002'].estimate['B03002003'] / sq_km,
                         error: datum['B03002'].error['B03002003'] / sq_km },
                'black density':
                    { estimate: datum['B03002'].estimate['B03002004'] / sq_km,
                         error: datum['B03002'].error['B03002004'] / sq_km },
                'asian density':
                    { estimate: datum['B03002'].estimate['B03002006'] / sq_km,
                         error: datum['B03002'].error['B03002006'] / sq_km },

                // percentages
                'rental percentage':
                    { estimate: 100 * (datum['B25003'].estimate['B25003001'] - datum['B25003'].estimate['B25003002']) / datum['B25003'].estimate['B25003001'],
                         error: undefined },
                'hispanic percentage':
                    { estimate: 100 * datum['B03002'].estimate['B03002012'] / datum['B01003'].estimate['B01003001'],
                         error: undefined },
                'white percentage':
                    { estimate: 100 * datum['B03002'].estimate['B03002003'] / datum['B01003'].estimate['B01003001'],
                         error: undefined },
                'black percentage':
                    { estimate: 100 * datum['B03002'].estimate['B03002004'] / datum['B01003'].estimate['B01003001'],
                         error: undefined },
                'asian percentage':
                    { estimate: 100 * datum['B03002'].estimate['B03002006'] / datum['B01003'].estimate['B01003001'],
                         error: undefined }
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

/**
 * Get a list of 5 RGB color values from Cynthia Brewer for a name.
 *
 * colors is an optional constant like GREENS, BLUES, or ORANGES.
 */
function get_color_list(colors)
{
    if(colors == GREENS) {
        // http://soliton.vm.bytemark.co.uk/pub/cpt-city/cb/seq/tn/Greens_05.png.index.html
        return ['rgb(237,248,233)', 'rgb(186,228,179)', 'rgb(116,196,118)',
                'rgb(49,163,84)', 'rgb(0,109,44)'];

    } else if(colors == BLUES) {
        // http://soliton.vm.bytemark.co.uk/pub/cpt-city/cb/seq/tn/Blues_05.png.index.html
        return ['rgb(239,243,255)', 'rgb(189,215,231)', 'rgb(107,174,214)',
                'rgb(49,130,189)', 'rgb(8,81,156)'];

    } else if(colors == ORANGES) {
        // http://soliton.vm.bytemark.co.uk/pub/cpt-city/cb/seq/tn/YlOrBr_05.png.index.html
        return ['rgb(255,255,212)', 'rgb(254,217,142)', 'rgb(254,153,41)',
                'rgb(217,95,14)', 'rgb(153,52,4)'];

    } else {
        // http://soliton.vm.bytemark.co.uk/pub/cpt-city/cb/seq/tn/Greys_05.png.index.html
        return ['rgb(247,247,247)', 'rgb(204,204,204)', 'rgb(150,150,150)',
                'rgb(99,99,99)', 'rgb(37,37,37)'];
    }
}

/**
 * Get a style function usable with a GeoJSON layer.
 *
 * tracts is a list of Tract objects.
 * data_point is a reference to an estimate in each tract's data.
 * colors is a color set usable by get_color_list().
 */
function get_style_function(tracts, data_point, colors)
{
    var value, data = {},
        histogram = [], minimum, maximum,
        color_list = get_color_list(colors);
    
    for(var i = 0; i < tracts.length; i++)
    {
        if(data_point == RESPONSES) {
            value = tracts[i].responses;
        
        } else {
            value = tracts[i].data[data_point].estimate;
        }

        data[tracts[i].geoid] = value;
        histogram.push(value);
    }
    
    // LOL Javascript sorts alphabetically
    histogram.sort(function(a, b) { return a - b });
    minimum = Math.min.apply(null, histogram);
    maximum = Math.max.apply(null, histogram);
    
    function lerp(c)
    {
        return minimum + (maximum - minimum) * c;
    }
    
    return function(feature)
    {
        var color, value = data[feature.id];
        
        if(value < lerp(.1) || isNaN(value)) {
            color = color_list[0];
    
        } else if(value < lerp(.2)) {
            color = color_list[1];
    
        } else if(value < lerp(.4)) {
            color = color_list[2];
    
        } else if(value < lerp(.7)) {
            color = color_list[3];
    
        } else {
            color = color_list[4];
        }

        return {
            "stroke": true,
            "color": "rgb(0,109,44)",
            "weight": .5,
            "opacity": 1,
            "fillColor": color,
            "fillOpacity": 0.65,
            "clickable": false
        };
    }
}

/**
 * Tract demographics selector control.
 * 
 * Initialize with map data layer and list of tracts.
 */
var DemographicsControl = L.Control.extend({
    
    options: {position: 'topright'},
    
    initialize: function(datalayer, tracts, options)
    {
        this.tracts = tracts;
        this.datalayer = datalayer;
        L.Util.setOptions(this, options);
    },
    
    onAdd: function(map)
    {
        var buttons = this;
        var div = document.createElement('div');
        
        function add_button(label, data_point, colors)
        {
            var button = document.createElement('button');
            button.onclick = function() { buttons.showLayer(data_point, colors) };
            button.innerText = label;
        
            div.appendChild(button);
            div.appendChild(document.createTextNode(' '));
        }
        
        add_button('Hispanic', 'hispanic percentage', BLUES);
        add_button('White', 'white percentage', BLUES);
        add_button('Black', 'black percentage', BLUES);
        add_button('Asian', 'asian percentage', BLUES);
        add_button('Per Capita Income', 'B19301001', ORANGES);
        add_button('Renters', 'rental percentage', ORANGES);

        this.showLayer('hispanic percentage', BLUES);
        return div;
    },
    
    showLayer: function(layer_name, colors)
    {
        var geojson = {features: [], type: 'GeometryCollection'};
    
        for(var i = 0; i < this.tracts.length; i++)
        {
            var tract = stuff.tracts[i];
            var feature = tract.feature;
            feature.properties.data = tract.data;
            feature.properties.responses = tract.responses;
            geojson.features.push(feature);
        }
    
        var style_function = get_style_function(this.tracts, layer_name, colors);
    
        this.datalayer.clearLayers();
        this.datalayer.addData(geojson);
        this.datalayer.setStyle(style_function);
    }
    
});

function choropleth_style_null()
{
    var random = Math.floor(Math.random() * 4),
        colors = ['#666', '#777', '#888', '#999'];
    
    return {
        //"clickable": false,
        "stroke": false,
        "color": "black",
        "weight": .2,
        "opacity": 1,
        "fillColor": colors[random],
        "fillOpacity": 0.3
    };
}

/**
 * Build a map with GeoJSON data.
 *
 * Return reference to GeoJSON data layer.
 */
function build_map(element_id, geojson)
{
    var envelope, feature;
    
    for(var i = 0; i < geojson.features.length; i++)
    {
        feature = geojson.features[i];
        
        if(envelope == undefined) {
            envelope = turf.envelope(feature);

        } else {
            envelope = turf.envelope(turf.union(envelope, feature));
        }
    }
    
    var extent = turf.extent(turf.buffer(envelope, 2, 'kilometers')),
        xmin = extent[0], ymin = extent[1],
        xmax = extent[2], ymax = extent[3],
        center = new L.LatLng(ymax/2 + ymin/2, xmax/2 + xmin/2),
        northeast = new L.LatLng(ymax, xmax),
        southwest = new L.LatLng(ymin, xmin),
        maxBounds = new L.latLngBounds(northeast, southwest),
        options = {
            center: center, zoom: 12,
            maxBounds: maxBounds, minZoom: 9, maxZoom: 16,
            scrollWheelZoom: false, attributionControl: false
            };
    
    var map = new L.Map(element_id, options),
        tile_layer = new L.TileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}@2x.png');

    map.addLayer(tile_layer);
    
    var attr = L.control.attribution({prefix: '', position: 'bottomright'});
    attr.addAttribution('Demographic data via <a target="_blank" href="http://censusreporter.org">Census Reporter</a>');
    attr.addAttribution('<a target="_blank" href="http://maps.stamen.com">Cartography</a> by <a target="_blank" href="http://stamen.com">Stamen</a>');
    attr.addAttribution('Map Data <a target="_blank" href="http://www.openstreetmap.org/copyright">&copy; OSM contributors</a>');
    map.addControl(attr);
    
    function onEachFeature(feature, layer)
    {
        var templateData = {
          tractName: feature.properties.name,
          population: feature.properties['2013_population_estimate'],
          geoid: feature.properties.geoid,
          responsesHighLow: human_float(feature.properties.responses),
          responses: Math.ceil(feature.properties.responses),
        }
        if(feature.properties.data) {
          templateData.white = Math.ceil(feature.properties.data["white percentage"].estimate);
          templateData.black = Math.ceil(feature.properties.data["black percentage"].estimate);
          templateData.hispanic = Math.ceil(feature.properties.data["hispanic percentage"].estimate);
          templateData.asian = Math.ceil(feature.properties.data["asian percentage"].estimate);
          templateData.rentalPercentage = Math.ceil(feature.properties.data["rental percentage"].estimate);
          templateData.income = Math.ceil(feature.properties.data["B19301001"].estimate);
          html = document.getElementById("response-popup").innerHTML;
          popupContent = L.Util.template(html, templateData);
        }else {
          popupContent = L.Util.template(tooltipTemplate(), templateData);
        }
        layer.bindPopup(popupContent);
    }
    
    var datalayer = L.geoJson(geojson, {style: choropleth_style_null, onEachFeature: onEachFeature}).addTo(map);
    
    return {data: datalayer, map: map};
}
function tooltipTemplate() {

    return '<h3>{tractName}</h3><b>Population:</b> {population}<br/>Details: <a target="_blank" href="http://censusreporter.org/profiles/{geoid}">{geoid}</a>';
}
function detailTooltipTemplate() {
      return '<b>Responses:</b> {responses}<br/>'+
      '<b>White Population:</b> {white} %<br/>'+
      '<b>Black Population:</b> {black} %<br/>'+
      '<b>Hispanic Population:</b> {hispanic} %<br/>'+
      '<b>Asian Population:</b> {asian} %<br/>'+
      '<b>Rental percentage:</b> {rental} %<br/>'+
      '<b>Per capita income:</b> ${income}<br/>';
}

function human_float(number) {
  if(number % 1 < 0.5) {
    return 'less than';
  }
  return 'more than';
}
function update_status(message)
{
    document.getElementById('status').innerHTML = message;
}
