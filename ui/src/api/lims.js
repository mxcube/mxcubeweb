import api from '.';

const endpoint = api.url('/lims');

export function fetchLimsSamples() {
  return endpoint.get('/synch_samples').json();
}

export function fetchLimsResults(qid) {
  return endpoint.post({ qid }, '/results').json();
}

export function sendSelectProposal(number) {
  return endpoint.post({ proposal_number: number }, '/proposal').res();
}
