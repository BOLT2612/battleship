// battleship.js

var element = function(id){
  return document.getElementById(id);
};

var gameCenter = element('GameCenter');
var instructions = element("Instructions");
var player1 = element("Player1");
var player2 = element("Player2");

var grid1 = element("Grid1");
var grid2 = element("Grid2");

// model.ships.p1[0].location
var model = {
  gridSize: 12,
  shipsLength: [5,4,3,3,2],   // each value represents the length in table cells or the respective ship
  state: 'P1_Position',     //P1_Position, 'Transition_To_p2', P2_Position, P1_Go, P2_Go, Game_Over
  // ships generated according to data in model.shipsLength
   ships: { p1: [], p2: [] },
  // shots generated according to data in model.shipsLength
  shots: { p1: [], p2: [] }
}

function generateShips(model) {
  model.shipsLength.forEach((x, idx) => {
    model.ships.p1[idx] = { location: Array(x).fill(''), hits: Array(x).fill('')} ;
    model.ships.p2[idx] = { location: Array(x).fill(''), hits: Array(x).fill('')} ;
  });
}

function togglePlayer() {
  if (model.state === 'P1_Go') {
    writeFireInstructions('p2');
    model.state = 'P2_Go';
  } else if (model.state === 'P2_Go') {
    writeFireInstructions('p1');
    model.state = 'P1_Go';
  }
}

function allShipsSunk(player) {
  return model.ships[player].reduce((pre, x) => pre && (x['hits'].indexOf('') === -1), true);
}

function markAsSunk(cellID, oneShip) {
  let prefix = cellID.slice(0,3);
  oneShip.forEach((x) => {
    markCell(prefix + x, 'sunk');
  });
}

function reveal(player) {
  let shipsArray = model.ships[player];
  let prefix = player === 'p1' ? 'p2-' : 'p1-';
  for (let i = 0; i < shipsArray.length; i++) {
    let oneShipsPos = shipsArray[i]['location'];
    let oneShipsHits = shipsArray[i]['hits'];
    for (j = 0; j < oneShipsPos.length; j++) {
      if (oneShipsHits.indexOf(oneShipsPos[j]) === -1) {
        document.getElementById(prefix+oneShipsPos[j]).setAttribute('class','reveal');
      }
    }
  }
}

function markCell(cellID, result) {
  let currentCell = document.getElementById(cellID);
  currentCell.innerHTML = result.slice(0,1);
  currentCell.setAttribute("class", result);
}


function fire(cellID) {   // hit, miss, already taken, sunk, win
  let player = cellID.slice(0,2);
  let victim = player === 'p1' ? 'p2': 'p1';

  let coordinates = cellID.split('-').slice(1);
  // see if coordinate matches previous move
  if (model.shots[player].indexOf(cellID) > -1) {      // ALREADY TAKEN
    alert("row " + coordinates[0] + " column " + coordinates[1] + " ALREADY TAKEN");
    writeFireResult(player, 'ALREADY TAKEN');
    return;
  } else {
    model.shots[player].push(cellID)  // record grid position of shot
  }
  // check if coordinates match the location of any ship
  let shipsArray = model.ships[victim];
  for (let i = 0; i < shipsArray.length; i++) {
    let oneShip = shipsArray[i];
    let shotResult = oneShip['location'].indexOf(cellID.slice(3));
    if (shotResult > -1) { 
      oneShip['hits'][shotResult] = cellID.slice(3);   // HIT
      if (oneShip['hits'].indexOf('') === -1) {       // SUNK
        markAsSunk(cellID, oneShip['location']);
        writeFireResult(player, 'SUNK');
        if (allShipsSunk(victim)) {
          writeFireResult(player, 'WIN');             // WIN
          writeWinInstructions(player);
          reveal(player);
          model.state = 'Game Over';
          return;
        }
        togglePlayer();
        return;
      }
      writeFireResult(player, 'HIT');
      markCell(cellID, 'hit');
      togglePlayer();
      return;
    } 
  }
  writeFireResult(player, 'MISS');
  markCell(cellID,'miss');                           // MISS
  togglePlayer();
  return;
}

