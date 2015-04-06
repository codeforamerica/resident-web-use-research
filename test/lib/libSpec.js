describe('lib', function(){
  beforeEach(function(){
    sandbox = sinon.sandbox.create();
  });
  afterEach(function(){
    sandbox.restore();
  });
  context('real world fixtures', function(){
    beforeEach(function(){
      fixture.setBase('test/mocks')
      response = fixture.load('response.json');
      responses = [response];
      tractJson = fixture.load('tract.json');
      tract = new Tract(tractJson.geoid, tractJson.feature);
      tracts = [tract];
    });
    describe('#correlate_geographies', function(){
      it('calls the callback with tracts', function(){
        oncorrelate = sandbox.spy();
        correlate_geographies(responses, tracts, oncorrelate)
        expect(oncorrelate.calledWith(tracts)).to.eq(true);
      });
      it('appends responses to the tracts', function(){
        expect(tract.responses).to.eq(0)
        correlate_geographies(responses, tracts, oncorrelate)
      });
    });
  });
  describe('#intersection_population', function(){
    beforeEach(function(){
      feature = { properties: { geoid: 1 } }
      tract = new Tract(0,feature);
      tracts = [tract];
      response = { feature: "" }
      sandbox.stub(tract, "getFeatureIntersectionPopulation").returns(1);
    });
    it('returns array of length of tracts with intersecting response', function(){
      expect(intersection_population(tracts, response).length).to.eq(1)
    });
    it('returned objects have keys population and geoid', function(){
      intersection_pops = intersection_population(tracts, response);
      expect(intersection_pops[0]).to.contain.all.keys(['population', 'geoid']);
    });
  });
  describe('#exclude_not_intersecting_populations',function() {
    it('returns only intersecting population tracts', function(){
      intersecting_population = { population: false };
      intersecting_populations = [intersecting_population];
      expect(exclude_not_intersecting_tracts(intersecting_populations).length).to.eq(0);
    });
  });
})
