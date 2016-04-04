describe('surveyResults', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.server = sinon.fakeServer.create();
    this.subject = ResidentResearch.surveyResults();
    this.clock = sinon.useFakeTimers();
  });
  afterEach(function() {
    this.sandbox.restore();
    this.server.restore();
    this.clock.restore();
  });

  describe('#init', function() {
    beforeEach(function() {
      this.sandbox.stub(window, "update_status");
      this.sandbox.stub(window, "get_query_variable");
      this.sandbox.stub(window, "update_text");
      this.sandbox.stub(window, "create_list");
      this.load_city_tracts = function(q, cb) { cb('','', [])};
      window.load_city_tracts = this.load_city_tracts;
      this.load_tract_data  = function(t, cb) { cb([])};
      window.load_tract_data = this.load_tract_data;
      this.load_spreadsheet = function(q, s, cb, e) { cb([], '')};
      window.load_spreadsheet = this.load_spreadsheet;
      this.build_map = { init: function(e,d) {}, addControl: function(c) {}};
    });
    it('calls load_city_tracts', function() {
      mock = this.sandbox.mock(window);
      mock.expects("load_city_tracts").once();
      this.subject.init();
      mock.verify();
    });

    it('builds the maps', function() {
      mock = this.sandbox.mock(ResidentResearch);
      mock.expects("map").twice().returns(this.build_map);
      this.subject.init();
      mock.verify();
    });
    context("after building the map", function() {
      beforeEach(function() {
        this.sandbox.stub(ResidentResearch, "map").returns(this.build_map);
      });
      it('loads_tract_data', function() {
        mock = this.sandbox.mock(window);
        mock.expects("load_tract_data").once();
        this.subject.init();
        mock.verify();
      });
      it('load_spreadsheet', function() {
        mock = this.sandbox.mock(window);
        mock.expects("load_spreadsheet").once();
        this.subject.init();
        mock.verify();
      });
      it('correlate_geographies', function() {
        mock = this.sandbox.mock(window);
        mock.expects("correlate_geographies").once();
        this.subject.init();
        this.clock.tick(1);
        mock.verify();
      });
    })
  });
});