function writeWinInstructions(player) {
  var x = document.getElementById(player + '_fire_instr');
  document.getElementById(player + '_fire_instr').textContent = 'YOU ARE THE WINNER!';
  let passivePlayer = player === 'p1' ? 'p2' : 'p1';
  document.getElementById(passivePlayer + '_fire_instr').textContent = 'Game Over: All your ships are sunk :-(';

}

function buildAnOceanGrid(gridId, topText, gridPrefix) {
  // create the table which represents the ocean grid
  let gameTable = document.createElement("table");
  gameTable.setAttribute("id", gridId);
  let gameTableCaption = document.createElement("caption");
  gameTableCaption.innerHTML = topText;
  gameTable.appendChild(gameTableCaption)
  // make the top header row to list the grid numbers
  let gameRow = document.createElement("tr");
  let x = document.createElement("th");
  x.innerHTML = 'row/col';
  gameRow.appendChild(x);

  for (let j = 0; j < model.gridSize; j++){
    let x = document.createElement("th");
    x.innerHTML = j.toString();
    gameRow.appendChild(x);
  }
  gameTable.appendChild(gameRow);

  for (let i = 0; i < model.gridSize; i++) {
    let gameRow = document.createElement("tr");
    let x = document.createElement("th");
    x.innerHTML = i.toString();
    gameRow.appendChild(x);

    for (let j = 0; j < model.gridSize; j++){
      let x = document.createElement("td");
      x.innerHTML = ' ';
      x.setAttribute("id", gridPrefix + '-' + i.toString() + '-' + j.toString());
      gameRow.appendChild(x);
    }
    gameTable.appendChild(gameRow);
  }
  return gameTable;
}

function doesShipFit(coordinates, length, vertical) {
  if (vertical) {
    return ((Number.parseInt(coordinates[0]) + length -1) > model.gridSize - 1) ? false : true;
  } else {
    return ((Number.parseInt(coordinates[1]) + length -1) > model.gridSize - 1) ? false : true;
  }
}

function shipOverlap(player, tryPosition) {
  let shipsArray = model.ships[player];
  for (let i = 0; i < shipsArray.length; i++) {
    let oneShipsPos = shipsArray[i]['location'];
    for (j = 0; j < oneShipsPos.length; j++) {
      if (tryPosition.indexOf(oneShipsPos[j]) > -1) {
        return oneShipsPos[i]
      }
    }
  }
  return '';
}

function placeShip(player, coordinates, verticalShip) {
  var shipNum = checkWhichShipLeft(player);
  let shipLength = model.ships[player][shipNum].location.length;
  if (shipNum === -1) {
    alert("Player " + player + ": No more ships to place");
    return;
  }
  if (!doesShipFit(coordinates, shipLength, verticalShip)) {
    let orientation = verticalShip ? "vertically" : "horizontally";
    alert("Ship length " + shipLength + " will not fit at " + coordinates + " " + orientation);
    return;
  }
  let tryPos = [];
  let row = Number.parseInt(coordinates[0]);
  let column = Number.parseInt(coordinates[1]);
  for (let i = 0; i < shipLength; i++){
    if (verticalShip) {
      tryPos.push( (row + i).toString() + '-' + column.toString() );   // use '9-5' as the format pushed 
    } else {
      tryPos.push(row.toString() + '-' + (column + i).toString());
    }
  }
  // store position as a string rowNumber-columnNumber
  let shipOnShip = shipOverlap(player, tryPos);
  if (shipOnShip !== '') {
      alert("Invalid Position: coordinates " + shipOnShip + " overlap with placed ship");
    return;
  }
  model.ships[player][shipNum].location = tryPos;
  // update instructions on screen
  document.getElementById(player + '_text').innerHTML = createPlacementText(player, shipNum+1);
  model.ships[player][shipNum].location.forEach((x) => {
    document.getElementById(player + '-' + x).innerHTML = shipNum+1;
  })

  if (checkWhichShipLeft(player) === -1) {
    if (model.state === 'P1_Position') {
      model.state = 'Transition_To_p2';
    } else if (model.state === 'P2_Position') {
      model.state = 'Transition_To_P1_Go';
    }
  }
}

