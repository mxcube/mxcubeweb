import {omit} from 'lodash/object';
const initialState = {
  clickCentring: false,
  clickCentringPoints: [],
  zoom: 0,
  points: {},
  width: 0,
  height: 0,
  lightOn: {back: false, front: false},
  motorSteps: {
    FocusStep: 0.1, 
    PhiStep: 90, 
    PhiYStep: 0.1, 
    PhiZStep: 0.1, 
    SampXStep: 0.1, 
    SampYStep: 0.1, 
  },
  motors: {},
  pixelsPerMm: 0,
  imageRatio: 0,
  canvas: null,
  contextMenu: {show:false, shape: {type: "NONE"}, x: 0, y:0},
  apertureList: [],
  currentAperture: 0,
  currentPhase: ''
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'SET_ZOOM':
            {
                return {...state, zoom: action.level, pixelsPerMm: action.pixelsPerMm};
            }
        case 'START_CLICK_CENTRING':
            {
                return {...state, clickCentring: true, clickCentringPoints: []};
            }
        case 'STOP_CLICK_CENTRING':
            {
                return {...state, clickCentring: false, clickCentringPoints: []};
            }
        case 'ADD_CENTRING_POINT':
            {
                return (state.clickCentringPoints.length === 2 ? {...state, clickCentring: false, clickCentringPoints:[]} : {...state, clickCentringPoints: [...state.clickCentringPoints, {x: action.x, y: action.y} ]})
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
                return {...state, motors: action.data, lightOn: {back: action.data.BackLightSwitch.Status, front: action.data.FrontLightSwitch.Status}, zoom: action.data.Zoom.position };
            }
        case 'SAVE_MOTOR_POSITION':
            {
                return {...state, motors: {...state.motors, [action.name] : {position: action.value}} };
            }
        case 'SET_LIGHT':
            {
                return {...state, lightOn: {...state.lightOn, [action.name]: action.on} };
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
        case 'SET_APERTURE':
            {
                return {...state, currentAperture: action.size };
            }
        case 'SET_CURRENT_PHASE':
            {
                return {...state, currentPhase: action.phase };
            }
        case 'MOUNT_SAMPLE':
            {
                return {...state, points: {} };
            }
        case 'UNMOUNT_SAMPLE':
            {
                return {...state, points: {} };
            }
        case 'SET_STEP_SIZE':
            {
                return {...state, motorSteps: {...state.motorSteps, [action.name]: action.value }};
            }
        case 'SET_INITIAL_STATUS':
            {
                return {...state, 
                    motors: action.data.Motors, 
                    lightOn: {back: action.data.Motors.BackLightSwitch.Status, front: action.data.Motors.FrontLightSwitch.Status}, 
                    zoom: action.data.Motors.Zoom.position,
                    width: action.data.Camera.imageWidth, 
                    height: action.data.Camera.imageHeight, 
                    pixelsPerMm: action.data.Camera.pixelsPerMm[0],
                    apertureList : action.data.beamInfo.apertureList,
                    currentAperture : action.data.beamInfo.currentAperture

                };
            }

        default:
            return state;
    }
}
