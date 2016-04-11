const initialState = {
    "energy": {
        "limits": [
            0,
            1000,
            0.1
        ],
        "name": "energy",
        "value": "0"
    },
    "resolution": {
        "limits": [
            0,
            1000,
            0.1
        ],
        "name": "resolution",
        "value": "0"
    },
    "transmission": {
        "limits": [
            0,
            1000,
            0.1
        ],
        "name": "transmission",
        "value": "0"
    }
}

export default (state=initialState, action) => {
    switch (action.type) {
    case "SET_BEAMLINE_PROPERTIES":
        {
            return Object.assign({}, state, action.data);
        }
    case "SET_BEAMLINE_PROPERTY":
        {
            var data = {};
            data[action.data.name] = {"name":action.data.name, 
                                      "value": action.data.value};
            return Object.assign({}, state, data);
        }
    default:
        return state;
    }
}