function checkWhichShipLeft(playerNum) {
  return model.ships[playerNum].reduce((pre, x, idx) => {
      if (pre === -1 && x.location[0] === '') return idx;
      else return pre;
    }, -1);
}

function createPlacementText(player, shipIdx) {
  if (shipIdx > -1 && shipIdx < model.shipsLength.length) {
    let temp = model.shipsLength.length - shipIdx;
    return '' + temp + ' Ships to place - Current Ship length = ' + model.ships[player][shipIdx].location.length + '.  A click places left or top part of ship';
  } else {
    return 'All ships placed for this player. \nClick Anywhere on grid to move to next step.';
  }
}

function writeFireResult(player, result) {
  document.getElementById(player + '_fire_result').textContent = "last shot: " + result;
  let passivePlayer = player === 'p1' ? 'p2' : 'p1';
  document.getElementById(passivePlayer + '_fire_instr').textContent = '';
}

function writeFireInstructions(player) {
  var x = document.getElementById(player + '_fire_instr');
  document.getElementById(player + '_fire_instr').textContent = 'Use this grid to attack opponent: Click grid to fire';
  let passivePlayer = player === 'p1' ? 'p2' : 'p1';
  document.getElementById(passivePlayer + '_fire_instr').textContent = 'Please wait for player ' + player;
  var y = document.getElementsByTagName("caption");
  for (let i = 0; i < y.length; i++) {
    let number = y.length - i;
    let playerNumber = i + 1;
    y[i].innerHTML = 'Player ' + playerNumber +  ', Attack Player ' + number + ' Using This Grid';
  }
  document.getElementById('Player' + player.slice(1)).setAttribute('class', 'active');
  document.getElementById('Player' + passivePlayer.slice(1)).removeAttribute('class');
}

function setUpFireInstructions(player) {
  // this should be refactored but I need to submit this very soon
  let playerNumber = Number.parseInt(player.slice(1));
  let fireInstr = document.createElement("p");
  let fireResult = document.createElement("p");
  fireInstr.setAttribute('id', player + '_fire_instr');
  fireInstr.textContent = '';
  fireResult.setAttribute('id', player + '_fire_result');
  fireResult.setAttribute('class', 'fire_result');
  fireResult.textContent = '';
  document.getElementById(player + '_instructions').appendChild(fireInstr);
  document.getElementById('Player' + playerNumber).appendChild(fireResult);

  var y = document.getElementsByTagName("caption");
  y[playerNumber-1].innerHTML = 'Attack Player ' + playerNumber + ' Using This Grid';
}

function makePlacementInstructions(player){

  let activePlInstr = element(player + "_instructions");
  let passivePlayer = (player === 'p1') ? 'p2' : 'p1';
  let passivePlInstr = element(passivePlayer + "_instructions");
  let positionInstr = document.createElement("p");

  positionInstr.setAttribute('id', player + '_text');
  positionInstr.textContent = createPlacementText(player, 0);
  activePlInstr.appendChild(positionInstr);
  let vertCheckBox = document.createElement("input");
  vertCheckBox.setAttribute('type','checkbox');
  vertCheckBox.setAttribute('name','vertical_' + player);
  vertCheckBox.setAttribute('id','vertical_' + player);
  activePlInstr.appendChild(vertCheckBox);
  let vertLabel = document.createElement("label");
  vertLabel.setAttribute('for','vertical_' + player);
  vertLabel.textContent = 'Place Vertically';
  activePlInstr.appendChild(vertLabel);

  let waitInstr = document.createElement("p");
  waitInstr.setAttribute('id', passivePlayer + '_text');
  waitInstr.textContent = 'Wait for player ' + player;
  passivePlInstr.appendChild(waitInstr);
}

