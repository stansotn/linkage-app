import React from 'react';
import ReactDOM from 'react-dom';
import Switch from '@material-ui/core/Switch';

import './index.css';
import * as linkage from './linkage.js';

const board_size = 7;

function Square(props){

  const colormap = {
    null: 'gainsboro',
    'C': 'grey',
    'W': 'white',
    'Y': 'yellow',
    'R': 'red',
    'B': 'blue',
    'X': 'black',
    'O': 'white',
  };

  const style = {
    background: colormap[props.color],
  }

  const selected_style = {
    border: (props.selected != null) ? '2px solid ' + colormap[props.selected] : '2px solid transparent',
  }

  const selected_div = (<div className="selected-square" style={selected_style}></div>);

  return (<button className="square" onClick={props.onClick} style={style} >{selected_div}</button>);

}

class Board extends React.Component {

  constructor(props){
    super(props);

    var squares = Array.from(Array(board_size), () => new Array(board_size).fill(null));
    squares[(board_size - 1)/2][(board_size - 1)/2] = 'C';

    this.state = {
      gameboard: squares,
      colorpieces: {
        'W': 6,
        'Y': 6,
        'R': 6,
        'B': 6,
      },
      move_stage: {
        selected_color: null,
        placement: {
            i: null,
            j: null,
          }, 
      },
      previous_move: {
        fields: [[null, null],[null, null]],
        color: null,
      },
      more_is_next: true,
      game_mode: false, // is_single_player
      computer_side: false, // is_computer_playing_for_more
      winner: null,
      turn_skipped: false,
      player_skips: false,
      computer_skips: false,
    };
  }

  // Click on the colorpicker: @param i represents color.
  // Click on the gameboard: @param i, j represent location.
  handleClick(i, j){

    if(this.state.winner == null && j !== undefined){

      if(this.state.gameboard[i][j] === 'C'){
        // Do nothing if the blocked tile is clicked.
        return;
      }
      // Check if clicked space is empty.
      if(this.state.gameboard[i][j] == null){

        if(this.state.move_stage.placement.i == null){
          this.setState({
            move_stage: {
              selected_color: this.state.move_stage.selected_color,
              placement: {
                i: i,
                j: j,
              },
            },
          }); 
        }
        else{
          
          // puke
          var candidate_move = JSON.parse(JSON.stringify(this.state.previous_move));
          const previous_move = JSON.parse(JSON.stringify(this.state.previous_move));

          candidate_move.fields = [[this.state.move_stage.placement.i, this.state.move_stage.placement.j], [i, j]];
          candidate_move.color = this.state.move_stage.selected_color;

          if(linkage.isPlacementValid(candidate_move, this.state.gameboard) && linkage.isAdjacencySatisfied(candidate_move, previous_move)){

            this.playerMove(candidate_move);
          }
          else{

            console.log('Placement invalid!');
          }
          this.resetMoveStage();
        }
      }
    }
    // Colorpicker clicked.
    else if(j === undefined && this.state.colorpieces[i] > 0){
        
      this.setState({
        move_stage: {
          selected_color: i,
          placement: {
              i: null,
              j: null,
            }, 
        },
      });
    }
  }

