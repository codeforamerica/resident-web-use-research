function Map() {
  this.element_id = "";
  this.geojson = {};
  this.style = {};
  this.dataLayer = {};
  this.map = {};

  this.init = function(element_id, geojson) {
    this.element_id = element_id;
    this.geojson = geojson;
    var envelope, feature, popupOpened;
    for(var i = 0; i < geojson.features.length; i++)
    {
        feature = geojson.features[i];

        if(envelope == undefined) {
            envelope = turf.envelope(feature);

        } else {
            envelope = turf.envelope(turf.union(envelope, feature));
        }
    }

    var extent = turf.extent(turf.buffer(envelope, 6, 'kilometers')),
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
    this.map = new L.Map(element_id, options),
        layerOptions = { detectRetina: true },
        tileLayerBg = new L.TileLayer('http://{s}.tile.stamen.com/toner-background/{z}/{x}/{y}.png',layerOptions),
        tileLayerLabels = new L.TileLayer('http://{s}.tile.stamen.com/toner-labels/{z}/{x}/{y}.png',layerOptions);
    this.map.addLayer(tileLayerBg);
    this.map.addLayer(tileLayerLabels);

    var attr = L.control.attribution({prefix: '', position: 'bottomright'});
    attr.addAttribution('Demographic data via <a target="_blank" href="http://censusreporter.org">Census Reporter</a>');
    attr.addAttribution('<a target="_blank" href="http://maps.stamen.com">Cartography</a> by <a target="_blank" href="http://stamen.com">Stamen</a>');
    attr.addAttribution('Map Data <a target="_blank" href="http://www.openstreetmap.org/copyright">&copy; OSM contributors</a>');
    this.map.addControl(attr);
    var that = this;
    resetStyle = function(e) {
      if(!that.popupOpened) {
        that.dataLayer.setStyle(that.style);
      }
      that.popupOpened = false;
    }
    highlightFeature= function(e) {
      that.popupOpened = true;
      that.dataLayer.setStyle(that.style);
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
    this.map.on('popupclose', resetStyle);
    this.map.on('popupopen', function() { that.popupOpened = false; });
    this.dataLayer = L.geoJson(this.geojson, {style: choropleth_style_null, onEachFeature: this.onEachFeature, click: highlightFeature}).addTo(this.map);
    var topPane = this.map._createPane('leaflet-top-pane', this.map.getPanes().mapPane);
    topPane.appendChild(tileLayerLabels.getContainer());
    tileLayerLabels.setZIndex(9);
    return this;
  };
  this.onEachFeature = function(feature, layer) {
    layer.on({
      click: this.click
    });
    var templateData = {
      tractName: feature.properties.name,
      population: numberWithCommas(feature.properties['2013_population_estimate']),
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
      templateData.income = numberWithCommas(Math.ceil(feature.properties.data["B19301001"].estimate));

      html = document.getElementById("response-popup").innerHTML;
      popupContent = L.Util.template(html, templateData);
    }else {
      popupContent = L.Util.template(tooltipTemplate(), templateData);
    }
    layer.bindPopup(popupContent);
  };
  this.setData = function(data) {
    this.dataLayer.clearLayers();
    this.geojson = data;
    this.dataLayer.addData(data);
  };
  this.setStyle = function(style) {
    this.style = style;
  };
  this.reloadStyle = function() {
    this.dataLayer.setStyle(this.style);
  };
}
