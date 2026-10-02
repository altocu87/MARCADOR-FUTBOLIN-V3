export { directEvidence, rankedForm } from '../src/statistics/competitiveAnalysis'
/** Historic isolated review: production deliberately provides no forecast. */
export const predictionDraft = Object.freeze({ status: 'WAITING_BLOCK03' as const, probability: null, confidence: null,
  message: 'Previsión no activada: análisis descriptivo sin pronósticos.' })
