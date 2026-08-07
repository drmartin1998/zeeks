import {createClient} from 'next-sanity'
import {env} from './env'

export const client = createClient({
  projectId: env.projectId,
  dataset: env.dataset,
  apiVersion: env.apiVersion,
  useCdn: true,
})
