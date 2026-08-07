import {defineLive} from 'next-sanity/live'
import {client} from './client'
import {env} from './env'

export const {sanityFetch, SanityLive} = defineLive({
  client: client.withConfig({
    apiVersion: env.apiVersion,
  }),
  serverToken: env.readToken,
  browserToken: env.readToken,
})
