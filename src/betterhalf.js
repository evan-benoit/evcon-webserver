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
    //same as above, but for who-won
    var whoWon = Cookies.get("who-won");
    if (whoWon == "true") {
        $("#who-won").prop("checked", true);
    } else {
        $("#who-won").prop("checked", false);
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

    //when the value of who-won changes, write that to a cookie
    $("#who-won").change(function(){
        if ($(this).is(":checked")) {
            Cookies.set("who-won", "true");
        } else {
            Cookies.set("who-won", "false");
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

        //get the value from the date picker
        var date = $("#date-picker").val();
        //get the value from the league
        var league = $("#league").val();

        //get the timezone from the selected league's data-timezone attribute
        // var timezone = $("#league option:selected").attr("data-timezone");
        // hardcode the timezone to new york for now MUST FIX THIS
        var timezone = "America/New_York";
        var countryCode = $("#country").val();

        $.ajax({
            url: "https://us-east1-evcon-app.cloudfunctions.net/betterHalf?countryCode=" + countryCode + "&leagueID=" + league + "&startDate=" + startDate + "&endDate=" + endDate + "&timezone=" + timezone,
            method: "POST",
            dataType: "json",
            success: function(data){
                //update the table with the new data
                updateTable(data, league);
            },   
            //if there's an error, print that an error occurred
            error: function(){
                $("#games").empty();

                $("#games").append(
                    $("<tr>").append( 
                        $("<td>").html("<i>Sorry, an error occurred. Please try again later.</i>")
                    )
                );
            },
            //add a loading message
            beforeSend: function(){
                $("#games").empty();

                $("#games").append(
                    $("<tr>").append( 
                        $("<td>").html("<i>Loading...</i>")
                    )
                );
            }
        });
    });

    //write the updateTable function to put that day's games in the table
    function updateTable(data, league){

    
        // if there are no games, tell the user to pick a different date range
        if (data.length == 0) {
            $("#games").empty();

            $("#games").append(
                $("<tr>").append( 
                    $("<td>").html("<i>Sorry, there are no games in that league for that date range!</i>")
                )
            );

            return;
        }

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

        //loop through the games
        for (var i = 0; i < data.length; i++){
 
            //get the home and away score
            let fixtureID = data[i].fixtureID;
            let homeName = data[i].homeTeam;
            let awayName = data[i].awayTeam;
            let homeFinalScore = data[i].homeFinalScore;
            let awayFinalScore = data[i].awayFinalScore;
            let nearComeback = data[i].nearComeback;
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
            } else if (nearComeback) {
                //if the losing team almost came back, watch the second half
                halfToWatch = "2nd Half";
                
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
            //if who-won is checked, automatically bold the winner
            if ($("#who-won").is(":checked")) {
                if (homeFinalScore > awayFinalScore) {
                    $("#fixture-home-" + fixtureID).css("font-weight", "bold");
                } else if (homeFinalScore < awayFinalScore) {
                    $("#fixture-away-" + fixtureID).css("font-weight", "bold");
                } else {
                    $("#fixture-home-" + fixtureID).css("font-style", "italic");
                    $("#fixture-away-" + fixtureID).css("font-style", "italic");
                }
            }
        }
    }


    function drawCountries(data) {    
        let index = data;

        // add a dropdown item for international
        $('#country').append('<option value="un">🌐Int\'l</option>');
        for (const country of Object.keys(index).sort()) {
            $('#country').append('<option value="' + country + '">' + index[country].display + '</option>');
        }
            
        drawLeagues(index);

        $("#country").change(async function() {
            drawLeagues(index);
        });
    }

    function drawLeagues(index) {
        $('#league').find('option').remove();
      
        var country = $("#country").find(":selected").val();
      
        // if the country selected is "un" (i.e. "united nations", the best iso code I could find for the world), 
        // add the champions league and europa league!
        // (maybe not ideal that I hardcode this, but ¯\_(ツ)_/¯)
        if (country == "un") {
          $('#league').append('<option value="2">Champions League</option>');
          $('#league').append('<option value="848">Europa League</option>');
        } else {
            for (const league in index[country].leagues) {
            $('#league').append('<option value="' + league + '">' + index[country].leagues[league].display + '</option>');
            }
        }
    }



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