  resetMoveStage(){
    this.setState({
      move_stage: {
        selected_color: null,
        placement: {
            i: null,
            j: null,
          }, 
      },
    });
  }
  renderColorpickerSquare(color){

    return (
      <Square 
        color={color}
        selected={(this.state.move_stage.selected_color === color) ? 'X' : null}
        onClick={() => this.handleClick(color)}
      />
    );
  }
  renderGameModeSwitches(){

    const bold = {
      'font-weight': 'bold',
      'color': 'black',
    }
    const normal = {
      'font-weight': 'normal',
      'color': 'black',
    }
    const disabled = {
      'font-weight': 'normal',
      'color': 'grey',
    }
    const is_single_player = this.state.game_mode;
    const computer_side = this.state.computer_side ? 'More' : 'Less';
    
      
    const handleChange = (event) => {
      
      this.setState({
        [event.target.name]: event.target.checked,
        move_stage: {
          selected_color: null,
          placement: {
              i: null,
              j: null,
            },
        },
      });

      // Figure out if Computer must make a move.
      if(event.target.name === 'game_mode'){

        if(event.target.checked){

          // Force change the state. Does not affect the UI.
          this.state.game_mode = true;
          if(!((computer_side === 'More') !== this.state.more_is_next)){
            // Make More move
            this.computerMoveRecursive(JSON.parse(JSON.stringify(this.state)));
          }
        }
        else{
          this.state.game_mode = false;
        }
      }
      else if(event.target.name === 'computer_side'){

        this.state.computer_side = event.target.checked;
        
        if(!(event.target.checked !== this.state.more_is_next)){

          this.computerMoveRecursive(JSON.parse(JSON.stringify(this.state)));
        }
      }
    };

    return (
      <div className="switch-box">

        <div className="game-mode" className="game-mode-left">
          <p className="game-mode" style={is_single_player ? normal : bold}>Two Player</p>
            <Switch name="game_mode" disabled={this.state.winner != null} color="grey" onChange={handleChange}/>
          <p className="game-mode" style={is_single_player ? bold : normal}>Single Player</p>
        </div>

        <div className="game-mode" className="game-mode-right">
          <p className="game-mode" style={is_single_player ? (computer_side === 'Less' ? bold : normal) : disabled}>More</p>
            <Switch name="computer_side" disabled={!is_single_player || this.state.winner != null} color="grey" onChange={handleChange} />
          <p className="game-mode" style={is_single_player ? (computer_side === 'More' ? bold : normal) : disabled}>Less</p>
        </div>
      </div>
    );
  }

  computerMoveRecursive(game_state){

    // Sainity check.
    if(!this.state.game_mode){
      return null;
    }
    // Copy entire gameboard state
    const computer_side = this.state.computer_side ? 'More' : 'Less';

    var more_is_next = game_state.more_is_next;
    var game_ended = false;

    while(more_is_next === game_state.more_is_next && !game_ended){

      console.log('Hello');
      // Find a move
      var computer_move = linkage.computerMove(computer_side, game_state.gameboard, game_state.previous_move, game_state.colorpieces);

      // Place the move on the copied gameboard state.
      linkage.placeOnGameboard(computer_move, game_state.gameboard);

      // Adjust quantity of the colorpieces.
      game_state.colorpieces[computer_move.color] -= 1;

      // Check if there are moves left and if the game is ended.
      const possible_moves = linkage.explorePossibleMoves(game_state.gameboard, computer_move, game_state.colorpieces);
      game_ended = linkage.isGamEnded(game_state.gameboard);

      if(!game_ended && possible_moves.length === 0){

        game_state.previous_move = linkage.clearCandidateMove(game_state.gameboard);
        game_state.player_skips = true;
      }
      else if(game_ended){

        const group_count = linkage.groupCount(game_state.gameboard);
        game_state.winner = (group_count < 12) ? 'Less' : 'More';
      }
      else{
        
        game_state.more_is_next = !game_state.more_is_next;
        game_state.previous_move = computer_move;
      }

      this.setState(game_state); 
    }
  }

  playerMove(player_move){

    var game_state = JSON.parse(JSON.stringify(this.state));

    game_state.player_skips = false;

    linkage.placeOnGameboard(player_move, game_state.gameboard);

    // Adjust quantity of the colorpieces.
    game_state.colorpieces[player_move.color] -= 1;

    // Check if there are moves left and if the game is ended.
    const possible_moves = linkage.explorePossibleMoves(game_state.gameboard, player_move, game_state.colorpieces);
    var game_ended = linkage.isGamEnded(game_state.gameboard);

    if(!game_ended && possible_moves.length === 0){

      game_state.previous_move = linkage.clearCandidateMove(game_state.gameboard);
      game_state.computer_skips = game_state.game_mode; // Computer skips if single player mode
    }
    else if(game_ended){

      const group_count = linkage.groupCount(game_state.gameboard);
      game_state.winner = (group_count < 12) ? 'Less' : 'More';
    }
    else{
        
      game_state.more_is_next = !game_state.more_is_next;
      game_state.previous_move = player_move;

      if(game_state.game_mode){

        this.computerMoveRecursive(game_state);
      }
    }
    this.setState(game_state); 
  }

