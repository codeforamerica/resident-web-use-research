describe("Tract", function(){
  beforeEach( function(){
    this.sandbox = sinon.sandbox.create();
    this.feature = { properties: { geoid: 1 } }
    this.tract = new Tract(0,this.feature);
  });
  afterEach(function(){
    this.sandbox.restore();
  });
  describe("#getIntersectionPopulation", function(){
    it("returns population", function(){
      this.sandbox.stub(turf,"area").returns(1);
      this.sandbox.stub(this.tract,"getEstimate").returns(1000);
      expect(this.tract.getIntersectionPopulation({})).to.eq(1000);
    });
  });
  describe("getPopulation",function(){
    it("returns the data B01003001",function(){
      var data = { 'B01003001': 1000 };
      this.tract.data = data;
      expect(this.tract.getPopulation()).to.eq(1000);
    });
  });
  describe("getEstimate",function(){
    it("returns the estimate of data B01003001",function(){
      var data = { estimate: 1000 };
      this.sandbox.stub(this.tract, "getPopulation").returns(data);;
      expect(this.tract.getEstimate()).to.eq(1000);
    });
  });
  describe("#getIntersectionWithFeature", function(){
    it("returns turf intersection", function(){
      var intersection = {};
      this.sandbox.stub(turf, "intersect").returns(intersection);
      expect(this.tract.getIntersectionWithFeature(this.feature)).to.eq(intersection);
    });
  });
  describe("getFeatureIntersectionPopulation", function(){
    it("returns the population for the intersection of tract and feature", function(){
      var intersection = this.sandbox.stub();
      this.sandbox.stub(this.tract,"getIntersectionWithFeature").returns(intersection);
      this.sandbox.stub(this.tract,"getIntersectionPopulation").returns(1000);
      expect(this.tract.getFeatureIntersectionPopulation(this.feature)).to.eq(1000);
    });
    it("",function() {
      var intersection = this.sandbox.stub();
      mock = this.sandbox.mock(this.tract);
      this.sandbox.stub(this.tract,"getIntersectionWithFeature").returns(intersection);
      mock.expects("getIntersectionPopulation").withArgs(intersection).returns(1000);
      this.tract.getFeatureIntersectionPopulation(this.feature);
      mock.verify();
    });
    it("",function() {
      mock = this.sandbox.mock(this.tract);
      var intersection = this.sandbox.stub();
      mock.expects("getIntersectionWithFeature").withArgs(this.feature).returns(intersection);
      this.sandbox.stub(this.tract,"getIntersectionPopulation").returns(1000);
      this.tract.getFeatureIntersectionPopulation(this.feature);
      mock.verify();
    });
    context("no intersection", function() {
      it("returns false", function() {
        this.sandbox.stub(this.tract,"getIntersectionWithFeature").returns(undefined);
        expect(this.tract.getFeatureIntersectionPopulation(this.feature)).to.eq(false);
      });
    });
  });
});
