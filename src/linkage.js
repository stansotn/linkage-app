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
                        possible_moves.push(JSON.parse(JSON.stringify(candidate_move)));
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
                        possible_moves.push(JSON.parse(JSON.stringify(candidate_move)));
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

// Get Pseudo random integer between two numbers.
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
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

			if(gameboard_visited[i][j] === false && gameboard_tile !== null && gameboard_tile !== gameboard_state.length){

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
	return num_of_groups - 1; //Center tile will count as a group.
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
            field[1] < 0 || field[1] >= gameboard_state.length){
            
            return false;
        }
        // Check if the space is empty.
        if(gameboard_state[field[0]][field[1]] != null){
            
            return false;
        }  
    }

	return true;
}
export function computerMove(side, gameboard_state, previous_move, colorpieces) {
    
	var valid_candidate_moves = explorePossibleMoves(gameboard_state, previous_move, colorpieces);

    rankValidMoves(valid_candidate_moves, gameboard_state, colorpieces, 'More');
	
	if(valid_candidate_moves.length === 0){
		//std::cout<<"Computer skips a turn!"<<std::endl;
        //clear_previous_move();
        return null;
	}
	
    // Find moves with minimum rank.
    var optimal_rank = valid_candidate_moves[0].rank;

    for(const candidate_move of valid_candidate_moves){
        
        if(side === 'More' && candidate_move.rank > optimal_rank){

            optimal_rank = candidate_move.rank;
        }
        else if(side === 'Less' && candidate_move.rank < optimal_rank){

            optimal_rank = candidate_move.rank;
        }     
    }

    // Pick moves with minimum rank.
    var optimal_moves = [];

    for(const candidate_move of valid_candidate_moves){

        if(candidate_move.rank === optimal_rank)
            optimal_moves.push(JSON.parse(JSON.stringify(candidate_move)));
    }

    return optimal_moves[getRandomInt(0, optimal_moves.length)];

} /* needs to be written */

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

//! place_on_gameboard method.
/**
 *  @brief Places a move on the given &gameboard. Does not check if the move is valid.
 *  @param move Move to be placed.
 *  @param gameboard Gameboard to place the move.
 */
export function placeOnGameboard(move, gameboard){

	gameboard[move.fields[0][0]][move.fields[0][1]] = move.color;
	gameboard[move.fields[1][0]][move.fields[1][1]] = move.color;
}

//! rank_valid_moves method
/**
 *  @brief Assign rank to each given move.
 *  @param candidate_moves VALID moves to rank.
 */
export function rankValidMoves(candidate_moves, gameboard_state, colorpieces, computer_side){

	for(var candidate_move of candidate_moves){

		// Copy current gameboard state.
		var gameboard_projection = JSON.parse(JSON.stringify(gameboard_state));

		// Make the candidate move on the projected gameboard.
		placeOnGameboard(candidate_move, gameboard_projection);
		
		// Calculate the amount of possible moves of the next ply.
		
		candidate_move.rank = 0.01 * explorePossibleMoves(gameboard_projection, candidate_move, colorpieces).length;
		//candidate_move.rank = std::roundf(candidate_move.rank*10)/10; // Ads non linear randomness and hides a bug=)
		// Find number of groups on the projected gameboard.
		const groups_after_candidate_move = groupCount(gameboard_projection);
		//std::cout<<groups_after_candidate_move<<std::endl;
		candidate_move.rank += 20.0 * groups_after_candidate_move;

		// Fight for the last piece!
		if(colorpieces[candidate_move.color] === 1){

			if(computer_side === 'More')
				candidate_move.rank += 10;
			else
				candidate_move.rank -=10;
		}
		
		// Let's check if we can connect the tiles in the further move.
		// Only makes sense to explore further moves if there are 2+ pieces available.
		if(colorpieces[candidate_move.color] > 2){

			var further_moves = [];
			
			var i = 0;
            var j = 0;
			
			for(let m=0; m<gameboard_state.length; m++){

                for(let n=0; n<gameboard_state.length; n++){

                    var further_candidate_move = JSON.parse(JSON.stringify(clearCandidateMove(gameboard_projection)));

					further_candidate_move.color = candidate_move.color;
					further_candidate_move.fields[0][0] = i;
					further_candidate_move.fields[0][1] = j;
					
					// Check horizontal placement.
					further_candidate_move.fields[1][0] = i;
					further_candidate_move.fields[1][1] = j + 1;

                    // Do not check for adjacency here.
					if(isPlacementValid(further_candidate_move, gameboard_projection)){
                        
                        further_moves.push(JSON.parse(JSON.stringify(further_candidate_move)));
                    }

					// Check vertical placement.
					further_candidate_move.fields[1][0] = i + 1;
					further_candidate_move.fields[1][1] = j;

					// Do not check for adjacency here.
					if(isPlacementValid(further_candidate_move, gameboard_projection)){

                        further_moves.push(JSON.parse(JSON.stringify(further_candidate_move)));
                    }
					j++;
				}
				j = 0;
				i++;
            }
            
			// Find options of the candidate move to make more ways for group creation -- group forming moves.	
			var groupforming_options = 0;
            
			//For each of the further moves find if any new groups can be formed.
			for(const further_move of further_moves){
                
				var gameboard_projection_2 = JSON.parse(JSON.stringify(gameboard_projection));
                
				placeOnGameboard(further_move, gameboard_projection_2);
				
				// Count how many new groups can be formed.
				if(groupCount(gameboard_projection_2) < groups_after_candidate_move){
                    ++groupforming_options;
                }
                gameboard_projection_2 = null;
			}
			//candidate_move.rank += num_of_possible_moves(gameboard_projection_2, further_move);
			
			// Modify candidate move accordingly
			candidate_move.rank -= 5.0 * groupforming_options;
		}
	}
}