  renderGameboardSquare(i, j){

    // Click on the colorpicker: @param i represents color.
    // Click on the gameboard: @param i, j represent location.
    var selected = null;

    if(this.state.move_stage.placement.i === i && this.state.move_stage.placement.j === j){

      selected = this.state.move_stage.selected_color;
    }

    return (
      <Square 
        color={this.state.gameboard[i][j]}
        selected={selected}
        onClick={() => this.handleClick(i, j)}
      />
    );
  }

  render() {

    let status = "";
    
    const is_single_player = this.state.game_mode;
    const computer_side = this.state.computer_side ? 'More' : 'Less';

    if(this.state.winner == null){

      if(!is_single_player){

        if(this.state.turn_skipped){

          status = 'Player ' + (this.state.more_is_next ? 'More' : 'Less') + ' goes again!';
        }
        else{
  
          status = 'Next Player: ' + (this.state.more_is_next ? 'More' : 'Less');
        }
      }
      else{
        status = "Computer plays for " + computer_side + ". ";

        if(this.state.computer_skips){

          status += "Player goes again!"
        }
        if(this.state.player_skips){

          status += "Player skips a turn(s)."
        }
      }
      
    }
    else{

      const groups = linkage.groupCount(this.state.gameboard);

      if(!is_single_player){
        status = 'Player ' + this.state.winner + ' wins! ';
      }
      else{

        if(groups < 12){
          if(computer_side === 'Less'){
            status = 'Computer wins for Less! ';
          }
          else{
            status = 'Player ' + this.state.winner + ' wins! ';
          }
        }
        else{
          if(computer_side === 'More'){
            status = 'Computer wins for More! ';
          }
          else{
            status = 'Player ' + this.state.winner + ' wins! ';
          }
        } 
      }
      status += 'Number of groups: ' + groups;
    }

    var gameboard_render = [];
    for(let i=0; i<board_size; i++){
      
      var content_row = [];
      for(let j=0; j<board_size; j++){

        content_row.push(this.renderGameboardSquare(i,j));
      }

      gameboard_render.push(<div className="board-row">{content_row}</div>)
    }

    return (
      <div>
        <div className="status">{status}</div>
        <div className="game-board">{gameboard_render}</div>
        
        <div className="colorpicker">
          {this.state.colorpieces['Y'] ? this.renderColorpickerSquare('Y') : this.renderColorpickerSquare('C')}
          {this.state.colorpieces['Y'] ? this.renderColorpickerSquare('Y') : this.renderColorpickerSquare('C')}
        </div>
        <div className="colorpicker">
          {this.state.colorpieces['W'] ? this.renderColorpickerSquare('W') : this.renderColorpickerSquare('C')}
          {this.state.colorpieces['W'] ? this.renderColorpickerSquare('W') : this.renderColorpickerSquare('C')}
        </div>
        <div className="colorpicker">
          {this.state.colorpieces['R'] ? this.renderColorpickerSquare('R') : this.renderColorpickerSquare('C')}
          {this.state.colorpieces['R'] ? this.renderColorpickerSquare('R') : this.renderColorpickerSquare('C')}
        </div>
        <div className="colorpicker">
        {this.state.colorpieces['B'] ? this.renderColorpickerSquare('B') : this.renderColorpickerSquare('C')}
          {this.state.colorpieces['B'] ? this.renderColorpickerSquare('B') : this.renderColorpickerSquare('C')}
        </div>
        {this.renderGameModeSwitches()}
        
      </div>
    );
  }
}

class Game extends React.Component {
  render() {
    return (
      <div className="game">
          <Board />
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);


