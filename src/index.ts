import {getLoggerFor, ResourceStore, ResourceIdentifier, Initializer, Guarded} from '@solid/community-server';
import type { EventEmitter } from 'events';
import fetch from 'node-fetch';
import { Readable } from 'stream';

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

    // Every time a resource is changed, post to the Solid-Search instance
    source.on('changed', async(changed: ResourceIdentifier): Promise<void> => {
      this.postChanges(changed);
    });
  }

  /** Sends the new state of the Resource to the Search back-end */
  async postChanges(changed: ResourceIdentifier): Promise<void> {

    console.log("Posting to search endpoint!?...", this.endpoint, changed.path);

    const repr = await this.store.getRepresentation(changed, { type: { 'text/turtle': 1 } });
    const turtleStream = repr.data;


    console.log('turtle streamie', repr.data);
    const reqBody = await streamToString(turtleStream);
    console.log('reqBody', reqBody);

    const response = await fetch(this.endpoint, {
      method: "POST",
      body: reqBody,
      headers: {
        "Content-Type": "text/turtle"
      }
    });

    if (response.status !== 200) {
      this.logger.error(`Failed to post resource to search endpoint: ${response.status}`);
    }
    console.log("Posted, response:", await response.text());
  }

  public async handle(): Promise<void> {
  }
}

async function streamToString (stream: Guarded<Readable>): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}
