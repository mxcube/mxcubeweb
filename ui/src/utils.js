export function getSampleName(sample) {
  const { sampleName, proteinAcronym } = sample;
  return `${proteinAcronym ? `${proteinAcronym} - ` : ''}${sampleName}`;
}
