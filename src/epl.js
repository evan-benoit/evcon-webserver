import { getLeagueSeasons } from './api'
import autocolors from 'chartjs-plugin-autocolors';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(autocolors);
Chart.register(zoomPlugin);

async function drawChart(leagueSeason) {
  let datasets = await getLeagueSeasons(leagueSeason); 

  //Calculate the max and min X and Y for the zoom feature
  let maxY =  Math.max(...datasets.map(ds =>
    Math.max(...ds.data.map(d => d.cumPoints))
  ));

  let minY =  Math.min(...datasets.map(ds =>
    Math.min(...ds.data.map(d => d.cumPoints))
  ));


  let maxX =  Math.max(...datasets.map(ds =>
    Math.max(...ds.data.map(d => d.timestamp))
  ));

  let minX =  Math.min(...datasets.map(ds =>
    Math.min(...ds.data.map(d => d.timestamp))
  ));


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
            x: {min: minX, max: maxX},
            y: {min: minY, max: maxY + 5}
          },
          zoom: {
            wheel: {
              enabled: true,
              speed: .03,
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
            if (a.raw.rank > b.raw.rank) {
              return 1;
            } else {
              return -1;
            }
          },
          callbacks: {
            //https://www.chartjs.org/docs/latest/configuration/tooltip.html#tooltip-item-context
            label: function(tooltipItem) {
                const fixture = tooltipItem.dataset.data[tooltipItem.dataIndex]
                if (fixture !== undefined) {
                  return fixture.teamName + ": " + fixture.cumPoints + " points (GD: " + fixture.cumDifferential + " Goals: " + fixture.cumGoals + ")";
                }
            },
            title: function(tooltipItems) {
              const chart = tooltipItems[0].chart;
              const points = chart.getElementsAtEventForMode(chart._lastEvent, 'nearest', { intersect: true }, true);
              const raw = points[0].element.$context.raw;
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

  teamSeasonChart = new Chart(document.getElementById('teamSeasons'),chartTemplate);
}

var teamSeasonChart

//Code to run on page load
$( document ).ready(function() {

  const ls = $("#leagueSeason").find(":selected").val();
  drawChart(ls);


  $("#showall").click(function() {
    teamSeasonChart.data.datasets.forEach(function(ds) {
     ds.hidden = false;
   });
   teamSeasonChart.update();
  });
  
  $("#hideall").click(function() {
    teamSeasonChart.data.datasets.forEach(function(ds) {
     ds.hidden = true;
   });
   teamSeasonChart.update();
  });
  
  $("#topfive").click(function() {
    teamSeasonChart.data.datasets.forEach(function(ds) {
      if (ds.label == 'Arsenal' || ds.label == 'Manchester City' || ds.label == 'Manchester United' || ds.label == 'Tottenham' || ds.label == 'Liverpool') {
        ds.hidden = false;
      } else {
        ds.hidden = true;
      }
   });
   teamSeasonChart.update();
  });
  
  $("#bottomfive").click(function() {
    teamSeasonChart.data.datasets.forEach(function(ds) {
      if (ds.label == 'West Ham' || ds.label == 'Leeds' || ds.label == 'Everton' || ds.label == 'Southampton' || ds.label == 'Bournemouth') {
        ds.hidden = false;
      } else {
        ds.hidden = true;
      }
   });
   teamSeasonChart.update();
  });

  $("#leagueSeason").change(async function() {
    const ls = $("#leagueSeason").find(":selected").val();

    teamSeasonChart.destroy();

    teamSeasonChart = await drawChart(ls);

    teamSeasonChart.options.parsing.xAxisKey = 'timestamp';
    teamSeasonChart.options.scales.x.type = 'time';
    teamSeasonChart.options.scales.x.title.text = 'Date';

    teamSeasonChart.update();
  });

  
  $("#toggle").click(async function() {
    const ls = $("#leagueSeason").find(":selected").val();

    if (teamSeasonChart.options.parsing.xAxisKey == 'matchNumber') {
      teamSeasonChart.destroy();
      teamSeasonChart = await drawChart(ls);
  
      teamSeasonChart.options.parsing.xAxisKey = 'timestamp';
      teamSeasonChart.options.scales.x.type = 'time';
      teamSeasonChart.options.scales.x.title.text = 'Date';

      teamSeasonChart.update();

    } else {
      teamSeasonChart.destroy();
      teamSeasonChart = await drawChart(ls);

      teamSeasonChart.options.parsing.xAxisKey = 'matchNumber';
      teamSeasonChart.options.scales.x.type = 'linear';
      teamSeasonChart.options.scales.x.title.text = 'Match Number';

      teamSeasonChart.update();
    }
  });

});



