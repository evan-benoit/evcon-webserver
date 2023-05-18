# About EvCon

I’m inspired by pennant-race.com, which is a simple website displaying the “race” to Major League Baseball’s division pennants, showing the saga of the 162 game season in one interactive graph.  Ups and downs, losing streaks and comebacks, it’s my go-to site for MLB standings.  It’s so much better than a simple table of the standings.

Lately I’ve been getting into English Premier League soccer.  The structure is similar to most sports: 20 teams, 38 games, 3 points for a win, 1 for a draw, 0 for a loss.  The biggest difference is that the EPL has no playoffs, so the regular season “race” is all there is, winner take all!

To my great surprise, there is no website like pennant-race.com for the Premier League!  I’ve Googled around, asked around, and unless my search terms are completely mistaken, I haven’t been able to find anything like it for soccer, despite the Premier League being one of the most popular leagues in the whole world!  Time to fix that!

# evcon-webserver
This repo is for the front-end javascript code that displays the data to users.  

## development
To run this locally, run

`npm install
rm -rf .parcel-cache; npm run dev
`

## deployment
To deploy this code to AWS, run:

`
docker build -t webserver . --platform linux/amd64
docker tag webserver us-east1-docker.pkg.dev/evcon-app/my-repository/webserver
docker push us-east1-docker.pkg.dev/evcon-app/my-repository/webserver
`
