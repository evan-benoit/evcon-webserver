//jquery code to change the table when the button is clicked
$(document).ready(function(){

    //get the current date
    endDate = moment().format('YYYY-MM-DD');

    //default start date to one week before endDate
    startDate = moment(endDate).subtract(7, 'days').format('YYYY-MM-DD');

    $('input[name="date-picker"]').val(startDate + " - " + endDate);
    
    $('input[name="date-picker"]').daterangepicker({
        opens: 'left',
        locale: {
            format: 'YYYY/MM/DD'
          }
    }, function(start, end, label) {
        startDate = start.format('YYYY-MM-DD');
        endDate = end.format('YYYY-MM-DD');
    });

    //read the value of hate-draws from a cookie
    var hateDraws = Cookies.get("hate-draws");
    if (hateDraws == "true") {
        $("#hate-draws").prop("checked", true);
    } else {
        $("#hate-draws").prop("checked", false);
    }
    //same as above but for hate-nil-draws
    var hateNilDraws = Cookies.get("hate-nil-draws");
    if (hateNilDraws == "true") {
        $("#hate-nil-draws").prop("checked", true);
    } else {
        $("#hate-nil-draws").prop("checked", false);
    }


    //when the value of hate-nil-draws changes, write that to a cookie
    $("#hate-nil-draws").change(function(){
        if ($(this).is(":checked")) {
            Cookies.set("hate-nil-draws", "true");
        } else {
            Cookies.set("hate-nil-draws", "false");
        }
    });
    

    //when the value of hate-draws changes, write that to a cookie
    $("#hate-draws").change(function(){
        if ($(this).is(":checked")) {
            Cookies.set("hate-draws", "true");
            //set hate-nil-draws to true as well
            $("#hate-nil-draws").prop("checked", true);
            Cookies.set("hate-nil-draws", "true");
        } else {
            Cookies.set("hate-draws", "false");
        }
    });


    $("#button").click(function(){

        //clear the table
        $("#games").empty();

        //add the header row
        $("#games").append(
            $("<tr>").append(
                $("<td>").text("Date"),
                $("<td>").text("Home"),
                $("<td>").text("Away"),
                $("<td>").text("Better Half"),
                $("<td>")
            )
        );

        //get the value from the date picker
        var date = $("#date-picker").val();
        //get the value from the league
        var league = $("#league").val();

        //get the timezone from the selected league's data-timezone attribute
        var timezone = $("#league option:selected").attr("data-timezone");
        
        //get the current and prior year
        var currentYear = new Date().getFullYear();
        var priorYear = currentYear - 1;

        //annoyingly, we need to specify the season to the API.  
        //Sometimes the current season is the current year, sometimes it's the prior year (for leagues that span the new year)
        //create an array of these two years and loop through it, calling the API twice
        var years = [currentYear, priorYear];
        years.forEach(year => {
            $.ajax({
                url: "https://api-football-v1.p.rapidapi.com/v3/fixtures?timezone=" + timezone + "&from=" + startDate + "&to=" + endDate+ "&league=" + league + "&season=" + year,
                headers: {
                    "X-RapidAPI-Key": "3f23d2ecadmsh4f2bb7c7550b6f9p12596cjsnd21e81ce783d"
                },
                method: "GET",
                dataType: "json",
                success: function(data){
                    //update the table with the new data
                    updateTable(data, league);
                }   
            });
        });
    });

    //write the updateTable function to put that day's games in the table
    function updateTable(data, league){

        //loop through the games
        for (var i = 0; i < data.response.length; i++){
            //build the row
            //using example from https://stackoverflow.com/questions/17724017/using-jquery-to-build-table-rows-from-ajax-responsejson

            //get the home and away score
            let fixtureID = data.response[i].fixture.id;
            let homeName = data.response[i].teams.home.name;
            let awayName = data.response[i].teams.away.name;
            let homeFinalScore = data.response[i].score.fulltime.home;
            let awayFinalScore = data.response[i].score.fulltime.away;
            let winningFinalScore;
            let losingFinalScore;
            let winningHalftimeScore;
            let losingHalftimeScore;
            let halfToWatch;

            if (homeFinalScore === awayFinalScore) {

                //if hate-draws is checked, skip the game
                if ($("#hate-draws").is(":checked")) {
                    halfToWatch = "Skip Game";
                } else {

                    if (homeFinalScore == 0 && $("#hate-nil-draws").is(":checked")) {
                        halfToWatch = "Skip Game";
                    } else {
                        halfToWatch = "2nd Half";
                    }
                }
            } else {
                if (homeFinalScore > awayFinalScore) {
                    winningFinalScore = homeFinalScore;
                    losingFinalScore = awayFinalScore;
                    winningHalftimeScore = data.response[i].score.halftime.home;
                    losingHalftimeScore = data.response[i].score.halftime.away;

                } else {
                    winningFinalScore = awayFinalScore;
                    losingFinalScore = homeFinalScore;
                    winningHalftimeScore = data.response[i].score.halftime.away;
                    losingHalftimeScore = data.response[i].score.halftime.home;
                }

                //if the winning team was winning at halftime, watch the first half
                if (winningHalftimeScore > losingHalftimeScore) {
                    halfToWatch = "1st Half";
                } else {
                    halfToWatch = "2nd Half";
                }
            }

            $("#games").append(
                $("<tr>").append(
                    $("<td>").text(data.response[i].fixture.date.substring(0, 10)),
                    $("<td>").text(homeName).attr("id", "fixture-home-" + fixtureID),
                    $("<td>").text(awayName).attr("id", "fixture-away-" + fixtureID),
                    $("<td>").text(halfToWatch),

                    //append a button labeled "reveal score"
                    $("<td>").append(
                        $("<button>").text("Reveal Score").click(function(){
                            //when the button is clicked, reveal the score
                            $("#fixture-home-" + fixtureID).text(homeName + ": " + homeFinalScore);
                            $("#fixture-away-" + fixtureID).text(awayName + ": " + awayFinalScore);

                            //and remove the button
                            $(this).remove();
                        })
                    )
                )
            );
        }
    }
});