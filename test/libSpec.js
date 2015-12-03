describe('lib', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.server = sinon.fakeServer.create();
  });
  afterEach(function() {
     this.server.restore();
     this.sandbox.restore();
  });
  describe('#initial values', function() {
    it('CR_API_BASE is censusreporter', function() {
      expect(window.CR_API_BASE).to.eq('http://api.censusreporter.org/1.0');
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
