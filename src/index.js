

async function drawChart(countryCode, leagueID, season, chartMode, logo) {
  clearLogo();

  // make an ajax call to getSeason
  let data = await $.ajax({
    url: "https://us-east1-evcon-app.cloudfunctions.net/getSeason?countryCode=" + countryCode + "&leagueID=" + leagueID + "&season=" + season,
    method: "POST",
    dataType: "json"
  });
  
  let datasets = data.datasets;
  lastFullMatchNumber = data.lastFullMatchNumber;
  maxCumPoints = data.maxCumPoints;
  numberOfTeams = data.numberOfTeams;


  drawLogo(logo, chartMode);

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
          },
          ticks: {
            stepSize: 1 
          }
        },
        x: {
          type: "time",
          parsing: true,
          title: {
            text: 'Date',
            display: true,
          },
          ticks: {
            stepSize: 1
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
                    return fixture.rank + ") " + fixture.teamName + ": " + fixture.cumPoints + " points (GD: " + fixture.cumDifferential + " Goals: " + fixture.cumGoals + ")";
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

              // if we're in bumpchart or byMatch mode, show the date
              let matchInfo = "";
              if (chartMode == "bumpChart" || chartMode == "byMatch") {
                matchInfo = new Date(raw.timestamp).toISOString().slice(0,10);
             
              //else, show the matchNumber
              } else {
                matchInfo = "Match " + raw.matchNumber;
              }

              //translate the timestamp into a date with YYYY-MM-DD format
              const gameDate = new Date(raw.timestamp).toISOString().slice(0,10);

              if (raw.teamName == raw.homeTeam) {
                return raw.homeTeam.toUpperCase() + " " + raw.homeScore + " - " + raw.awayTeam + " " + raw.awayScore + " (" + matchInfo + ")"
              } else {
                return raw.homeTeam + " " + raw.homeScore + " - " + raw.awayTeam.toUpperCase() + " " + raw.awayScore + " (" + matchInfo + ")"
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

  drawTags(datasets)
}

function clearLogo() {
  var canvas = document.getElementById('teamSeasons');
  canvas.style.backgroundImage = null;
}

function drawLogo(logo, chartMode) {

  var canvas = document.getElementById('teamSeasons');

  // if we're in rank mode, hide the logo
  if (chartMode == "bumpChart") {
    canvas.style.backgroundImage = null;
  } else {
    // Set the CSS of the canvas for the background image
    canvas.style.backgroundImage = "url('" + logo + "')";
    canvas.style.backgroundRepeat = "no-repeat";
    canvas.style.backgroundPositionX = "50px";
    canvas.style.backgroundPositionY = "50px";
    canvas.style.backgroundSize = "20%";    
  }
}

function drawTags(datasets) {
  // initialize the list of tags
  let tags = [];

  // clear everything in the tags div
  $("#tags").empty();

  // loop through each item in data
  for (const team of datasets) {
    // loop through the tags in teamName
    if (team.tags != null) {

      for (const tag of team.tags) {

        // if the tag is not already in the list of tags, add it
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      }
    }
  }

  // sort the tags
  tags.sort();

  // for each tag, add a button to the tags div
  for (const tag of tags) {

    // replace spaces with underscores
    let id = "tag-" + tag.replaceAll(" ", "-");

    $("#tags").append('<button id="' + id + '" class="italicButton">' + tag + '</button>&nbsp;');

    // add an event listener to the button to show only teams with that tag
    $("#" + id).click(function() {

      teamSeasonChart.data.datasets.forEach(function(ds) {
        if (ds.tags != null) {
          if (ds.tags.includes(tag) ) {
            ds.hidden = false;
          } else {
            ds.hidden = true;
          }
        }
     });
     teamSeasonChart.update();      

    });

  }


}


async function redrawChart() {
  const countryCode = $("#country").find(":selected").val();
  const leagueID = $("#league").find(":selected").val();
  const season = $("#season").find(":selected").val();
  const chartMode = $("#chartMode").find(":selected").val();
  const logo = $("#league").find(":selected").data("logo");

  window.history.replaceState(null, null, "?country=" + countryCode + "&league=" + leagueID + "&season=" + season + "&chartMode=" + chartMode);

  if (teamSeasonChart) {
    teamSeasonChart.destroy();
  }

  await drawChart(countryCode, leagueID, season, chartMode, logo);

  teamSeasonChart.update();
}

function drawCountries(data) {
  console.log(data);

  let index = data;

  for (const country of Object.keys(index).sort()) {
    $('#country').append('<option value="' + country + '">' + index[country].display + '</option>');
  }

  if (countryParam != null) {
    $('#country').val(countryParam);   
  } else {
    $('#country').val("uk");
  }
  
  drawLeagues(index);

  $("#chartMode").change(async function() {
    redrawChart();
  });
  
  $("#country").change(async function() {
    drawLeagues(index);
    redrawChart();
  });
  
  $("#league").change(async function() {
    drawSeasons(index);
    redrawChart();
  });

  $("#season").change(async function() {
    redrawChart();
  });  

  if (leagueParam != null) {
    $('#league').val(leagueParam);   
  } else {
    $('#league').val("39");
  }

  if (seasonParam != null) {
    $('#season').val(seasonParam);   
  } else {
    $('#season')[0].selectedIndex = 0;
  }

  redrawChart();
}

function drawLeagues(index) {
  $('#league').find('option').remove();

  var country = $("#country").find(":selected").val();

  for (const league in index[country].leagues) {
    $('#league').append('<option value="' + league + '" data-logo="' + index[country].leagues[league].logo + '">' + index[country].leagues[league].display + '</option>');
  }
  drawSeasons(index);
}


function drawSeasons(index) {
  $('#season').find('option').remove();

  var country = $("#country").find(":selected").val();
  var league = $("#league").find(":selected").val();

  for (const i in index[country].leagues[league].seasons.sort().reverse()) {
    var season = index[country].leagues[league].seasons[i];
    var seasonDisplay

    // if the country is not "us", then display the season as spanning two years
    // (yeah this is kind of a hack, but it works for now, and I won't have to change the data model)
    if (country != "us") {
      // nextYear is the year after the season
      var nextYear = parseInt(season) + 1;
      seasonDisplay = season + "-" + nextYear;
    } else {
      seasonDisplay = season;
    }

    $('#season').append('<option value="' + season + '">' + seasonDisplay + '</option>');
  }



}



var teamSeasonChart;
var lastFullMatchNumber;
var maxCumPoints;
var numberOfTeams;

const urlParams = new URLSearchParams(window.location.search);
const countryParam = urlParams.get('country');
const leagueParam = urlParams.get('league');
const seasonParam = urlParams.get('season');
const chartModeParam = urlParams.get('chartMode');


//Code to run on page load
$( document ).ready(function() {

  if (chartModeParam != null) {
    $('#chartMode').val(chartModeParam);   
  } else {
    $('#chartMode').val("byMatch"); 
  }



  //redirect to https if we're on http and pointed to trophyplace.com
  if (location.protocol !== 'https:' && location.href.match('trophypace') ) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  } 


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

  $("#generateSummary").click(function() {
    // put a loading message in the summary
    $("#summary").text("Loading summary (can take up to 30 seconds)...");

    // let baseURL = "http://127.0.0.1:8080/summary";
    let baseURL = "https://evcon-generate-3ljnqbebyq-ue.a.run.app/summary";

    let teamList = [];

    teamSeasonChart.data.datasets.forEach(function(ds) {
      if (!ds.hidden) {
        teamList.push(ds.label);
      }
    });

    $.ajax({
      url: baseURL + "?countryCode=" + $("#country").find(":selected").val() + 
                      "&leagueID=" + $("#league").find(":selected").val() + 
                      "&season=" + $("#season").find(":selected").val() + 
                      "&teamList=" + teamList.join("%2C"),  //[evtodo] there has to be a better way to do this

      method: "GET",
      success: function(data) {

        // make the graphDiv and summaryDiv both 50% wide
        $("#graphDiv").css("width", "50%");
        $("#summaryDiv").css("width", "50%");

        $("#summary").html(data.summary);
      },
      error: function() {
        $("#summary").text("Error occurred while fetching summary.");
      }
    });
  });


  // Make the ajax call to load the country dropdown
  $.ajax({
    url: "https://us-east1-evcon-app.cloudfunctions.net/getIndex",
    method: "POST",
    dataType: "json",
    success: function(data){
        drawCountries(data); 
    },   
    //if there's an error, print that an error occurred in the countries dropdown
    error: function(){
        $("#country").empty();

        $("#country").append(
            $("<option>").html("<i>Sorry, an error occurred. Please try again later.</i>")
        );
    }
  });


});



