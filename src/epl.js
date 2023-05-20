import { getLeagueSeasons } from './api'
import autocolors from 'chartjs-plugin-autocolors';
import zoomPlugin from 'chartjs-plugin-zoom';


Chart.register(autocolors);

Chart.register(zoomPlugin);

(async function() {
  
  leagueSeason = $("#leagueSeason").find(":selected").val();

  datasets = await getLeagueSeasons(leagueSeason); //premier league

  var chartTemplate = {
    type: 'line',
    data: {datasets: datasets },
    options: {
      // animation,
      parsing: {
        // xAxisKey: 'matchNumber',
        xAxisKey: 'timestamp',
        yAxisKey: 'cumPoints'
      },
      spanGaps: true,
      scales: {
        y: {
          title: {
            text: 'Points',
            display: true,
          }
        },
        x: {
          // type: "linear",
          type: "time",
          parsing: true,
          title: {
            text: 'Date',
            display: true,
          }
        }
      },
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          align: 'start'
        },
        zoom: {
          pan: {
              enabled: true
          },
          limits: {
            x: {min: 1653001726000, max: 1684537726000},
            y: {min: 0, max: 100}
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'xy',
          }
        },
        autocolors,
        tooltip: {
          mode: 'index',
          intersect: true,
          enabled: true,
          postition: 'nearest',
          itemSort: function(a, b) {
            if (a.raw.cumPoints < b.raw.cumPoints) {
              return 1;
            } else if (a.raw.cumPoints > b.raw.cumPoints) {
              return -1;
            } else {
              if (a.raw.cumDifferential < b.raw.cumDifferential) {
                return 1;
              } else if (a.raw.cumDifferential > b.raw.cumDifferential) {
                return -1;
              } else {
                if (a.raw.cumGoals < b.raw.cumGoals) {
                  return 1;
                } else if (a.raw.cumGoals > b.raw.cumGoals) {
                  return -1;
                } else {
                  return 0;
                }
              }
            }
          },
          callbacks: {
            //https://www.chartjs.org/docs/latest/configuration/tooltip.html#tooltip-item-context
            label: function(tooltipItem) {
                fixture = tooltipItem.dataset.data[tooltipItem.dataIndex]
                if (fixture !== undefined) {
                  return fixture.teamName + ": " + fixture.cumPoints + " points (GD: " + fixture.cumDifferential + " Goals: " + fixture.cumGoals + ")";
                }
            },
            title: function(tooltipItems) {
              chart = tooltipItems[0].chart;
              points = chart.getElementsAtEventForMode(chart._lastEvent, 'nearest', { intersect: true }, true);
              raw = points[0].element.$context.raw;
              if (raw.teamName == raw.homeTeam) {
                return raw.homeTeam.toUpperCase() + " " + raw.homeScore + " - " + raw.awayTeam + " " + raw.awayScore;
              } else {
                return raw.homeTeam + " " + raw.homeScore + " - " + raw.awayTeam.toUpperCase() + " " + raw.awayScore;
              }
            },
          }
        }
      }
    }
  };


  var teamSeasons = new Chart(document.getElementById('teamSeasons'),chartTemplate);
   


  $("#showall").click(function() {
    teamSeasons.data.datasets.forEach(function(ds) {
     ds.hidden = false;
   });
   teamSeasons.update();
  });
  
  $("#hideall").click(function() {
    teamSeasons.data.datasets.forEach(function(ds) {
     ds.hidden = true;
   });
   teamSeasons.update();
  });
  
  $("#topfive").click(function() {
    teamSeasons.data.datasets.forEach(function(ds) {
      if (ds.label == 'Arsenal' || ds.label == 'Manchester City' || ds.label == 'Manchester United' || ds.label == 'Tottenham' || ds.label == 'Liverpool') {
        ds.hidden = false;
      } else {
        ds.hidden = true;
      }
   });
   teamSeasons.update();
  });
  
  $("#bottomfive").click(function() {
    teamSeasons.data.datasets.forEach(function(ds) {
      if (ds.label == 'West Ham' || ds.label == 'Leeds' || ds.label == 'Everton' || ds.label == 'Southampton' || ds.label == 'Bournemouth') {
        ds.hidden = false;
      } else {
        ds.hidden = true;
      }
   });
   teamSeasons.update();
  });

  $("#leagueSeason").change(async function() {
    leagueSeason = $("#leagueSeason").find(":selected").val();
    datasets = await getLeagueSeasons(leagueSeason); //premier league  

    teamSeasons.destroy();

    chartTemplate.options.parsing.xAxisKey = 'timestamp';
    chartTemplate.options.scales.x.type = 'time';
    chartTemplate.options.scales.x.title.text = 'Date';
    chartTemplate.data.datasets = datasets;

    teamSeasons = new Chart(document.getElementById('teamSeasons'), chartTemplate);

    teamSeasons.update();
  });

  
  $("#toggle").click(function() {
    if (teamSeasons.options.parsing.xAxisKey == 'matchNumber') {
        teamSeasons.destroy();

        chartTemplate.options.parsing.xAxisKey = 'timestamp';
        chartTemplate.options.scales.x.type = 'time';
        chartTemplate.options.scales.x.title.text = 'Date';


        teamSeasons = new Chart(document.getElementById('teamSeasons'), chartTemplate);


    } else {
      teamSeasons.destroy();

      chartTemplate.options.parsing.xAxisKey = 'matchNumber';
      chartTemplate.options.scales.x.type = 'linear';
      chartTemplate.options.scales.x.title.text = 'Match Number';


      teamSeasons = new Chart(document.getElementById('teamSeasons'), chartTemplate);
    }

    teamSeasons.update();
  });

})();



