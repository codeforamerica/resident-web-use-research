ResidentResearch = window.ResidentResearch || { }

ResidentResearch.censusReporter = function(tracts) {
  tracts = tracts;
  resultData = [];

  var appendData = function(tract) {
    tract.data =_.reduce(getDataWithId(resultData, tract.geoid), mergeData, {});
    return tract;
  };

  var apiUrlForTableAndGeoids = function(table, geoids) {
    return CR_API_BASE+'/data/show/acs2013_5yr?table_ids='+table+'&geo_ids='+geoids.join(',');
  };

  var populationResult = function(d, sq_km) {
    var data = estimateError(d, 'B01003', 'B01003001');
    return {
      'B01003001': data,
      'population density': densityError(data, sq_km)
    };
  }

  var rentalResult = function(d, sq_km) {
    var ownerHousing = estimateError(d, 'B25003', 'B25003002'),
    housing = estimateError(d, 'B25003', 'B25003001'),
    total = housing.estimate - ownerHousing.estimate;
    return {
      'B25003002': ownerHousing,
      'B25003001': housing,
      'rental percentage': percentageError(housing, total)
    };
  }

  var householdIncomeResult = function(d, sq_km) {
    var median = estimateError(d, 'B19013', 'B19013001');
    return {
      'B19013001': median
    };
  }

  var percapitaIncomeResult = function(d, sq_km) {
    var income = estimateError(d, 'B19301', 'B19301001');
    return {
      'B19301001': income
    };
  }

  var racialResult = function(d, sq_km) {
    var hispanic = estimateError(d, 'B03002', 'B03002012'),
    white = estimateError(d, 'B03002', 'B03002003'),
    black = estimateError(d, 'B03002', 'B03002004'),
    asian = estimateError(d, 'B03002', 'B03002006'),
    total = estimate(d, 'B03002', 'B03002001');
    return {
      'B03002012': hispanic,
      'B03002003': white,
      'B03002004': black,
      'B03002006': asian,
      'hispanic density': densityError(hispanic, sq_km),
      'white density': densityError(white, sq_km),
      'black density': densityError(black, sq_km),
      'asian density': densityError(asian, sq_km),
      'hispanic percentage': percentageError(hispanic, total),
      'white percentage': percentageError(white, total),
      'black percentage': percentageError(black, total),
      'asian percentage': percentageError(asian, total)
    };
  }

  var getTableData = function(geoIds, tableId, promise, resultCallback) {
    jQuery.ajax(apiUrlForTableAndGeoids(tableId,geoIds)).done(function(response) {
      promise.resolve(censusResult(response.data, resultCallback));
    }).fail(function(data) {
      promise.reject(data);
    });
  };

  var censusResult = function(data, dataFunc) {
    var result = _.map(data, function(d, geoId) {
      var tract = _.findWhere(tracts, { geoid: geoId });
      var sq_km = tract.feature.properties.aland / 1000000;
      return { id: geoId,  data: dataFunc(d, sq_km)};
    });
    return result;
  };

  var estimateErrorValues = function(estimateValue, errorValue) {
    return { estimate: estimateValue, error: errorValue }
  }

  var estimateError = function(d, tableId, objectId) {
    return { estimate: estimate(d, tableId, objectId), error: error(d, tableId, objectId) }
  }

  var estimate = function(d, tableId, objectId) {
    return d[tableId].estimate[objectId];
  }

  var error = function(d, tableId, objectId) {
    return d[tableId].error[objectId];
  }

  var percentageError = function(d, total) {
    return estimateErrorValues(percentage(d.estimate,total), undefined );
  }

  var percentage = function(value, total) {
    return 100 * value / total;
  }

  var densityError = function(d, sq_km) {
    return estimateErrorValues(density(d.estimate,sq_km), density(d.error,sq_km));
  }

  var density = function(value, total) {
    return value/total;
  }

  var getDataWithId = function(list, geoId) {
      return _.where(list, {id: geoId })
  }

  var mergeData = function(obj, element) {
    return _.extend(obj, element.data)
  }

  return {
    getData: function(callback) {
      var deferred = $.Deferred();
      var d1 = jQuery.Deferred();
      var d2 = jQuery.Deferred();
      var d3 = jQuery.Deferred();
      var d4 = jQuery.Deferred();
      var d5 = jQuery.Deferred();
      var geoids = _.map(tracts, function(tract) { return tract.geoid });
      getTableData(geoids, 'B01003', d1, populationResult);
      getTableData(geoids, 'B03002', d2, racialResult);
      getTableData(geoids, 'B25003', d3, rentalResult);
      getTableData(geoids, 'B19013', d4, householdIncomeResult);
      getTableData(geoids, 'B19301', d5, percapitaIncomeResult);
      $.when( d1, d2, d3, d4, d5 ).done(function ( v1, v2, v3, v4, v5 ) {
        resultData = _.flatten([v1, v2, v3, v4, v5])
        tracts = _.map(tracts, appendData);
        if(callback) {
          callback(tracts);
        }
        deferred.resolve(tracts);
      });
      return deferred;
    }
  }
}




