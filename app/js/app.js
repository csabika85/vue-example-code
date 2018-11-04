const livePollutionInfo = new Vue({
    el: '#current-forecast',
    data: {
      forecastBand: '',
      forecastSummary: '',
      forecastText: ''
    },
    methods: {
      loadData: function(ForecastType) {
        $.get("https://api.tfl.gov.uk/AirQuality?app_key=4674c196f81be9da138a48f062f22397&app_id=cdc0458b", function(data){
          $.each(data.currentForecast, function(key,value) {
            if (value.forecastType == "Current") {
              livePollutionInfo.forecastBand = value.forecastBand;
              livePollutionInfo.forecastSummary = value.forecastSummary;
              livePollutionInfo.forecastText = value.forecastText.replace(/&lt;br\s*\/&gt;/g,'<br />');
            }
          });

        })
      }
    },
});

const tubeStatus = new Vue({
    el: '#tube-status',
    data: {
      statuses: [],
      showDisruption: false,
      showIcon: false
    },
    methods: {
      loadData: function() {
        $.get("https://api.tfl.gov.uk/Line/Mode/overground%2C%20tube/Status?app_key=4674c196f81be9da138a48f062f22397&app_id=cdc0458b", function(data){
          $.each(data, function(key,value) {
              var name = value.name
              var lineId = value.id
              $.each(value.lineStatuses, function(key,value) {
                  if (value.reason) {
                      tubeStatus.showIcon = true
                      var addClass = "disrupted"
                  } else {
                      tubeStatus.showIcon = false
                      var addClass = ""
                  }
                  tubeStatus.statuses.push({id: lineId, line: name, status: value.statusSeverityDescription, reason: value.reason, severity: value.statusSeverity, showIcon: tubeStatus.showIcon, showDisruption: tubeStatus.showDisruption, addClass: addClass })
              })
          });
          tubeStatus.statuses.sort(function(a, b) {
              return parseFloat(a.severity) - parseFloat(b.severity);
          });
        })
    }
    },
});

const tfl = new Vue({
    el: '#tfl',
    data: {
      buses: [],
      searchResults: [],
      busStops: [],
      stationName: '',
      towards: '',
      showList: false,
      stopId: '',
      interval: '',
      activeClass: ''
    },
    methods: {
      loadData: function(id) {
        clearInterval(tfl.interval);
        $.get("https://api.tfl.gov.uk/StopPoint/"+ id +"/Arrivals?app_key=4674c196f81be9da138a48f062f22397&app_id=cdc0458b", function(data){
        tfl.buses = [];
          $.each(data, function(key,value) {
            tfl.stationName = value.stationName;
            tfl.towards = value.towards;
            tfl.activeClass = ''
            var timeLeft = Math.floor(value.timeToStation / 60)
            if (timeLeft == 0) { timeLeft = "Arriving"; tfl.activeClass = 'active' }
            if (timeLeft == 1) { timeLeft = "1 min" }
            if (timeLeft > 1) { timeLeft = timeLeft + " mins" }
            tfl.buses.push({bus: value.lineName, expectedArrival: Math.floor(value.timeToStation / 60), destination: value.destinationName, displayArrival: timeLeft})
          });
          tfl.buses.sort(function(a, b) {
              return parseFloat(a.expectedArrival) - parseFloat(b.expectedArrival);
          });
        })

        tfl.interval = setInterval(tfl.loadData, 10000, id);
      },
      isActive: function(id) {
          $.each( tfl.busStops, function( key, value ) {
              value.isActive = "";
              if (value.id == id) {
                value.isActive = "active";
              }
            });
      },
      loadSearchResult: function() {
        tfl.showList = false,
        query = event.target.value;
        tfl.showList = true
        if (query) {
            $.get("https://api.tfl.gov.uk/StopPoint/Search?query="+ query +"&modes=bus&maxResults=5" +"&maxResults=5&app_key=4674c196f81be9da138a48f062f22397&app_id=cdc0458b", function(data){
                tfl.searchResults = [];
              $.each(data.matches, function(key,value) {
                tfl.searchResults.push({name: value.name, id: value.id});
              });
            })
        } else {
            tfl.searchResults = [];
            tfl.showList = false
        }
      },
      filterSearch: function(id) {
        tfl.showList = false,
        tfl.busStops = []
        $.get("https://api.tfl.gov.uk/StopPoint/"+ id +"?app_key=4674c196f81be9da138a48f062f22397&app_id=cdc0458b", function(data){
              $.each(data.lineGroup, function(key,value) {
                if (value.naptanIdReference) {
                  tfl.StopId = value.naptanIdReference;
                  $.each(data.children, function(key,value) {
                      if (value.indicator) {
                          if (value.naptanId == tfl.StopId) {
                              tfl.busStops.push({name: value.indicator, id: tfl.StopId, isActive: ""});
                          }
                      } else {
                          $.each(value.children, function(key,value) {
                              if (value.indicator) {
                                  if (value.naptanId == tfl.StopId) {
                                      tfl.busStops.push({name: value.indicator, id: tfl.StopId, isActive: ""});
                                  }
                              } else {
                                  $.each(value.children, function(key,value) {
                                      if (value.naptanId == tfl.StopId) {
                                          tfl.busStops.push({name: value.indicator, id: tfl.StopId, isActive: ""});
                                      }
                                  })
                              }
                          })
                      }
                  })
                }
              })
            })
        }
    },
});

livePollutionInfo.loadData();
tubeStatus.loadData();
