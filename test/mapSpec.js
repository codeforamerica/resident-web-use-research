describe('Map', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.map = new Map();
  });
  describe('#init', function() {
    beforeEach(function() {
      this.geojson = { features: [] };
      this.sandbox.stub(this.map, 'calculateExtent').returns([0,0,0,0]);
    });
    it('sets the element id', function() {
      this.sandbox.stub(this.map, 'initMap');
      this.map.init('test', this.geojson);
      expect(this.map.element_id).to.eq('test');
    });
    it('sets the geojson', function() {
      this.sandbox.stub(this.map, 'initMap');
      this.map.init('test', this.geojson);
      expect(this.map.geojson).to.eq(this.geojson);
    });
    it('initializes the map', function() {
      mock = this.sandbox.mock(this.map).expects("initMap").once();
      this.map.init('test', this.geojson);
      mock.verify();
    });
  });
  describe('#setStyle', function() {
    it('sets the style', function() {
      this.map.setStyle('style');
      expect(this.map.style).to.eq('style');
    });
  });
  describe('#reloadStyle', function() {
    beforeEach(function() {
      this.map.dataLayer = { setStyle: function() {} };
    });
    it('calls setStyle for the dataLayer with the set style', function() {
      mock = this.sandbox.mock(this.map.dataLayer).expects('setStyle').once();
      this.map.reloadStyle();
      mock.verify();
    });
    it('calls setStyle for the dataLayer with the set style', function() {
      mock = this.sandbox.mock(this.map.dataLayer).expects('setStyle').once().withArgs('style');
      this.map.setStyle('style');
      this.map.reloadStyle();
      mock.verify();
    });
  });
  describe('#setData', function() {
    it('updates the geojson', function() {
      this.sandbox.stub(this.map, 'updateDataLayer');
      geojson = { test: [] };
      this.map.setData(geojson);
      expect(this.map.geojson).to.eq(geojson);
    });
    it('calls update the dataLayer', function() {
      mock = this.sandbox.mock(this.map).expects('updateDataLayer').once();
      geojson = { test: [] };
      this.map.setData(geojson);
      mock.verify();
    });
  });
  describe('#updateDataLayer', function() {
    beforeEach(function() {
      this.map.dataLayer = { clearLayers: function() {}, addData: function(data) {} };
    });
    it('calls clearLayers', function() {
      mock = this.sandbox.mock(this.map.dataLayer).expects('clearLayers').once();
      this.map.updateDataLayer();
      mock.verify();
    });
    it('calls addData', function() {
      mock = this.sandbox.mock(this.map.dataLayer).expects('addData').once();
      this.map.updateDataLayer();
      mock.verify();
    });
  });
});
