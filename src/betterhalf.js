//jquery code to change the table when the button is clicked
$(document).ready(function(){
    $("#button").click(function(){
        //get the value from the date picker
        var date = $("#date-picker").val();
        //get the value from the league
        var league = $("#league").val();

        //lookup the games for that day for that league from football-api 
        $.ajax({
            url: "https://api-football-v1.p.rapidapi.com/v2/fixtures/date/" + date + "?timezone=Europe%2FLondon",
            headers: {
                "X-RapidAPI-Key": "3f23d2ecadmsh4f2bb7c7550b6f9p12596cjsnd21e81ce783d"
            },
            method: "GET",
            dataType: "json",
            success: function(data){
                //update the table with the new data
                updateTable(data, league);
            }   
        })
    });

    //write the updateTable function to put that day's games in the table
    function updateTable(data, league){

        var uuid = "3f23d2ecadmsh4f2bb7c7550b6f9p12596cjsnd21e81ce783d"
        
        //make sure the uuid is in the uuid v4 format
        if (uuid.length != 36){
            alert("Invalid UUID");
            removeEventListener


        //clear the table
        $("#table-body").empty();
        //loop through the games
        for (var i = 0; i < data.api.fixtures.length; i++){
            //if the league matches the league selected
            if (data.api.fixtures[i].league.name == league){
                //add a row to the table
                $("#table-body").append("<tr>");
                //add the home team to the table
                $("#table-body").append("<td>" + data.api.fixtures[i].homeTeam.team_name + "</td>");
                //add the away team to the table
                $("#table-body").append("<td>" + data.api.fixtures[i].awayTeam.team_name + "</td>");
                //add the time to the table
                $("#table-body").append("<td>" + data.api.fixtures[i].event_date + "</td>");
                //add the score to the table
                $("#table-body").append("<td>" + data.api.fixtures[i].score.fulltime + "</td>");
                //add the status to the table
                $("#table-body").append("<td>" + data.api.fixtures[i].status + "</td>");
                //close the row
                $("#table-body").append("</tr>");
            }
        }
    }
});