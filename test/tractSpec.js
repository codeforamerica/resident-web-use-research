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
});
