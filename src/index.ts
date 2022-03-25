import {getLoggerFor, ResourceStore, ResourceIdentifier} from '@solid/community-server';
import type { EventEmitter } from 'events';
import fetch from 'node-fetch';

/**
 * Sends turtle files to the Search indexer endpoint whenever a resource is updated, which allows for full-text search.
 */
 export class SearchListener {
  private readonly logger = getLoggerFor(this);

  public constructor(source: EventEmitter, store: ResourceStore, searchEndpoint: string) {
    // Every time a resource is changed, post to the Solid-Search instance
    source.on('changed', async(changed: ResourceIdentifier): Promise<void> => {
      const turtleStream = (await store.getRepresentation(changed, { type: { 'text/turtle': 1 } })).data;

      const response = await fetch(searchEndpoint, {
        method: "POST",
        body: turtleStream,
      });

      if (response.status !== 200) {
        this.logger.error(`Failed to post resource to search endpoint: ${response.status}`);
      }
    });
  }
}
