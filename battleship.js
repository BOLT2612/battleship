// battleship.js

const gridSize = 8;

var element = function(id){
  return document.getElementById(id);
};

var gameCenter = element('GameCenter');
var instructions = element("Instructions");
var player1 = element("Player1");
var player2 = element("Player2");
var p1_instruct = element("p1_instructions");
var p2_instruct = element("p2_instructions");
var grid1 = element("Grid1");
var grid2 = element("Grid2");

// model.ships.p1[0].location
var model = {
  gridSize: 8,
  numShips: 4,
  shipsLength: [4,3,3,2],
  state: 'P1_Position',     //P1_Position, 'Transition_To_p2', P2_Position, P1_Go, P2_Go, Game_Over

  ships: {
    // Player 1 ships
    p1: [
          { location: ['','','',''], hits: ['','','',''] },
          { location: ['','',''],    hits: ['','',''] },
          { location: ['','',''],    hits: ['','',''] },
          { location: ['',''],       hits: ['',''] },
        ],
    // Player 2 ships
    p2: [
          { location: ['','','',''], hits: ['','','',''] },
          { location: ['','',''],    hits: ['','',''] },
          { location: ['','',''],    hits: ['','',''] },
          { location: ['',''],       hits: ['',''] },
        ]
  },

  shots: {
    p1: [],
    p2: []
  }
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
  console.log('allShipsSunk()',  model.ships[player])
  return model.ships[player].reduce((pre, x) => pre && (x['hits'].indexOf('') === -1), true);
}

function markAsSunk(cellID, oneShip) {
  let prefix = cellID.slice(0,3);
  console.log('markAsSunk()', 'prefix =', prefix);
  oneShip.forEach((x) => {
    console.log(prefix + x)
    markCell(prefix + x, 'sunk');
  });
}


function markCell(cellID, result) {
  let currentCell = document.getElementById(cellID);
  currentCell.innerHTML = result.slice(0,1);
  currentCell.setAttribute("class", result);
}
          // model.fire('p1', event.target.id.slice(3));
          // hit, miss, already taken, sunk, win
