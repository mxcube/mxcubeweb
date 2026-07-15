import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Types mirror the pydantic models in `mxcubeweb/core/models/configmodels.py`

export interface UIComponent {
  label: string;
  attribute: string;
  role: string | null;
  step: number | null;
  precision: number | null;
  suffix: string | null;
  description: string | null;
  value_type: string | null;
  object_type: string | null;
  format: string | null;
  invert_color_semantics: boolean | null;
  tooltip: string | null;
}

export interface UISection {
  id: string;
  components: UIComponent[];
}

export interface UICameraComponent {
  label: string;
  url: string;
  format: string | null;
  description: string | null;
  width: number | null;
  height: number | null;
}

export interface UIVideoControl {
  id: string;
  show: boolean;
}

export interface UIVideoGridSettings {
  id: 'draw_grid';
  show: boolean;
  show_vspace: boolean;
  show_hspace: boolean;
}

export interface UISampleListViewModes {
  id: 'sample_list_view_modes';
  components: { id: 'table_view' | 'graphical_view'; show: boolean }[];
}

export interface UISessionPicker {
  id: 'session_picker';
  tabs: {
    active: boolean;
    scheduled: boolean;
    other_beamlines: boolean;
    all_sessions: boolean;
  };
}

export interface UIProperties {
  beamline_setup: UISection;
  sample_view_motors: UISection;
  sample_list_view_modes: UISampleListViewModes;
  session_picker: UISessionPicker;
  sample_view?: UISection;
  camera_setup?: { id: string; components: UICameraComponent[] };
  sample_view_video_controls?: {
    id: string;
    components: (UIVideoGridSettings | UIVideoControl)[];
  };
}

// `null` until the server state arrives via `SET_INITIAL_STATE`
type UiPropertiesSliceState = UIProperties | null;

interface SetInitialStateAction {
  type: 'SET_INITIAL_STATE';
  data: { uiproperties?: UIProperties }; // would be undefined in case of fetch error
}

const uiPropertiesSlice = createSlice({
  name: 'uiproperties',
  initialState: (): UiPropertiesSliceState => null,
  reducers: {
    /* `uiproperties` is a server state so it should ideally not be modified locally.
     * We make an exception here until motor steps can be updated on the server. */
    setMotorStep(
      state,
      action: PayloadAction<{ role: string; value: number }>,
    ) {
      const component = state?.sample_view_motors.components.find(
        (c) => c.role === action.payload.role,
      );

      if (component) {
        component.step = action.payload.value;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      'SET_INITIAL_STATE',
      (state, action: SetInitialStateAction) =>
        action.data.uiproperties ?? state,
    );
  },
});

export const { setMotorStep } = uiPropertiesSlice.actions;

export default uiPropertiesSlice.reducer;
