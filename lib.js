var RESPONSES = 'Survey responses',
    GREENS = 'Greens_05', BLUES = 'Blues_05', ORANGES = 'YlOrBr_05',
    GEO_COLUMN = 'Geographic Area',
    CR_API_BASE = 'http://api.censusreporter.org/1.0',
    CR_API_PAGE = 60;

ResidentResearch = window.ResidentResearch || {};

ResidentResearch.correlation = function() {

  with_no_population = function(object_to_filter) {
      return object_to_filter.population !== false;
  }
  exclude_not_intersecting_tracts = function(intersecting_populations) {
    return _.filter(intersecting_populations, with_no_population);
  }
  population_for_response_in_tract = function(tract,response) {
    return { population: tract.getFeatureIntersectionPopulation(response.feature), geoid: tract.geoid };
  }
  intersection_population = function(tracts, response) {
    return exclude_not_intersecting_tracts(_.map(tracts, function(tract){
      return population_for_response_in_tract(tract, response);
    }));
  }
  total_intersection_population = function(intersection_population) {
    return _.reduce(intersection_population, function(total, intersection_population){
      return total + intersection_population.population;
    },0);
  }
  intersection_population_for_geoid = function(intersecting_populations, geoid) {
    return _.where(intersecting_populations, {geoid: geoid })
  }
  calculate_response_ratio = function(intersection_populations, population_estimate, current_ratio) {
    return _.reduce(intersection_populations, function(total, intersection_population){
      return total + (intersection_population.population / population_estimate);
    },current_ratio);
  }
  sum_response_ratios = function(tract, intersection_populations,population_estimate) {
    tract.responses = calculate_response_ratio(intersection_population_for_geoid(intersection_populations,tract.geoid), population_estimate, tract.responses);
    console.log('Tract', tract.geoid, '-- est.', tract.responses.toFixed(3), 'responses');
    return tract;
  }
  return {
    accumulate_tracts: function (tracts, response) {
      intersection_pops = intersection_population(tracts, response);
      population_estimate = total_intersection_population(intersection_pops);
      _.map(tracts, function(tract) {
        sum_response_ratios(tract, intersection_pops,population_estimate);
      });
      console.log('Response', response.feature.properties.ZCTA5CE10, '-- est.', population_estimate.toFixed(0), 'people');
    }
  }
}
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
    this.getFeatureIntersectionPopulation = function(feature) {
      return this.getIntersectionPopulation(this.getIntersectionWithFeature(feature));
    };
    this.getIntersectionWithFeature = function(feature) {
      return turf.intersect(this.feature, feature);
    };
    this.getIntersectionPopulation = function(intersection) {
      return(intersection ? this._intersectionShare(intersection) * this.getEstimate() : false);
    };
    this.getEstimate = function() {
      return this.getPopulation().estimate;
    };
    this.getPopulation = function() {
      return this.data['B01003001'];
    };
    this._intersectionShare = function(intersection) {
      return(turf.area(intersection) / turf.area(this.feature));
    };
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
                    
                    jQuery( "body" ).trigger( "surveyMessage", ['Reading reponse'+(i+1)+' of '+data.length+'...'] );
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

        var request_tracts = [];

        while(request_tracts.length < CR_API_PAGE && source_tracts.length)
        {
            request_tracts.push(source_tracts.shift());
        }
        censusReporter = ResidentResearch.censusReporter(request_tracts);
        censusReporter.getData(function(tracts)
        {
            output_tracts = output_tracts.concat(tracts);
            console.log(source_tracts.length, request_tracts.length, output_tracts.length);
            if(output_tracts.length == original_tracts.length)
            {
                return onloaded_all_data(output_tracts);
            }
        });

      if(source_tracts.length > 0)
      {
        load_more_data();
      }
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

    function work(item) {
      correlate = ResidentResearch.correlation();
      correlate.accumulate_tracts(tracts, item);
    }
    function finish(responses) {
      oncorrelated(tracts);
    }
    function chunkFinished(items) {
      jQuery( "body" ).trigger( "surveyMessage", ['Calculating tract '+(responses.length - items.length + 1)+' of '+responses.length+'...'] );
    }
    timedChunk(responses, work, this, finish, chunkFinished);
}
//Copyright 2009 Nicholas C. Zakas. All rights reserved.
//MIT Licensed
function timedChunk(items, process, context, callback, chunkCallback){
    var todo = items.concat();   //create a clone of the original

    setTimeout(function(){

        var start = +new Date();

        do {
             process.call(context, todo.shift());
        } while (todo.length > 0 && (+new Date() - start < 50));

        if (todo.length > 0){
            chunkCallback(todo);
            setTimeout(arguments.callee, 25);
        } else {
            callback(items);
        }
    }, 25);
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
    
    initialize: function(map, tracts, options)
    {
        this.tracts = tracts;
        this.map = map;
        L.Util.setOptions(this, options);
    },
    
    onAdd: function(map)
    {
        var buttons = this;
        var div = document.createElement('div');
        
        function add_button(label, data_point, colors)
        {
            var button = document.createElement('button');
            button.onclick = function() {
		$(this).parent().find('button').removeClass('active');
		$(this).addClass('active');
		buttons.showLayer(data_point, colors);
	    };
            button.innerText = label;
	    button.className = 'button ' + buttonClassNameForColor(colors);
        
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
        $(div).find('button:first').addClass('active');
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
    
        this.map.setData(geojson);
        this.map.setStyle(style_function);
        this.map.reloadStyle();
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
function create_overlay(mapId, className, initialContent) {
  jQuery('#'+mapId).append('<div class="'+className+'"><div class="text"></div><div class="spinner"> <div class="bounce1"></div> <div class="bounce2"></div> <div class="bounce3"></div> </div></div>');
  update_overlay(mapId, className, initialContent);
}
function update_overlay(mapId, className, content) {
  var $el = jQuery('#'+mapId).find('div.'+className+' .text');
  $el.html(content);
}
function remove_overlay(mapId, className) {
  jQuery('#'+mapId).find('div.'+className).remove();
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
/**
 * Build TileLayer String for Stamen layers
 *
 * return string with stamenType and @2x if retina is true
*/
function stamenLayer(stamenType, retina) {
  return 'http://{s}.tile.stamen.com/'+stamenType+'/{z}/{x}/{y}'+(retina ? '@2x': '')+'.png';
}

function human_float(number) {
  if(number === 0) {
    return '';
  }
  if(number % 1 < 0.5) {
    return 'less than';
  }
  return 'more than';
}

function update_text(id, text) {
  document.getElementById(id).innerText = text;
};

function create_list(list, elementId, text_function) {
    for(var i = 0; i < list.length; i++)
    {
        var li = document.createElement('li');
        li.innerText = text_function(list[i]);
        document.getElementById(elementId).appendChild(li);
    }
}

function update_status(message)
{
    document.getElementById('status').innerHTML = message;
}
var roundNumber = function(value, decimals) {
    var precision = (!!decimals) ? decimals : 0,
        factor = Math.pow(10, precision),
        value = Math.round(value * factor) / factor;

    return value;
}
var numberWithCommas = function(n) {
    var parts = roundNumber(n).toString().split(".");

    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
}
function buttonClassNameForColor(colorString) {
    return "button-"+colorString.toLowerCase().split("_")[0];
}
function surveyProgressEventHandler(e, message) {
  var $el = jQuery('#survey-map').find('div.loading .text');
  $el.html(message);
}
function recommendationProgressEventHandler(e, message) {
  var $el = jQuery('#recommendation-map').find('div.loading .text');
  $el.html(message);
}
