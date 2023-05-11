import { getLeagueSeasons } from './api'


(async function() {
  const datasets = await getLeagueSeasons();

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
        tooltip: {
          mode: 'index',
          intersect: true,
          enabled: true,
          postition: 'nearest',
          itemSort: function(a, b) {
            return b.raw.y - a.raw.y;
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



