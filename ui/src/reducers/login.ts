/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type LoginType = 'User' | 'Proposal';

// interfaces describing shape of data coming from API is derived from
// https://github.com/mxcube/mxcubecore/blob/develop/mxcubecore/model/lims_session.py
export interface Lims {
  description: string;
  name: string;
}
export interface Session {
  actual_end_date: string;
  actual_end_time: string;
  actual_start_date: string;
  actual_start_time: string;
  beamline_name: string;
  code: string;
  comments: string | null;
  data_portal_URL: string | null;
  dataset_count: string | null;
  end_date: string;
  end_datetime: string | null;
  end_time: string;
  is_rescheduled: boolean;
  is_scheduled_beamline: boolean;
  is_scheduled_time: boolean;
  logbook_URL: string | null;
  nb_shifts: string;
  number: string;
  proposal_id: string;
  proposal_name: string;
  sample_count: string | null;
  scheduled: string;
  session_id: string;
  start_date: string;
  start_datetime: string;
  start_time: string;
  title: string;
  user_portal_URL: string | null;
  volume: string | null;
}
// derived from mxcubecore/core/models/usermodels.py
interface User {
  currentLoginAt: string;
  email: string | null;
  fullname: string | null;
  isstaff: boolean;
  inControl: boolean;
  ip: string;
  nickname: string | null;
  requestsControl: boolean;
  requestsControlMsg: string | null;
  username: string | null;
}

export interface LoginUnknownSliceState {
  // before first login_info comes in -- login method may be unknown.
  loggedIn: null;
  showProposalsForm: boolean;
}

export interface LoginKnownSliceState {
  loggedIn: false;
  loginType: LoginType;
  sessionRefreshInterval: number;
  showProposalsForm: boolean;
  useSSO: boolean;
}

export interface LoggedInSliceState {
  loggedIn: true;
  beamlineName: string;
  limsName: Lims[];
  loginType: LoginType;
  proposalList: Session[];
  rootPath: string;
  selectedProposal: string;
  selectedProposalID: string;
  sessionRefreshInterval: number;
  showProposalsForm: boolean;
  synchrotronName: string;
  useSSO: boolean;
  user: User;
}

type LoginSliceState =
  | LoginUnknownSliceState
  | LoginKnownSliceState
  | LoggedInSliceState;

type LoginInfoPayload =
  | Omit<LoginKnownSliceState, 'showProposalsForm'>
  | Omit<LoggedInSliceState, 'showProposalsForm'>;

const loginSlice = createSlice({
  name: 'login',
  initialState: (): LoginSliceState => ({
    loggedIn: null,
    showProposalsForm: false,
  }),
  reducers: {
    setLoginInfo(
      state,
      action: PayloadAction<LoginInfoPayload>,
    ): LoginKnownSliceState | LoggedInSliceState {
      return { showProposalsForm: state.showProposalsForm, ...action.payload };
    },
    signOut(state): LoginUnknownSliceState | LoginKnownSliceState {
      if (state.loggedIn === null) {
        return state;
      }

      return {
        loggedIn: false,
        loginType: state.loginType,
        useSSO: state.useSSO,
        showProposalsForm: false,
        sessionRefreshInterval: state.sessionRefreshInterval,
      };
    },
    showProposalsForm(state) {
      if (state.loggedIn === null) {
        return;
      }
      state.showProposalsForm = true;
    },
    hideProposalsForm(state) {
      if (state.loggedIn === null) {
        return;
      }
      state.showProposalsForm = false;
    },
  },
});

export const { setLoginInfo, signOut, showProposalsForm, hideProposalsForm } =
  loginSlice.actions;

export default loginSlice.reducer;
