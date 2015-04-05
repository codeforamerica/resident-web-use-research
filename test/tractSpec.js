describe("Tract", function(){
  beforeEach( function(){
    sandbox = sinon.sandbox.create();
    feature = { properties: { geoid: 1 } }
    tract = new Tract(0,feature);
  });
  afterEach(function(){
    sandbox.restore();
  });
  describe("#getIntersectionPopulation", function(){
    it("returns population", function(){
      sandbox.stub(turf,"area").returns(1);
      sandbox.stub(tract,"getEstimate").returns(1000);
      expect(tract.getIntersectionPopulation({})).to.eq(1000);
    });
  });
  describe("getEstimate",function(){
    it("returns the estimate of data B01003001",function(){
      data = { estimate: 1000 };
      sandbox.stub(tract, "getPopulation").returns(data);
      expect(tract.getEstimate()).to.eq(1000)
    });
  });
  describe("#getIntersectionWithFeature", function(){
    it("returns turf intersection", function(){
      intersection = {}
      sandbox.stub(turf, "intersect").returns(intersection)
      expect(tract.getIntersectionWithFeature(feature)).to.eq(intersection);
    });
  });
  describe("getFeatureIntersectionPopulation", function(){
    it("returns the population for the intersection of tract and feature", function(){
      intersection = sandbox.stub();
      mock = sandbox.mock(tract);
      mock.expects("getIntersectionWithFeature").withArgs(feature).returns(intersection);
      mock.expects("getIntersectionPopulation").withArgs(intersection).returns(1000)
      expect(tract.getFeatureIntersectionPopulation(feature)).to.eq(1000)
    });
  });
});
