describe('Map', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.map = ResidentResearch.map();
  });
  afterEach(function() {
    this.sandbox.restore();
  });
  describe('#init', function() {
    beforeEach(function() {
      this.el = document.createElement('div')
      this.geojson = { features: [] };
      this.sandbox.stub(turf, 'envelope');
      this.sandbox.stub(turf, 'union');
      this.sandbox.stub(turf, 'buffer');
      this.sandbox.stub(turf, 'extent').returns([0,0,0,0]);
    });
    it('creates a new leaflet map', function() {
      this.leaflet = this.sandbox.spy(L,"Map")
      this.map.init(this.el, this.geojson);
      expect(this.leaflet).calledOnce;
    });
    it('creates a geojson layer', function() {
      this.layer = this.sandbox.spy(L,"geoJson")
      this.map.init(this.el, this.geojson);
      expect(this.layer).calledOnce;
    });
    it('creates a two TileLayers', function() {
      this.layer = this.sandbox.spy(L,"TileLayer")
      this.map.init(this.el, this.geojson);
      expect(this.layer).calledTwice;
    });
  });
});
