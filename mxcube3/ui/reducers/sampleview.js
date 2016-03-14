import {omit} from 'lodash/object';
const initialState = {
  clickCentring: false,
  clickCentringPoints: [],
  zoom: 0,
  points: {},
  width: 0,
  height: 0,
  lightOn: false,
  motors: { Light: {}, Phi: {}, PhiY: {}, PhiZ: {}, Sampx: {}, Sampy: {}, Zoom: {} },
  pixelsPerMm: 0,
  imageRatio: 0,
  canvas: null,
  contextMenu: {show:false, shape: {type: "NONE"}, x: 0, y:0}
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'SET_ZOOM':
            {
             return {...state, zoom: action.level};
            }
        case 'START_CLICK_CENTRING':
            {
             return {...state, clickCentring: true};
            }
        case 'STOP_CLICK_CENTRING':
            {
             return {...state, clickCentring: false};
            }
        case 'SAVE_POINT':
            {
             return {...state, points: {...state.points, [action.point.posId] : action.point }};
            }
        case 'DELETE_POINT':
            {
             return {...state, points: omit(state.points, action.id)};
            }
        case 'SAVE_IMAGE_SIZE':
            {
             return {...state, width: action.width, height: action.height, pixelsPerMm: action.pixelsPerMm };
            }
        case 'SAVE_MOTOR_POSITIONS':
            {
             return {...state, motors: action.data, lightOn: action.data.BackLight.Status };
            }
        case 'SAVE_MOTOR_POSITION':
            {
             return {...state, motors: {...state.motors, [action.name] : {position: action.value}} };
            }
        case 'SET_LIGHT':
            {
             return {...state, lightOn: action.on };
            }
        case 'UPDATE_POINTS_POSITION':
            {
             return {...state, points: action.points };
            }
        case 'SHOW_CONTEXT_MENU':
            {
             return {...state, contextMenu: {show: action.show, shape: action.shape, x: action.x, y: action.y} };
            }
        case 'SET_IMAGE_RATIO':
            {
             return {...state, imageRatio: action.ratio };
            }
        case 'SET_CANVAS':
            {
             return {...state, canvas: action.canvas };
            }
        default:
            return state;
    }
}
