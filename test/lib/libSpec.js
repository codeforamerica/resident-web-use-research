describe('lib', function(){
  beforeEach(function(){
    this.sandbox = sinon.sandbox.create();
    this.clock = sinon.useFakeTimers();
  });
  afterEach(function(){
    this.sandbox.restore();
    this.clock.restore();
  });
  describe('#initial values', function() {
    it('CR_API_BASE is censusreporter', function() {
      expect(window.CR_API_BASE).to.eq('http://api.censusreporter.org/1.0');
    });
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
        oncorrelate = this.sandbox.spy();
        correlate_geographies(responses, tracts, oncorrelate)
        this.clock.tick(25);
        expect(oncorrelate.calledWith(tracts)).to.eq(true);
      });
      it('appends responses to the tracts', function(){
        expect(tract.responses).to.eq(0)
        correlate_geographies(responses, tracts, oncorrelate)
      });
    });
  });
});
