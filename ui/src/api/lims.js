import api from './api';

const endpoint = api.url('/lims');

export function fetchLimsSamples(lims) {
  return endpoint
    .get(`/lims_samples?lims=${encodeURIComponent(lims)}`)
    .safeJson();
}

export function fetchLimsResults(qid) {
  return endpoint.post({ qid }, '/results').safeJson();
}

export function sendSelectProposal(number) {
  return endpoint.post({ proposal_number: number }, '/proposal').res();
}

export function fetchSamplesList() {
  return endpoint.get('/samples_list').safeJson();
}
