export const env = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? '',
  apiVersion: '2026-08-07',
  readToken: process.env.SANITY_API_READ_TOKEN ?? '',
}
