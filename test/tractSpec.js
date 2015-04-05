describe("Tract", function(){
  beforeEach( function(){
    feature = { properties: { geoid: 1 } }
    tract = new Tract(0,feature);
  });
  describe("#getIntersectionPopulation", function(){
    it("returns population", function(){
      sinon.stub(turf,"area").returns(1);
      sinon.stub(tract,"getEstimate").returns(1000);
      expect(tract.getIntersectionPopulation({})).to.eq(1000);
    });
  });
  describe("getEstimate",function(){
    it("returns the estimate of data B01003001",function(){
      data = { estimate: 1000 };
      sinon.stub(tract, "getPopulation").returns(data);
      expect(tract.getEstimate()).to.eq(1000)
    });
  });
});
