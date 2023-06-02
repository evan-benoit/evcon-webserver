import { getLeagueSeasons } from './api'
import autocolors from 'chartjs-plugin-autocolors';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(autocolors);
Chart.register(zoomPlugin);

async function drawChart(leagueSeason, chartMode) {
  let data = await getLeagueSeasons(leagueSeason); 
  let datasets = data.datasets;
  lastFullMatchNumber = data.lastFullMatchNumber;
  maxCumPoints = data.maxCumPoints;
  numberOfTeams = data.numberOfTeams;


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

  teamSeasonChart = new Chart(document.getElementById('teamSeasons'),chartTemplate);

  if (chartMode == "byDate") {
    teamSeasonChart.options.parsing.xAxisKey = 'timestamp';
    teamSeasonChart.options.scales.x.type = 'time';
    teamSeasonChart.options.scales.x.title.text = 'Date';

    teamSeasonChart.options.parsing.yAxisKey = 'cumPoints';
    teamSeasonChart.options.scales.y.title.text = 'Points';
    teamSeasonChart.options.scales.y.reverse = false;
    teamSeasonChart.options.scales.y.min = 0;
    teamSeasonChart.options.scales.y.max = maxCumPoints + 1;
    
    teamSeasonChart.data.datasets.forEach((dataset) => {
      dataset.stepped = true;
    });

  } else if (chartMode == "byMatch") {
    teamSeasonChart.options.parsing.xAxisKey = 'matchNumber';
    teamSeasonChart.options.scales.x.type = 'linear';
    teamSeasonChart.options.scales.x.title.text = 'Match Number';

    teamSeasonChart.options.parsing.yAxisKey = 'cumPoints';
    teamSeasonChart.options.scales.y.title.text = 'Points';
    teamSeasonChart.options.scales.y.reverse = false;
    teamSeasonChart.options.scales.y.min = 0;
    teamSeasonChart.options.scales.y.max = maxCumPoints + 1;

    teamSeasonChart.data.datasets.forEach((dataset) => {
      dataset.stepped = false;
    });

  } else if (chartMode == "bumpChart") {
    teamSeasonChart.options.parsing.xAxisKey = 'matchNumber';
    teamSeasonChart.options.scales.x.type = 'linear';
    teamSeasonChart.options.scales.x.title.text = 'Match Number';

    teamSeasonChart.options.parsing.yAxisKey = 'rank';
    teamSeasonChart.options.scales.y.title.text = 'Rank';
    teamSeasonChart.options.scales.y.reverse = true;
    teamSeasonChart.options.scales.y.min = 0;
    teamSeasonChart.options.scales.y.max = numberOfTeams+1;


    teamSeasonChart.data.datasets.forEach((dataset) => {
      dataset.stepped = false;
    });
  }
}

var teamSeasonChart;
var lastFullMatchNumber;
var maxCumPoints;
var numberOfTeams;

//Code to run on page load
$( document ).ready(function() {

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

  $("#leagueSeason").change(async function() {
    const ls = $("#leagueSeason").find(":selected").val();
    const cm = $("#chartMode").find(":selected").val();


    teamSeasonChart.destroy();

    await drawChart(ls, cm);

    teamSeasonChart.update();
  });


  $("#chartMode").change(async function() {
    const ls = $("#leagueSeason").find(":selected").val();
    const cm = $("#chartMode").find(":selected").val();

    teamSeasonChart.destroy();

    await drawChart(ls, cm);

    teamSeasonChart.update();
  });
  
});



