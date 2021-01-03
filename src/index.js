import React from 'react';
import ReactDOM from 'react-dom';
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
      winner: null,
      game_ended: false,
      turn_skipped: false,
    };
  }

  // Click on gameboard or colorpicker.
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
          
          const squares = this.state.gameboard.slice();

          // puke
          var candidate_move = JSON.parse(JSON.stringify(this.state.previous_move));
          const previous_move = JSON.parse(JSON.stringify(this.state.previous_move));

          candidate_move.fields = [[this.state.move_stage.placement.i, this.state.move_stage.placement.j], [i, j]];
          candidate_move.color = this.state.move_stage.selected_color;

          if(linkage.isPlacementValid(candidate_move, squares) && linkage.isAdjacencySatisfied(candidate_move, previous_move)){

            squares[this.state.move_stage.placement.i][this.state.move_stage.placement.j] = this.state.move_stage.selected_color;
            squares[i][j] = this.state.move_stage.selected_color;
            
            const colorpieces = this.state.colorpieces;
            colorpieces[this.state.move_stage.selected_color] -= 1;

            // candidate move is the previous move in the following function call.
            const possible_moves = linkage.explorePossibleMoves(squares, candidate_move, this.state.colorpieces);

            const game_ended = linkage.isGamEnded(squares);
            var turn_skipped = false;
            var winner = null;

            if(!game_ended && possible_moves === 0){

              // Clear candidate move
              candidate_move = linkage.clearCandidateMove(squares);

              turn_skipped = true;
            }
            else if(game_ended){

              const group_count = linkage.groupCount(squares);
              winner = (group_count < 12) ? 'Less' : 'More';
              console.log('The winner is: ' + winner);
              console.log('Group count: ' + group_count);
            }

            console.log('Found ' + possible_moves.length + ' possible moves!');
            // Register a move.
            this.setState({
              gameboard: squares,
              colorpieces: colorpieces,
              more_is_next: turn_skipped ? this.state.more_is_next : !this.state.more_is_next,
              previous_move: candidate_move,
              turn_skipped: turn_skipped,
              game_ended: game_ended,
              winner: winner,
            });
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
  renderSquare(selected, i, j) {

    // Click on the colorpicker: @param i represents color.
    // Click on the gameboard: @param i, j represent location.
    const color = (j === undefined) ? i : this.state.gameboard[i][j];

    return (
      <Square 
        color={color}
        selected={selected}
        onClick={() => this.handleClick(i, j)}
      />
    );
  }
  renderColorpickerSquare(color){

    return (
      <Square 
        color={color}
        selected={(this.state.move_stage.selected_color == color) ? 'X' : null}
        onClick={() => this.handleClick(color)}
      />
    );
  }

  renderGameboardSquare(i, j){

    // Click on the colorpicker: @param i represents color.
    // Click on the gameboard: @param i, j represent location.
    var selected = null;

    if(this.state.move_stage.placement.i == i && this.state.move_stage.placement.j == j){

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

    if(this.state.winner == null){

      if(this.state.turn_skipped){

        status = 'Player ' + (this.state.more_is_next ? 'More' : 'Less') + ' goes again!';
      }
      else{

        status = 'Next Player: ' + (this.state.more_is_next ? 'More' : 'Less');
      }
    }
    else{

      status = 'Player ' + this.state.winner + ' wins!';
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


