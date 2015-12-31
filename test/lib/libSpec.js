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
  describe('#load_tract_data', function() {
    beforeEach(function() {
      this.original_tracts = [];
      output_tracts = [];
      this.getData = { getData: function(t) { t(output_tracts); }};
      this.censusReporter = this.sandbox.stub(ResidentResearch, "censusReporter").returns(this.getData);
    });
    afterEach(function() {
      output_tracts = [];
      this.original_tracts = [];
      this.getData = { getData: function(t) { t(output_tracts); }};
    });
    it('calls the callback', function() {
      cb = this.sandbox.spy();
      load_tract_data(this.original_tracts, cb);
      expect(cb).to.have.been.called;
    });
    context('original_tracts length > CR_API_PAGE', function() {
      beforeEach(function() {
        this.original_tracts = [{},{},{},{}];
        output_tracts = [{},{}];
        CR_API_PAGE = 2;
      });
      it('does not call the callback after one iteration', function() {
        cb = this.sandbox.spy();
        load_tract_data(this.original_tracts, cb);
        expect(cb).to.have.been.called;
      });
      context('getData', function() {
        it('calls getData twice', function() {
          getDataMock = this.sandbox.mock(ResidentResearch.censusReporter());
          getDataMock.expects("getData").twice();
          load_tract_data(this.original_tracts, this.sandbox.spy());
          getDataMock.verify();
        });
      });
    });
    context('wrong number of output tracts', function() {
      beforeEach(function() {
        output_tracts = [];
      })
      it('calls the callback', function() {
        cb = this.sandbox.spy();
        load_tract_data([{}], cb);
        expect(cb).to.not.have.been.called;
      });
    });
  });
});
