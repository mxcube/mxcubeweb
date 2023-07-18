const INITIAL_STATE = {
  contents: {},
  state: 'READY',
  loadedSample: {},
  plateGrid: [
    {
      name: 'Crystal Direct',
      wellHeight: 25,
      wellWidth: 25,
      dropHeight: 35,
      dropWidth: 35,
      rowTitle: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      colTitle: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      numOfdrops: [1, 2, 3],
      type: 'square',
      title: '96 Deep Well Plate',
      wellOption: [{ color: '#eeeeee' }, { color: '#e0e0e0' }],
      rotation: 0,
      welladjustWidth: 0,
    },
    {
      name: 'Crystal QuickX',
      wellHeight: 25,
      wellWidth: 25,
      dropHeight: 35,
      dropWidth: 35,
      rowTitle: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      colTitle: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      numOfdrops: [1, 2],
      type: 'square',
      title: '96 Deep Well Plate',
      wellOption: [{ color: '#eeeeee' }, { color: '#e0e0e0' }],
      rotation: 0,
      welladjustWidth: 0,
    },
    {
      name: 'Mitegen InSitu-1',
      wellHeight: 25,
      wellWidth: 25,
      dropHeight: 35,
      dropWidth: 35,
      rowTitle: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      colTitle: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      numOfdrops: [1, 2, 3],
      type: 'square',
      title: '96 Deep Well Plate',
      wellOption: [{ color: '#eeeeee' }, { color: '#e0e0e0' }],
      rotation: -90,
      welladjustWidth: 10,
    },
    {
      name: 'Greiner Impact 1536',
      wellHeight: 25,
      wellWidth: 25,
      dropHeight: 35,
      dropWidth: 35,
      rowTitle: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      colTitle: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      numOfdrops: [1],
      type: 'square',
      title: '96 Deep Well Plate',
      wellOption: [{ color: '#eeeeee' }],
      rotation: 0,
      welladjustWidth: 0,
    },
    {
      name: 'ChipX',
      wellHeight: 130,
      wellWidth: 400,
      dropHeight: 20,
      dropWidth: 20,
      rowTitle: ['A', 'B'],
      colTitle: [1],
      numOfdrops: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      ],
      type: 'square',
      title: '96 Deep Well Plate',
      wellOption: [{ color: '#eeeeee' }],
      rotation: 0,
      welladjustWidth: 0,
    },
  ],
  currentPlateIndex: 4,
  selectedRow: null,
  selectedCol: null,
  selectedDrop: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'SET_SC_CONTENTS': {
      return { ...state, contents: action.data.sampleChangerContents };
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        state: action.data.sampleChangerState.state,
        contents: action.data.sampleChangerContents,
        loadedSample: action.data.loadedSample,
      };
    }
    case 'SET_LOADED_SAMPLE': {
      return {
        ...state,
        loadedSample: action.data,
      };
    }
    case 'SET_SC_STATE': {
      return { ...state, state: action.state };
    }
    case 'SET_SC_CURRENT_PLATE': {
      return { ...state, currentPlateIndex: action.plate_index };
    }
    case 'SET_SC_SELECTED_WELL': {
      return { ...state, selectedRow: action.row, selectedCol: action.col };
    }
    case 'SET_SC_SELECTED_DROP': {
      return { ...state, selectedDrop: action.drop_index };
    }
    case 'SET_SC_GLOBAL_STATE': {
      return {
        ...state,
        state: JSON.parse(action.data.state).state,
      };
    }
    default: {
      return state;
    }
  }
};
