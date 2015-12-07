import fetch from 'isomorphic-fetch'

export function addSample(id) {
    return { 
    	type: "ADD_SAMPLE", 
    	id: id
    }
}

export function removeSample(id) {
    return { 
      type: "REMOVE_SAMPLE", 
      id: id
    }
}


