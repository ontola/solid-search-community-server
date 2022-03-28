import {getLoggerFor, ResourceStore, ResourceIdentifier, Initializer} from '@solid/community-server';
import type { EventEmitter } from 'events';
import fetch from 'node-fetch';

/**
 * Sends turtle files to the Search indexer endpoint whenever a resource is updated, which allows for full-text search.
 */
 export class SearchListener extends Initializer {
  private readonly logger = getLoggerFor(this);
  private readonly store: ResourceStore;
  private readonly endpoint: string = "http://localhost:9883/search";

  public constructor(source: EventEmitter, store: ResourceStore, searchEndpoint: string) {
    super();
    this.store = store;

    if (searchEndpoint) {this.endpoint = searchEndpoint};

    // NOTE: this is currently not called, something is wrong with registration / initialization of the SearchListener
    console.log('SearchListener constructor');

    // Every time a resource is changed, post to the Solid-Search instance
    source.on('changed', async(changed: ResourceIdentifier): Promise<void> => {
      this.postChanges(changed);
    });
  }

  /** Sends the new state of the Resource to the Search back-end */
  async postChanges(changed: ResourceIdentifier): Promise<void> {
    console.log("Posting to search endpoint...");

    const turtleStream = (await this.store.getRepresentation(changed, { type: { 'text/turtle': 1 } })).data;

    const response = await fetch(this.endpoint, {
      method: "POST",
      body: turtleStream,
      headers: {
        "Content-Type": "text/turtle"
      }
    });

    if (response.status !== 200) {
      this.logger.error(`Failed to post resource to search endpoint: ${response.status}`);
    }
    console.log("Posted, response:", response);
  }

  public async handle(): Promise<void> {
    console.log("SearchListener handle");
  }
}
