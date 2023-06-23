const express = require("express");
const path = require("path");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const playerDetails = `
    SELECT * FROM player_details ORDER BY player_id;`;

  const playerQuery = await db.all(playerDetails);
  response.send(
    playerQuery.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const playerQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};`;

  const playerArray = await db.get(playerQuery);
  response.send(convertDbObjectToResponseObject(playerArray));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;

  const { playerName } = playerDetails;

  const updatePlayerDetails = `
    UPDATE 
        player_details 
    SET 
        player_name='${playerName}'

    WHERE 
        player_id=${playerId};
  `;

  await db.run(updatePlayerDetails);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchDetails = `
        SELECT * FROM match_details WHERE match_id=${matchId};
    `;
  const matchArray = await db.get(getMatchDetails);

  response.send(convertDbObjectToResponseObject(matchArray));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const getMatchId = `
  SELECT
    match_id,match,year FROM match_details  
        NATURAL JOIN player_match_score
    WHERE player_id = ${playerId};

  `;

  const playerMatchIdDetails = await db.all(getMatchId);

  response.send(
    playerMatchIdDetails.map((match) => convertDbObjectToResponseObject(match))
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const playerDetails = `
        SELECT 
            player_id,player_name
             FROM player_details 
        NATURAL JOIN player_match_score 
        WHERE match_id = ${matchId};
    `;

  const getPlayerDetails = await db.all(playerDetails);

  response.send(
    getPlayerDetails.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const playerDetails = `
    SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM 
        player_details INNER JOIN player_match_score ON 
        player_Details.player_id = player_match_score.player_id
    WHERE 
    player_details.player_id = ${playerId};`;

  const playerArray = await db.all(playerDetails);
  response.send(playerArray);
});

module.exports = app;
