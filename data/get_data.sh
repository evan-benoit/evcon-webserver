curl --request GET \
	--url 'https://api-football-v1.p.rapidapi.com/v3/fixtures?date=2023-03-04&league=39&season=2022' \
	--header 'X-RapidAPI-Host: api-football-v1.p.rapidapi.com' \
	--header 'X-RapidAPI-Key: bd4c89aaccmshb317afc95667941p1c0f98jsna8a191b4f7be' | jq > 20230304.json



cat 20230304.json | jq '.response[] | "\(.fixture.date[:10]),\(.teams.home.name),\(.goals.home),\(.teams.away.name),\(.goals.away)"'



curl --request GET \
	--url 'https://api-football-v1.p.rapidapi.com/v3/fixtures?league=39&season=2022&from=1900-01-01&to=2023-03-07' \
	--header 'X-RapidAPI-Host: api-football-v1.p.rapidapi.com' \
	--header 'X-RapidAPI-Key: bd4c89aaccmshb317afc95667941p1c0f98jsna8a191b4f7be' | jq > 2022_2023_season.json

cat 2022_2023_season.json | jq '.response[] | "\(.fixture.timestamp),\(.fixture.date[:10]),\(.teams.home.name),\(.goals.home),\(.teams.away.name),\(.goals.away)"' > 2022_2023_season.csv

#ugh need to strip the double quotes after that...