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
});