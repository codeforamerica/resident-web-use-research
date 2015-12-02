describe('Map', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.map = ResidentResearch.map();
    this.geojson = { features: [] };
    this.el = document.createElement('div')
    this.sandbox.stub(turf, 'envelope');
    this.sandbox.stub(turf, 'union');
    this.sandbox.stub(turf, 'buffer');
    this.sandbox.stub(turf, 'extent').returns([0,0,0,0]);
  });
  afterEach(function() {
    this.sandbox.restore();
  });
  describe('#init', function() {
    it('creates a new leaflet map', function() {
      this.leaflet = this.sandbox.spy(L,"Map");
      this.map.init(this.el, this.geojson);
      expect(this.leaflet).to.have.been.calledOnce;
    });
    it('creates a geojson layer', function() {
      this.layer = this.sandbox.spy(L,"geoJson");
      this.map.init(this.el, this.geojson);
      expect(this.layer).to.have.been.calledOnce;
    });
    it('creates a two TileLayers', function() {
      this.layer = this.sandbox.spy(L,"TileLayer");
      this.map.init(this.el, this.geojson);
      expect(this.layer).to.have.been.calledTwice;
    });
  });
  describe('#setData', function() {
    it('calls updateDataLayer', function() {
      mock = this.sandbox.mock(this.map).expects("updateDataLayer");
      this.map.setData({});
      mock.verify();
    });
  });
});
