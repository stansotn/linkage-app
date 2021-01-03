/**
 *  @file linkage.js
 *  
 *  @author Stanislav Sotnikov
 * 	
 *  stanislav.sotnikov145@gmail.som
 */

export function clearCandidateMove(gameboard_state){

    const fake_field = [gameboard_state.length + 2, gameboard_state[0].length + 2]; 

    const candidate_move = {
        fields: [fake_field, fake_field],
        color: 0,
    };
    
    return candidate_move;
}

 //! explore_possible_moves method.
/**
 *  @brief Explore all posible moves at the given gameboard_state.
 *  
 *  @param gameboard_state Gameboard state to be checked.
 *  @return possible_moves Vector to store possible moves.
 */
export function explorePossibleMoves(gameboard_state, previous_move, colorpieces){

	// Find all possible ways to attach to a corner of the previous played piece.
	// There are 8 possible ways to attach at most we need to find one with more exposed edges.

    var possible_moves = [];
	var i = 0;
	var j = 0;

	for(let m=0; m<gameboard_state.length; m++){

		for(let n=0; n<gameboard_state.length; n++){

			var candidate_move = {

                fields: [[null, null],[null, null]],
                color: null,
            };
            
			candidate_move.fields[0][0] = i;
			candidate_move.fields[0][1] = j;
			
			// Check horizontal placement.
			candidate_move.fields[1][0] = i;
            candidate_move.fields[1][1] = j + 1;

			if(isPlacementValid(candidate_move, gameboard_state) && isAdjacencySatisfied(candidate_move, previous_move)){
                
                for(const [key, value] of Object.entries(colorpieces)){
                    
                    if(value > 0){
                        
                        candidate_move.color = key;
                        possible_moves.push(candidate_move);
                    }
                }		
			}
			
			// Check vertical placement.
			candidate_move.fields[1][0] = i + 1;
			candidate_move.fields[1][1] = j;

			if(isPlacementValid(candidate_move, gameboard_state) && isAdjacencySatisfied(candidate_move, previous_move)){

				for(const [key, value] of Object.entries(colorpieces)){

                    if(value > 0){
                        candidate_move.color = key;
                        possible_moves.push(candidate_move);
                    }
                }		
			}
			j++;
		}

		j = 0;
		i++;
    }
    
    return possible_moves;
}

//! group_count function.
/**
 *  @brief Count the number of groups at the given gameboard_state.
 *  @param gameboard_state Gameboard state to be checked.
 *  @return Number of groups.
 */
export function groupCount(gameboard_state){

    //std::array<std::array<bool, 7>, 7> gameboard_visited;
    // Fill gameboard_visited with zeros.
    var gameboard_visited = Array.from(Array(gameboard_state.length), () => new Array(gameboard_state.length).fill(false));

    //std::stack<std::pair<int, int> > tile_stack;
    var tile_stack = [];

	var i = 0;
	var j = 0;
	var num_of_groups = 0;
	
	// Depth First Search to count tile groups.
	for(const gameboard_row of gameboard_state){

		for(const gameboard_tile of gameboard_row){

			if(gameboard_visited[i][j] === false && gameboard_tile !== 0 && gameboard_tile !== gameboard_state.length){

				// Valid piece not counted before.
				tile_stack.push([i,j]);

				const group_color = gameboard_tile;
				
				// Found a new group.
				++num_of_groups;
				
				while(tile_stack.length !== 0){

					const tile_node = tile_stack.pop();

					// Check tile to the right (next column).
					if(tile_node[1] < gameboard_row.length - 1){

						if(gameboard_state[tile_node[0]][tile_node[1] + 1] === group_color &&
							gameboard_visited[tile_node[0]][tile_node[1] + 1] === false)

							tile_stack.push([tile_node[0], tile_node[1] + 1]);
					}

					// Check tile to the left (previous column).
					if(tile_node[1] > 0){

						if(gameboard_state[tile_node[0]][tile_node[1] - 1] === group_color &&
							gameboard_visited[tile_node[0]][tile_node[1] - 1] === false)

							tile_stack.push([tile_node[0], tile_node[1] - 1]);
					}

					// Check tile below (next row).
					if(tile_node[0] < gameboard_state.length - 1){

						if(gameboard_state[tile_node[0] + 1][tile_node[1]] === group_color &&
							gameboard_visited[tile_node[0] + 1][tile_node[1]] === false)

							tile_stack.push([tile_node[0] + 1, tile_node[1]]);
					}

					// Check tile above (previous row).
					if(tile_node[0] > 0){

						if(gameboard_state[tile_node[0] - 1][tile_node[1]] === group_color &&
							gameboard_visited[tile_node[0] - 1][tile_node[1]] === false)

							tile_stack.push([tile_node[0] - 1, tile_node[1]]);
					}

					// Mark tile as visited.
					gameboard_visited[tile_node[0]][tile_node[1]] = true;
				}
			}
			++j;
		}
		j=0;
		++i;
	}
	return num_of_groups;
}

