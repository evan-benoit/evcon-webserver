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

    //when the value of league changes, write that to a cookie
    $("#league").change(function(){
        Cookies.set("league", $(this).val());
    });

    //read the value of league from a cookie
    var league = Cookies.get("league");
    if (league) {
        $("#league").val(league);
    }


    $("#button").click(function(){

        // if the end date is more than four months from the start date, tell the user to pick a shorter range
        if (moment(endDate).diff(moment(startDate), 'days') >= 28) {
            $("#games").empty();

            $("#games").append(
                $("<tr>").append( 
                    $("<td>").html("<i>Please select a date range shorter than 4 weeks, or I get tired from so much running around!</i>")
                )
            );

            return;
        }

        //clear the table
        $("#games").empty();

        //add the header row
        $("#games").append(
            $("<tr>").append(
                $("<th>").text("Date"),
                $("<th>").text("Home"),
                $("<th>").text("Away"),
                $("<th>").text("Better Half")
            )
        );

        //get the value from the date picker
        var date = $("#date-picker").val();
        //get the value from the league
        var league = $("#league").val();

        //get the timezone from the selected league's data-timezone attribute
        var timezone = $("#league option:selected").attr("data-timezone");
        var countryCode = $("#league option:selected").attr("data-countryCode");

        
        //get the year from startDate
        var currentYear = startDate.substring(0, 4);
        var priorYear = currentYear - 1;

        //annoyingly, we need to specify the season to the API.  
        //Sometimes the current season is the current year, sometimes it's the prior year (for leagues that span the new year)
        //create an array of these two years and loop through it, calling the API twice
        var years = [currentYear, priorYear];
        var totalGames = 0;

        years.forEach(year => {
            $.ajax({
                url: "https://us-east1-evcon-app.cloudfunctions.net/betterHalf?countryCode=" + countryCode + "&leagueID=" + league + "&seasonID=" + year  + "&startDate=" + startDate + "&endDate=" + endDate + "&timezone=" + timezone,
                method: "POST",
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
        for (var i = 0; i < data.length; i++){
 
            //get the home and away score
            let fixtureID = data[i].fixtureID;
            let homeName = data[i].homeTeam;
            let awayName = data[i].awayTeam;
            let homeFinalScore = data[i].homeFinalScore;
            let awayFinalScore = data[i].awayFinalScore;
            let date = data[i].date;
            let winningFinalScore;
            let losingFinalScore;
            let winningHalftimeScore;
            let losingHalftimeScore;
            let halfToWatch;

            //Remove the trailing "W" from the home team's name if it's there
            if (homeName.substring(homeName.length - 1) == "W") {
                homeName = homeName.substring(0, homeName.length - 1);
            }
            //Remove the trailing "W" from the away team's name if it's there
            if (awayName.substring(awayName.length - 1) == "W") {
                awayName = awayName.substring(0, awayName.length - 1);
            }

            //if the game hasn't been played yet, skip it
            if (homeFinalScore === null) {
                continue;
            }   

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
                    winningHalftimeScore = data[i].homeHalftimeScore;
                    losingHalftimeScore = data[i].awayHalftimeScore;

                } else {
                    winningFinalScore = awayFinalScore;
                    losingFinalScore = homeFinalScore;
                    winningHalftimeScore = data[i].awayHalftimeScore;
                    losingHalftimeScore = data[i].homeHalftimeScore;
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
                    $("<td>").text(date),
                    $("<td>").text(homeName).attr("id", "fixture-home-" + fixtureID),
                    $("<td>").text(awayName).attr("id", "fixture-away-" + fixtureID),
                    $("<td>").html(halfToWatch + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;")

                    //append a button labeled "reveal score"
                    .append(
                        $("<button>").text("Reveal Score").addClass("rightButton").click(function(){
                            //when the button is clicked, reveal the score
                            // if the home team wins, bold it
                            if (homeFinalScore > awayFinalScore) {
                                $("#fixture-home-" + fixtureID).css("font-weight", "bold");
                            } else if (homeFinalScore < awayFinalScore) {
                                $("#fixture-away-" + fixtureID).css("font-weight", "bold");
                            } else {
                                //if it's a draw, italicize both
                                $("#fixture-home-" + fixtureID).css("font-style", "italic");
                                $("#fixture-away-" + fixtureID).css("font-style", "italic");
                            }
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