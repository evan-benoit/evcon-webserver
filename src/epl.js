import { getLeagueSeasons } from './api'
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

async function drawChart(leagueSeason, chartMode) {
  let data = await getLeagueSeasons(leagueSeason); 
  let datasets = data.datasets;
  lastFullMatchNumber = data.lastFullMatchNumber;
  maxCumPoints = data.maxCumPoints;
  numberOfTeams = data.numberOfTeams;


  const zoomOptions = {
    limits: {
      x: {min: 0, max: 0},
      y: {min: 0, max: 0}
    },
    pan: {
      enabled: true,
      modifierKey: 'ctrl',
    },
    zoom: {
      drag: {
        enabled: true
      },
      mode: 'xy',
    },
  };


  var chartTemplate = {
    type: 'line',
    data: {datasets: datasets },
    options: {
      elements: {
        point: {
          pointRadius: 4
        }
      },
      onClick(e) {
        console.log(e.type);
      },
      pointHoverRadius: 5,
      //https://stackoverflow.com/questions/68353537/is-there-a-way-to-highlight-a-line-on-a-line-graph-with-hover
      onHover: (e, activeEls, chart) => {
        
        //get the element that we're hovering over
        const hoveredEl = chart.getElementsAtEventForMode(e, 'point', {
          intersect: true
        }, true)[0];

        //Loop through all datasets.  If that dataset is translucent, remove the translucency.
        chart.data.datasets.forEach((dataset) => {
          dataset.backgroundColor = dataset.backgroundColor.length === 9 ? dataset.backgroundColor.slice(0, -2) : dataset.backgroundColor;
          dataset.borderColor = dataset.borderColor.length === 9 ? dataset.borderColor.slice(0, -2) : dataset.borderColor;
        });

        //If we're hovering over something
        if (hoveredEl != null) {
          //loop through all datasets, and if they're not the one we're hovering over, add translucency via the alpha channel
          chart.data.datasets.forEach((dataset, i) => {
            dataset.backgroundColor = (hoveredEl.datasetIndex === i || dataset.backgroundColor.length === 9) ? dataset.backgroundColor : dataset.backgroundColor + '2D';
            dataset.borderColor = (hoveredEl.datasetIndex === i || dataset.borderColor.length === 9) ? dataset.borderColor : dataset.borderColor + '2D';
          });
        }
        chart.update();
      },      
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
        zoom: zoomOptions,
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
                  if (fixture.matchNumber == "0") { //no tooltip for origin point
                    return null;
                  } else {
                    return fixture.teamName + ": " + fixture.cumPoints + " points (GD: " + fixture.cumDifferential + " Goals: " + fixture.cumGoals + ")";
                  }
                }
            },
            title: function(tooltipItems) {
              const chart = tooltipItems[0].chart;
              const points = chart.getElementsAtEventForMode(chart._lastEvent, 'nearest', { intersect: true }, true);
              const raw = points[0].element.$context.raw;

              if (raw.matchNumber == "0") {
                return null;
              }

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


  if (chartMode == "byDate") {
    chartTemplate.options.parsing.xAxisKey = 'timestamp';
    chartTemplate.options.scales.x.type = 'time';
    chartTemplate.options.scales.x.title.text = 'Date';

    chartTemplate.options.parsing.yAxisKey = 'cumPoints';
    chartTemplate.options.scales.y.title.text = 'Points';
    chartTemplate.options.scales.y.reverse = false;
    chartTemplate.options.scales.y.min = 0;
    chartTemplate.options.scales.y.max = maxCumPoints + 1;
    
    chartTemplate.data.datasets.forEach((dataset) => {
      dataset.stepped = true;
    });

    //Calculate the max and min X and Y for the zoom feature
    chartTemplate.options.plugins.zoom.limits.y.min =  0;

    chartTemplate.options.plugins.zoom.limits.y.max =  maxCumPoints + 1

    chartTemplate.options.plugins.zoom.limits.x.min =  Math.min(...datasets.map(ds =>
      Math.min(...ds.data.map(d => d.timestamp))
    ));

    chartTemplate.options.plugins.zoom.limits.x.max =  Math.max(...datasets.map(ds =>
      Math.max(...ds.data.map(d => d.timestamp))
    ));
    
  } else if (chartMode == "byMatch") {
    chartTemplate.options.parsing.xAxisKey = 'matchNumber';
    chartTemplate.options.scales.x.type = 'linear';
    chartTemplate.options.scales.x.title.text = 'Match Number';

    chartTemplate.options.parsing.yAxisKey = 'cumPoints';
    chartTemplate.options.scales.y.title.text = 'Points';
    chartTemplate.options.scales.y.reverse = false;
    chartTemplate.options.scales.y.min = 0;
    chartTemplate.options.scales.y.max = maxCumPoints + 1;

    chartTemplate.data.datasets.forEach((dataset) => {
      dataset.stepped = false;
    });

    //Calculate the max and min X and Y for the zoom feature
    chartTemplate.options.plugins.zoom.limits.y.min =  0;

    chartTemplate.options.plugins.zoom.limits.y.max =  maxCumPoints + 1;

    chartTemplate.options.plugins.zoom.limits.x.min =  Math.min(...datasets.map(ds =>
      Math.min(...ds.data.map(d => d.matchNumber))
    ));

    chartTemplate.options.plugins.zoom.limits.x.max =  Math.max(...datasets.map(ds =>
      Math.max(...ds.data.map(d => d.matchNumber))
    )) + 2;


  } else if (chartMode == "bumpChart") {
    chartTemplate.options.parsing.xAxisKey = 'matchNumber';
    chartTemplate.options.scales.x.type = 'linear';
    chartTemplate.options.scales.x.title.text = 'Match Number';

    chartTemplate.options.parsing.yAxisKey = 'rank';
    chartTemplate.options.scales.y.title.text = 'Rank';
    chartTemplate.options.scales.y.reverse = true;
    chartTemplate.options.scales.y.min = 0;
    chartTemplate.options.scales.y.max = numberOfTeams+1;

    chartTemplate.data.datasets.forEach((dataset) => {
      dataset.stepped = false;
    });

    //Calculate the max and min X and Y for the zoom feature
    chartTemplate.options.plugins.zoom.limits.y.min =  0;
    
    chartTemplate.options.plugins.zoom.limits.y.max =  numberOfTeams + 1;

    chartTemplate.options.plugins.zoom.limits.x.min =  Math.min(...datasets.map(ds =>
      Math.min(...ds.data.map(d => d.matchNumber))
    ));
    
    chartTemplate.options.plugins.zoom.limits.x.max =  Math.max(...datasets.map(ds =>
      Math.max(...ds.data.map(d => d.matchNumber))
    )) + 2;

  }

  teamSeasonChart = new Chart(document.getElementById('teamSeasons'),chartTemplate);

}


async function redrawChart() {
  const ls = $("#leagueSeason").find(":selected").val();
  const cm = $("#chartMode").find(":selected").val();

  window.history.replaceState(null, null, "?leagueSeason=" + ls + "&chartMode=" + cm);

  teamSeasonChart.destroy();

  await drawChart(ls, cm);

  teamSeasonChart.update();
}

var teamSeasonChart;
var lastFullMatchNumber;
var maxCumPoints;
var numberOfTeams;

//Code to run on page load
$( document ).ready(function() {

  //redirect to https if we're on http and pointed to trophyplace.com
  if (location.protocol !== 'https:' && location.href.match('trophyplace') ) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  } 

  const urlParams = new URLSearchParams(window.location.search);
  
  const param_ls = urlParams.get('leagueSeason');
  if (param_ls != null) {
    $('#leagueSeason').val(param_ls);   //  assign URL param to select field
  }

  const param_cm = urlParams.get('chartMode');
  if (param_cm != null) {
    $('#chartMode').val(param_cm);   //  assign URL param to select field
  }
  
  const ls = $("#leagueSeason").find(":selected").val();
  const cm = $("#chartMode").find(":selected").val();
  drawChart(ls, cm);


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
      if (ds.data[lastFullMatchNumber].rank <=5 ) {
        ds.hidden = false;
      } else {
        ds.hidden = true;
      }
   });
   teamSeasonChart.update();
  });
  
  $("#bottomfive").click(function() {
    teamSeasonChart.data.datasets.forEach(function(ds) {
      if (ds.data[lastFullMatchNumber].reverseRank >=-5 ) {
        ds.hidden = false;
      } else {
        ds.hidden = true;
      }
   });
   teamSeasonChart.update();
  });

  $("#resetzoom").click(function() {
   teamSeasonChart.resetZoom();
  });

  $("#leagueSeason").change(async function() {
    redrawChart();
  });


  $("#chartMode").change(async function() {
    redrawChart();
  });
  
});



