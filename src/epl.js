import { getIndex, getSeason } from './api'


async function drawChart(countryCode, leagueID, season, chartMode) {
  let data = await getSeason(countryCode, leagueID, season); 
  let datasets = data.datasets;
  lastFullMatchNumber = data.lastFullMatchNumber;
  maxCumPoints = data.maxCumPoints;
  numberOfTeams = data.numberOfTeams;




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
        i = 1; //needed for zoom to work
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
      parsing: {
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
        tooltip: {
          mode: 'index',
          intersect: true,
          enabled: true,
          position: 'nearest',
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
  }

  teamSeasonChart = new Chart(document.getElementById('teamSeasons'),chartTemplate);

}


async function redrawChart() {
  const countryCode = $("#country").find(":selected").val();
  const leagueID = $("#league").find(":selected").val();
  const season = $("#season").find(":selected").val();
  const chartMode = $("#chartMode").find(":selected").val();

  //[evtodo] redo this
  //window.history.replaceState(null, null, "?leagueSeason=" + ls + "&chartMode=" + cm);

  if (teamSeasonChart) {
    teamSeasonChart.destroy();
  }

  await drawChart(countryCode, leagueID, season, chartMode);

  teamSeasonChart.update();
}

async function drawIndex() {
  index = await getIndex();
  console.log(index);

  for (const country in index) {
    if (country == 'uk') {
      $('#country').append('<option value="' + country + '" selected>' + index[country].display + '</option>');
    } else {
      $('#country').append('<option value="' + country + '">' + index[country].display + '</option>');
    }

  }

  drawLeagues();
}

function drawLeagues() {
  $('#league').find('option').remove();

  country = $("#country").find(":selected").val();

  for (const league in index[country].leagues) {
    $('#league').append('<option value="' + league + '">' + index[country].leagues[league].display + '</option>');
  }

  $('#league')[0].selectedIndex = 0;

  drawSeasons();
}


function drawSeasons() {
  $('#season').find('option').remove();

  country = $("#country").find(":selected").val();
  league = $("#league").find(":selected").val();

  for (const i in index[country].leagues[league].seasons) {
    $('#season').append('<option value="' + index[country].leagues[league].seasons[i] + '">' + index[country].leagues[league].seasons[i] + '</option>');
  }

  $('#season')[0].selectedIndex = 0;

  redrawChart();
}



var index;
var teamSeasonChart;
var lastFullMatchNumber;
var maxCumPoints;
var numberOfTeams;

//Code to run on page load
$( document ).ready(function() {

  //redirect to https if we're on http and pointed to trophyplace.com
  if (location.protocol !== 'https:' && location.href.match('trophypace') ) {
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
  

  // drawLeagues();

  // $("#league").children('[value="39"]').attr('selected', true);



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
    redrawChart();
  });


  $("#chartMode").change(async function() {
    redrawChart();
  });
  
  $("#country").change(async function() {
    drawLeagues();
  });
  
  $("#league").change(async function() {
    drawSeasons();
  });

  $("#season").change(async function() {
    redrawChart();
  });



  drawIndex();
});