//function fire(player, coordinates)
function fire(cellID) {
    let player;
    let victim;
  if (cellID.slice(0,3) === 'One') {
    player = 'p1';
    victim = 'p2';
  } else if (cellID.slice(0,3) === 'Two') {
    player = 'p2';
    victim = 'p1';
  } else {
    alert("Bad Cell ID " + cellID);
    return;
  }

  let coordinates = cellID.slice(3);

      console.log('DEBUG: model.shots', model.shots);
      console.log('DEBUG: player = ', player, 'coordinates = ', coordinates);
  // see if coordinate matches previous move
  if (model.shots[player].indexOf(coordinates) > -1) {      // ALREADY TAKEN
    alert("row " + coordinates.slice(0,1) + " column " + coordinates.slice(0,1) + " ALREADY TAKEN");
    writeFireResult(player, 'ALREADY TAKEN');
    return;
  } else {
    model.shots[player].push(coordinates)  // record grid position of shot
  }
  // check if coordinates match the location of any ship
  let shipsArray = model.ships[victim];
  //console.log('HIT CHECKING', coordinates);
  for (let i = 0; i < shipsArray.length; i++) {
    let oneShip = shipsArray[i];
    //console.log('ship number ',i,oneShip['location'])
    let shotResult = oneShip['location'].indexOf(coordinates);
    if (shotResult > -1) { 
    console.log("DEFINITE HIT: ship index", shotResult);                      // HIT
      oneShip['hits'][shotResult] = coordinates;
      if (oneShip['hits'].indexOf('') === -1) { // SUNK
        markAsSunk(cellID, oneShip['location']);
        writeFireResult(player, 'SUNK');
        if (allShipsSunk(victim)) {
          writeFireResult(player, 'WIN');          // WIN
          writeWinInstructions(player);
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
  //console.log(player + '_fire_instr');
  var x = document.getElementById(player + '_fire_instr');
  //console.log('writeWinInstructions()', x);
  document.getElementById(player + '_fire_instr').textContent = 'YOU ARE THE WINNER!';
  let passivePlayer = player === 'p1' ? 'p2' : 'p1';
  document.getElementById(passivePlayer + '_fire_instr').textContent = 'Game Over: All your ships are sunk :-(';

}

// All coordinates are "row" + "column"
// This would appear as y, x in the x,y coordinate world
// but this way works better for table data.

// row = Number.parseInt(coordinates.slice(0,1));
// column = Number.parseInt(coordinates.slice(1));

// the variable player should be 'p1' or 'p2'

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

  for (let j = 0; j < gridSize; j++){
    let x = document.createElement("th");
    x.innerHTML = j.toString();
    gameRow.appendChild(x);
  }
  gameTable.appendChild(gameRow);

  for (let i = 0; i < gridSize; i++) {
    let gameRow = document.createElement("tr");
    let x = document.createElement("th");
    x.innerHTML = i.toString();
    gameRow.appendChild(x);

    for (let j = 0; j < gridSize; j++){
      let x = document.createElement("td");
      x.innerHTML = ' ';
      x.setAttribute("id", gridPrefix + i.toString() + j.toString());
      gameRow.appendChild(x);
    }
    gameTable.appendChild(gameRow);
  }
  return gameTable;
}

function doesShipFit(coordinates, length, vertical) {
  if (vertical) {
    return ((Number.parseInt(coordinates.slice(0,1)) + length -1) > model.gridSize - 1) ? false : true;
  } else {
    console.log('doesShipFit',Number.parseInt(coordinates.slice(1)) + length -1, model.gridSize)
    return ((Number.parseInt(coordinates.slice(1)) + length -1) > model.gridSize - 1) ? false : true;
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
  console.log('function placeShip:'); 
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
  let row = Number.parseInt(coordinates.slice(0,1));
  let column = Number.parseInt(coordinates.slice(1));
  for (let i = 0; i < shipLength; i++){
    if (verticalShip) {
      tryPos.push( (row + i).toString() + column.toString() );
    } else {
      tryPos.push(row.toString() + (column + i).toString());
    }
  }
  console.log('row', row, 'column', column, 'tryPos ',tryPos);
  let shipOnShip = shipOverlap(player, tryPos);
  if (shipOnShip !== '') {
      alert("Invalid Position: coordinates " + shipOnShip + " overlap with placed ship");
    return;
  }
  model.ships[player][shipNum].location = tryPos;
  // update instructions on screen
  document.getElementById(player + '_text').innerHTML = createPlacementText(player, shipNum+1);
  model.ships[player][shipNum].location.forEach((x) => {
    let prefix = player === 'p1' ? 'One' : 'Two';
    document.getElementById(prefix + x).innerHTML = shipNum+1;
  })

  if (checkWhichShipLeft(player) === -1) {
    console.log("STATE CHANGE, model.state =", model.state);
    if (model.state === 'P1_Position') {
      model.state = 'Transition_To_p2';
    } else if (model.state === 'P2_Position') {
      model.state = 'Transition_To_P1_Go';
    }
  }
}

function checkWhichShipLeft(playerNum) {
  var retVal = model.ships[playerNum].reduce((pre, x, idx) => {
    if (pre === -1 && x.location[0] === '') return idx;
    else return pre;
  }, -1);
  return retVal;
}

function createPlacementText(player, shipIdx) {
  console.log('createPlacementText(): shipIdx',shipIdx);
  if (shipIdx > -1 && shipIdx < model.numShips) {
    let temp = model.numShips - shipIdx;
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
  console.log(player + '_fire_instr');
  var x = document.getElementById(player + '_fire_instr');
  console.log('writeFireInstructions()', x);
  document.getElementById(player + '_fire_instr').textContent = 'Use this grid to attack opponent: Click grid to fire';
  let passivePlayer = player === 'p1' ? 'p2' : 'p1';
  document.getElementById(passivePlayer + '_fire_instr').textContent = 'Please wait for player ' + player;
}

function setUpFireInstructions() {
  // this should be refactored but I need to submit this very soon
  let fireInstr1 = document.createElement("p");
  let fireResult1 = document.createElement("p");
  fireInstr1.setAttribute('id', 'p1_fire_instr');
  fireInstr1.textContent = '';
  fireResult1.setAttribute('id', 'p1_fire_result');
  fireResult1.setAttribute('class', 'fire_result');
  fireResult1.textContent = '';
  p1_instruct.appendChild(fireInstr1);
  document.getElementById('Player1').appendChild(fireResult1);

  
  let fireInstr2 = document.createElement("p");
  let fireResult2 = document.createElement("p");
  fireInstr2.setAttribute('id', 'p2_fire_instr');
  fireInstr2.textContent = '';
  fireResult2.setAttribute('id', 'p2_fire_result');
  fireResult2.setAttribute('class', 'fire_result');
  fireResult2.textContent = '';
  p2_instruct.appendChild(fireInstr2);
  document.getElementById('Player2').appendChild(fireResult2);

}

function makePlacementInstructions(player){
  let activePlInstr;
  let passivePlInstr;
  let passivePlayer;
  if (player === 'p1') {
    activePlInstr = p1_instruct;
    passivePlInstr = p2_instruct;
    passivePlayer = 'p2';
  } else {
    activePlInstr = p2_instruct;
    passivePlInstr = p1_instruct;
    passivePlayer = 'p1';
  }

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
  let prefix = player === 'p1' ? 'One' : 'Two';
  for (let i = 0; i < shipsArray.length; i++) {
    let oneShipsPos = shipsArray[i]['location'];
    for (j = 0; j < oneShipsPos.length; j++) {
      document.getElementById(prefix + oneShipsPos[j]).innerHTML = ' ';
    }
  }
}

function gameClickHandler(event) {

  if (model.state === 'P1_Position') {
    // ********************************************************************
    //                        Place ships on Player 1 Grid
    // ********************************************************************
    let isVertical = document.getElementById("vertical_p1").checked;
    if (event.target.id.search(/\bOne\d{2}/) > -1) {
      // player gave coordinates for placing ship
      console.log("Detected click on " + event.target.id);
      placeShip('p1', event.target.id.slice(3), isVertical);
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
    if (event.target.id.search(/\bTwo\d{2}/) > -1) {
      // player gave coordinates for placing ship
      //console.log("Detected click on " + event.target.id);
      placeShip('p2', event.target.id.slice(3), isVertical);
    } else {
      console.log("Not a valid click: ", event.target);
    }
  } else if (model.state === 'Transition_To_P1_Go') {
    removePlacementInstructions('p2');
    clearShipsFromGrid('p2');
    setUpFireInstructions();
    writeFireInstructions('p1');
    model.state = 'P1_Go';

  } else if (model.state === 'P1_Go') {
    // ********************************************************************
    //                        Player 1 takes a shot 
    // ********************************************************************
    if (event.target.id.search(/\bOne\d{2}/) > -1) {
      // player gave coordinates for placing ship
      //console.log("Detected click on " + event.target.id);
      fire(event.target.id);
    } else {
      console.log("Not a valid shot: ", event.target);
    }
  } else if (model.state === 'P2_Go') {
    // ********************************************************************
    //                        Player 2 takes a shot 
    // ********************************************************************
    if (event.target.id.search(/\bTwo\d{2}/) > -1) {
      // player gave coordinates for placing ship
      console.log("Detected click on " + event.target.id);
      fire(event.target.id);
    } else {
      console.log("Not a valid shot: : ", event.target);
    }
  } else if (model.state === 'Game Over') {
    console.log('GAME OVER');
  }
}

function init() {
  let Grid1 = buildAnOceanGrid('Grid1', 'Player 1 Grid', 'One');
  document.getElementById('Player1').appendChild(Grid1);
  let Grid2 = buildAnOceanGrid('Grid2', 'Player 2 Grid', 'Two');
  document.getElementById('Player2').appendChild(Grid2);
  makePlacementInstructions('p1');
  document.getElementById('GameCenter').onclick = gameClickHandler;
};

window.onload = init;

