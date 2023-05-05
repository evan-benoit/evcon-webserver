import { getLeagueSeasons } from './api'


(async function() {
  const datasets = await getLeagueSeasons();

  new Chart(
    document.getElementById('teamSeasons'),
    {
      type: 'line',
      data: {datasets: datasets },
      options: {
        // animation,
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
            parsing: false,
  
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
      },
    }
  );
})();