function removePlacementInstructions(player) {
  let passivePlayer = player === 'p1' ? 'p2' : 'p1';
  var child = document.getElementById(player + '_text');
  child.parentNode.removeChild(child);
  child = document.getElementById(passivePlayer + '_text');
  child.parentNode.removeChild(child);
  child = document.getElementsByTagName('label')[0];
  child.parentNode.removeChild(child);
  child = document.getElementById('vertical_' + player);
  child.parentNode.removeChild(child);
}

function clearShipsFromGrid(player) {
  let shipsArray = model.ships[player];
  for (let i = 0; i < shipsArray.length; i++) {
    let oneShipsPos = shipsArray[i]['location'];
    for (j = 0; j < oneShipsPos.length; j++) {
      document.getElementById(player + '-' + oneShipsPos[j]).innerHTML = ' ';
    }
  }
}

function gameClickHandler(event) {

  if (model.state === 'P1_Position') {
    // ********************************************************************
    //                        Place ships on Player 1 Grid
    // ********************************************************************
    let isVertical = document.getElementById("vertical_p1").checked;
    if (event.target.id.search(/\bp1\-\d{1,}\-\d{1,}/) > -1) {
      // player gave coordinates for placing ship
      placeShip('p1', event.target.id.split('-').slice(1), isVertical);
    } else {
      console.log("Not a valid click: ", event.target);
    }
  } else if (model.state === 'Transition_To_p2') {
    removePlacementInstructions('p1');
    clearShipsFromGrid('p1');
    makePlacementInstructions('p2')
    model.state = 'P2_Position';

  } else if (model.state === 'P2_Position') {
    // ********************************************************************
    //                        Place ships on Player 2 Grid
    // ********************************************************************
    let isVertical = document.getElementById("vertical_p2").checked;
    if (event.target.id.search(/\bp2\-\d{1,}\-\d{1,}/) > -1) {
      // player gave coordinates for placing ship
      placeShip('p2', event.target.id.split('-').slice(1), isVertical);
    } else {
      console.log("Not a valid click: ", event.target);
    }
  } else if (model.state === 'Transition_To_P1_Go') {
    removePlacementInstructions('p2');
    clearShipsFromGrid('p2');
    setUpFireInstructions('p1');
    setUpFireInstructions('p2');
    writeFireInstructions('p1');
    model.state = 'P1_Go';
    // model.ships['p1'].forEach((x,idx) => {
    //   console.log('p1 ship no.', idx + 1, x);
    // });
    // model.ships['p2'].forEach((x,idx) => {
    //   console.log('p2 ship no.', idx + 1, x);
    // });
   
  } else if (model.state === 'P1_Go') {
    // ********************************************************************
    //                        Player 1 takes a shot 
    // ********************************************************************
    if (event.target.id.search(/\bp1\-\d{1,}\-\d{1,}/) > -1) {
      fire(event.target.id);
    } else {
      console.log("Not a valid shot: ", event.target);
    }
  } else if (model.state === 'P2_Go') {
    // ********************************************************************
    //                        Player 2 takes a shot 
    // ********************************************************************
    if (event.target.id.search(/\bp2\-\d{1,}\-\d{1,}/) > -1) {
      fire(event.target.id);
    } else {
      console.log("Not a valid shot: : ", event.target);
    }
  } else if (model.state === 'Game Over') {
    // ********************************************************************
    //                        WIN - GAME OVER 
    // ********************************************************************
    console.log('GAME OVER');
  }
}

function init() {
  generateShips(model);
  let Grid1 = buildAnOceanGrid('Grid1', 'Player 1 Grid', 'p1');
  document.getElementById('Player1').appendChild(Grid1);
  let Grid2 = buildAnOceanGrid('Grid2', 'Player 2 Grid', 'p2');
  document.getElementById('Player2').appendChild(Grid2);
  makePlacementInstructions('p1');
  document.getElementById('GameCenter').onclick = gameClickHandler;
};

window.onload = init;