export function isGamEnded(gameboard_state) { 
	
	var i = 0;
	var j = 0;

	// Check if there is a possible move for each emty space found in gameboard.
	for(const gameboard_row of gameboard_state){
        
		for(const gameboard_tile of gameboard_row){
            
			if(gameboard_tile == null){

				// Found empty space. 
				// Check if the tiles down && to the right are also empty.
				if(i < gameboard_state.length - 1){

					if(gameboard_state[i+1][j] == null){
                        
                        return false;
                    }
				}
					
				if(j < gameboard_row.length - 1){

					if(gameboard_state[i][j+1] == null){
                        
                        return false;
                    }	
				}
			}
			++j;
		}
		j=0;
		++i;
	}

	return true; 
}

//! is_placement_valid function.
/**
 *	@brief	Check if a given tile satisfies geometric constraints.
 *			Does not check the adjacency rule.
 *	@param	candidate_move A pair of coordinates [[i,j], [i,j]]
 *	@param	gameboard_state State of the gameboard to check against.
 *	@return True if the move is valid, false otherwise.
 */ 
// Warning: this function does not check for adjacency with the previous move. 
export function isPlacementValid(candidate_move, gameboard_state){

	// Check if given fields form a tile.
	if(! (((candidate_move.fields[0][0] === candidate_move.fields[1][0] + 1 || 
		candidate_move.fields[0][0] === candidate_move.fields[1][0] - 1) && 
		candidate_move.fields[0][1] === candidate_move.fields[1][1]) ||
		
		((candidate_move.fields[0][1] === candidate_move.fields[1][1] + 1 || 
		candidate_move.fields[0][1] === candidate_move.fields[1][1] - 1) && 
		candidate_move.fields[0][0] === candidate_move.fields[1][0]))){

        //std::cout<<"Fields don't form a valid tile."<<std::endl;
        return false;
	}

    for(const field of candidate_move.fields){

        if(field[0] < 0 || field[0] >= gameboard_state.length ||
            field[1] < 0 || field[1] >= gameboard_state[0].length){
            
            return false;
        }
        // Check if the space is empty.
        if(gameboard_state[field[0]][field[1]] != null){
            
            return false;
        }  
    }

	return true;
}

//! is_adjacency_satisfied function.
/**
 *  @brief Checks if the given move satisfies the adjacecy rule.
 *  @param candidate_move Move to be checked.
 *  @param previous_move Move to check adjacency rule against.
 * 	@return True if adjacency is satisfied, flase otherwise.
 */
export function isAdjacencySatisfied(candidate_move, previous_move){

    
    if(previous_move.color == null){

        return true;
    }
    for(const field of candidate_move.fields){

        // Check row adjacency for each field.
		if(((field[0] === previous_move.fields[0][0] + 1 ||
			field[0] === previous_move.fields[0][0] - 1) && 
			field[1] === previous_move.fields[0][1]) ||

			((field[0] === previous_move.fields[1][0] + 1 ||
			field[0] === previous_move.fields[1][0] - 1) &&
			field[1] === previous_move.fields[1][1])){

            return false;
        }

		// Check column adjacency for each field.
		if(((field[1] === previous_move.fields[0][1] + 1 ||
			field[1] === previous_move.fields[0][1] - 1) &&
			field[0] === previous_move.fields[0][0]) ||

			((field[1] === previous_move.fields[1][1] + 1 ||
			field[1] === previous_move.fields[1][1] - 1) &&
			field[0] === previous_move.fields[1][0])){
            
            return false;
        }
    }

	return true;
}
