const initialState = {
    energy: {
        limits: [
            0,
            1000,
            0.1
        ],
        name: "energy",
        value: "0",
        status: "IDLE",
        msg: ""
    }, 
    resolution: {
        limits: [
            0,
            1000,
            0.1
        ],
        name: "resolution",
        value: "0",
        status: "IDLE",
        msg: ""
    },
    transmission: {
        limits: [
            0,
            1000,
            0.1
        ],
        name: "transmission",
        value: "0",
        status: "IDLE",
        msg: ""
    }
}

export default (state=initialState, action) => {
    switch (action.type) {
    case "SET_BEAMLINE_PROPERTIES":{
        return Object.assign({}, state, action.data);
    }
    case "SET_BEAMLINE_PROPERTY":{
        var data = {};
        data[action.data.name] = {name: action.data.name, 
                                  value: action.data.value,
                                  status: action.data.status,
                                  msg: action.data.msg};

        return Object.assign({}, state, data);
    }
    case "SET_BUSY_STATE":{
        data = Object.assign({}, state);
        data[action.data.name].status = action.data.status;

        return data;
    }
    default:
        return state;
    }
}