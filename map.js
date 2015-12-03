ResidentResearch = window.ResidentResearch || {};

ResidentResearch.map = function() {
  var elementId = "",
    popupOpened = false,
  geojson = {},
  style = {},
  dataLayer = {},
  map = {};

  var getTemplateData = function(properties) {
    var templateData = {
      tractName: properties.name,
      population: numberWithCommas(properties['2013_population_estimate']),
      geoid: properties.geoid,
      round: (properties.responses > 0 ? '~ ': ''),
      responsePlural: (Math.ceil(properties.responses) == 1 ? '': 's'),
      responses: Math.ceil(properties.responses)
    }
    if(properties.data) {
      templateData.white = Math.ceil(properties.data["white percentage"].estimate);
      templateData.black = Math.ceil(properties.data["black percentage"].estimate);
      templateData.hispanic = Math.ceil(properties.data["hispanic percentage"].estimate);
      templateData.asian = Math.ceil(properties.data["asian percentage"].estimate);
      templateData.rentalPercentage = Math.ceil(properties.data["rental percentage"].estimate);
      templateData.income = numberWithCommas(Math.ceil(properties.data["B19301001"].estimate));
    }
    return templateData;
  };
  var resetStyle = function(e) {
    if(!popupOpened) {
      dataLayer.setStyle(style);
    }
    popupOpened = false;
  }
  var highlightFeature= function(e) {
    popupOpened = true;
    dataLayer.setStyle(style);
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
    });
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
  }

  var optionsForGeojson = function() {
    var extent = calculateExtent(geojson.features),
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
    return options;
  };
  var setEventListener = function() {
    map.on('popupclose', resetStyle);
    map.on('popupopen', function() { popupOpened = false; });
  };

  var layerOrderingHack = function(layer) {
    var topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);
    topPane.appendChild(layer.getContainer());
    layer.setZIndex(9);
  };

  var initMap = function() {
    var layerOptions = { detectRetina: true },
    tileLayerBg = new L.TileLayer(stamenLayer('toner-background', L.Browser.retina)),
    tileLayerLabels = new L.TileLayer(stamenLayer('toner-labels', L.Browser.retina));
    map = new L.Map(elementId, optionsForGeojson());
    map.addLayer(tileLayerBg);
    map.addLayer(tileLayerLabels);

    map.addControl(attributions());
    dataLayer = L.geoJson(geojson, {style: choropleth_style_null, onEachFeature: onEachFeature}).addTo(map);
    setEventListener();
    layerOrderingHack(tileLayerLabels);
    return this;
  };
  var attributions = function() {
    var attr = L.control.attribution({prefix: '', position: 'bottomright'});
    attr.addAttribution('Demographic data via <a target="_blank" href="http://censusreporter.org">Census Reporter</a>');
    attr.addAttribution('<a target="_blank" href="http://maps.stamen.com">Cartography</a> by <a target="_blank" href="http://stamen.com">Stamen</a>');
    attr.addAttribution('Map Data <a target="_blank" href="http://www.openstreetmap.org/copyright">&copy; OSM contributors</a>');
    return attr;
  };
  var calculateExtent = function(features) {
    var envelope, feature,
        featureLength = features.length;
    for(var i = 0; i < featureLength; i++)
    {
        feature = features[i];

        if(envelope == undefined) {
            envelope = turf.envelope(feature);

        } else {
            envelope = turf.envelope(turf.union(envelope, feature));
        }
    }

    return turf.extent(turf.buffer(envelope, 6, 'kilometers'));
  };
  onEachFeature = function(feature, layer) {
    layer.on({
      click: highlightFeature
    });
    var templateData = getTemplateData(feature.properties);
    if(feature.properties.data) {
      html = document.getElementById("response-popup").innerHTML;
      popupContent = L.Util.template(html, templateData);
    }else {
      popupContent = L.Util.template(tooltipTemplate(), templateData);
    }
    layer.bindPopup(popupContent);
  };

  return {
    init: function(element, gjson) {
      elementId = element;
      geojson = gjson;
      initMap();
    },
    updateDataLayer: function() {
      dataLayer.clearLayers();
      dataLayer.addData(geojson);
    },
    setData: function(data) {
      geojson = data;
      this.updateDataLayer();
    },
    setStyle: function(newStyle) {
      style = newStyle;
    },
    reloadStyle: function() {
      dataLayer.setStyle(style);
    },
    addControl: function(control) {
      map.addControl(control);
    },
  };
}
