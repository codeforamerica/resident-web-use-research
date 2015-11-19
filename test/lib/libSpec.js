describe('lib', function(){
  beforeEach(function(){
    sandbox = sinon.sandbox.create();
    this.clock = sinon.useFakeTimers();
  });
  afterEach(function(){
    sandbox.restore();
    this.clock.restore();
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
        this.clock.tick(25);
        expect(oncorrelate.calledWith(tracts)).to.eq(true);
      });
      it('appends responses to the tracts', function(){
        expect(tract.responses).to.eq(0)
        correlate_geographies(responses, tracts, oncorrelate)
      });
      it('calls accumulate_tracts once', function() {
        atSpy = sandbox.spy(window, "accumulate_tracts");
        correlate_geographies(responses, tracts, oncorrelate)
        this.clock.tick(25);
        expect(atSpy.callCount).to.eq(1);
      });
    });
    describe('#accumulate_tracts', function(){
    });
  });
  describe('#sum_response_ratios', function() {
    before(function(){
      feature = { properties: { geoid: 1 } }
      tract = new Tract(1,feature);
      intersecting_population = { population: 1, geoid: 1 };
      intersecting_population_2 = { population: 1 , geoid: 1};
      intersection_populations = [intersecting_population, intersecting_population_2];
      population_estimate = 100
    });
    it('sums the response for the tract', function() {
      tract = sum_response_ratios(tract,intersection_populations,population_estimate)
      expect(tract.responses).to.eq(0.02)
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
  describe('#total_intersection_population', function(){
    before(function() {
      intersecting_population = { population: 1 };
      intersecting_population_2 = { population: 1 };
      intersecting_populations = [intersecting_population, intersecting_population_2];
    });
    it('returns the total of the populations', function() {
      expect(total_intersection_population(intersecting_populations)).to.eq(2);
    });
  });
  describe('#intersection_population_for_geoid', function() {
    before(function() {
      intersecting_population = { population: 1 , geoid: 1 };
      intersecting_population_2 = { population: 1, geoid: 2 };
      intersecting_populations = [intersecting_population, intersecting_population_2];
    });
    it('returns the intersection_population for the specified geoid', function() {
      expect(intersection_population_for_geoid(intersecting_populations,1)).to.eql([intersecting_population]);
    });
    it('returns not the wrong intersecting_populations', function() {
      expect(intersection_population_for_geoid(intersecting_populations,1)).to.not.eql([intersecting_population_2]);
    });
  });
  describe('#calculate_response_ratio',function() {
    before(function() {
      intersecting_population = { population: 1 , geoid: 1 };
      intersecting_population_2 = { population: 1, geoid: 1 };
      intersecting_populations = [intersecting_population, intersecting_population_2];
      population_estimate = 100;
      current_ratio = 0;
    });
    it('returns the ratio of responses per tract', function() {
      expect(calculate_response_ratio(intersecting_populations,population_estimate,current_ratio)).to.eq(0.02)
    });
    it('returns the ratio of responses per tract', function() {
      current_ratio = 0.02;
      expect(calculate_response_ratio(intersecting_populations,population_estimate,current_ratio)).to.eq(0.04)
    });
  });
})
