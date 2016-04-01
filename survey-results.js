ResidentResearch = window.ResidentResearch || {};

ResidentResearch.surveyResults = function() {
  var spreadsheet_url= null,
  responses= null, tracts= null,
  city= {name: null, geoid: null},
  maps= {
    recommendation: {data: null, map: null},
    survey: {data: null, map: null}
  };

  var addRecommendationControls = function(map) {
    var buttons = new DemographicsControl(maps.recommendation.map, tracts);
    maps.recommendation.map.addControl(buttons);
  };

  var loaded_tract_data = function(t) {
    tracts = t;
    addRecommendationControls();
    function onerror(reason, ttop) {
        alert('Failed to load spreadsheet: ' + reason);
    }
    var message = ('Loaded data for ' + tracts.length + ' tracts in ' + city.name + '. Loading spreadsheet…');
    update_status(message);
    jQuery( "body" ).trigger( "surveyMessage", [message] );
    remove_overlay('recommendation-map', 'loading');

    load_spreadsheet(get_query_variable('gdoc'), 'Survey Results All', loaded_spreadsheet, onerror);
  };

  var update_response_access_info = function(response, access) {
    if(response.fields['Web on computer at home?']) {
        access['computer-at-home'] += 1;
    }

    if(response.fields['Web on cell phone?']) {
        access['cell-phone'] += 1;
    }

    if(response.fields['Web on computer at work?']) {
        access['computer-at-work'] += 1;
    }

    if(response.fields['Web on public computer?']) {
        access['public-computer'] += 1;
    }

    if(response.fields["Web on friend's computer?"]) {
        access['friend-computer'] += 1;
    }
    return access;
  };

  var update_response_language_info = function(response, languages) {
    var language = response.fields['Language spoken at home'];
    if(language && language.toLocaleLowerCase() in languages) {
        languages[language.toLocaleLowerCase()] += 1;
    }
    return languages;
  };

  var update_languages_text = function(languages) {
    for(var id in languages) {
        update_text(id, languages[id]);
    }
  }

  var update_access_text = function(access) {
    for(var id in access) {
        update_text(id, access[id]);
    }
  }

  var loaded_spreadsheet = function(all_responses, spreadsheet_url) {
    responses = all_responses;
    spreadsheet_url = spreadsheet_url;
    var geo_responses = [],
        languages = {
        "english": 0,
        "spanish": 0,
        "chinese": 0,
        "vietnamese": 0
        },
        access = {
        "computer-at-home": 0,
        "cell-phone": 0,
        "computer-at-work": 0,
        "public-computer": 0,
        "friend-computer": 0
        };

    for(var i = 0; i < all_responses.length; i++) {
        var response = all_responses[i];
        jQuery( "body" ).trigger( "surveyMessage", ['Reading reponse '+(i+1)+' of '+all_responses.length+'...'] );
        languages = update_response_language_info(response, languages);
        access = update_response_access_info(response, access);

        if(response.feature) {
            geo_responses.push(response);
        }
    }

    update_languages_text(languages);
    update_access_text(access);

    var message = ('Found ' + tracts.length + ' tracts in ' + city.name + ' and <a target="_blank" href="' + spreadsheet_url + '">a spreadsheet with ' + geo_responses.length + ' geographic responses</a>.');
    update_status(message);
    jQuery( "body" ).trigger( "surveyMessage", [message] );
    _.defer(correlate_geographies, geo_responses, tracts, correlated_spreadsheet);

  };

  var correlated_spreadsheet = function(t) {
    tracts = t;
    var regressions = [
        ['Hispanic population', calculate_regression(tracts, 'B03002012', false)],
        ['Black population', calculate_regression(tracts, 'B03002004', false)],
        ['White population', calculate_regression(tracts, 'B03002003', false)],
        ['Owner-occupied housing', calculate_regression(tracts, 'B25003002', false )],
        ['Median household income', calculate_regression(tracts, 'B19013001', false)]
        ];

    // Sort from most to least significant
    regressions.sort(function(a, b) { return Math.abs(b[1]) - Math.abs(a[1]) });

    var text_function = function(d) {
      return d[0] + ': ' + d[1].toFixed(3);
    }
    update_overlay('survey-map', 'loading', 'Calculating regressions...');
    create_list(regressions, 'regressions', text_function);

    update_status('Found ' + tracts.length + ' tracts in ' + city.name + ' and <a target="_blank" href="'+spreadsheet_url+'">a spreadsheet with ' + responses.length + ' responses</a>.');
    update_overlay('survey-map', 'loading', 'Updating the map...');
    render_survey_map();
  };

  var render_survey_map = function() {
    var geojson = create_geojson_features(tracts, 'GeometryCollection');

    var style_function = get_style_function(tracts, RESPONSES, GREENS);

    maps.survey.map.setData(geojson);
    maps.survey.map.setStyle(style_function);
    maps.survey.map.reloadStyle();
    maps.recommendation.map.setData(geojson);
    maps.recommendation.map.reloadStyle();

    remove_overlay('survey-map', 'loading');
  };

  var loaded_tracts = function(cityGeoid, cityName, tracts) {
    city.name = cityName;
    city.geoid = cityGeoid;
    var geojson = create_geojson_features(tracts, 'GeometryCollection');
    maps.survey.map = ResidentResearch.map();
    maps.survey.map.init('survey-map', geojson);
    maps.recommendation.map = ResidentResearch.map();
    maps.recommendation.map.init('recommendation-map', geojson);

    create_overlay('survey-map', 'loading', '<h1>Loading city tracts...</h1>');
    create_overlay('recommendation-map', 'loading', '<h1>Loading city tracts...</h1>');
    jQuery('body').on("surveyMessage", surveyProgressEventHandler);
    jQuery('body').on("recommendationMessage", recommendationProgressEventHandler);
    message = 'Found ' + tracts.length + ' tracts. Loading data…';
    update_status(message);
    jQuery( "body" ).trigger( "surveyMessage", [message] );
    jQuery( "body" ).trigger( "recommendationMessage", [message] );

    load_tract_data(tracts, loaded_tract_data);
  };

  var create_geojson_features = function(tracts, type) {
    var geojson = {features: [], type: type };
    for(var i = 0; i < tracts.length; i++) {
        geojson.features.push(tracts[i].feature);
    }
    return geojson;
  };

  return {
    init: function() {
      update_status('Loading city tracts…');
      load_city_tracts(get_query_variable('cityname'), loaded_tracts);
    }
  };
}
