import api from './api';

const endpoint = api.url('/lims');

export function fetchLimsSamples(lims) {
  return endpoint.post({ lims }, '/synch_samples').safeJson();
}

export function fetchLimsResults(qid) {
  return endpoint.post({ qid }, '/results').safeJson();
}

export function sendSelectProposal(number) {
  return endpoint.post({ proposal_number: number }, '/proposal').res();
}
