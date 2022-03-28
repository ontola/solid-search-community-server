import {getLoggerFor, ResourceStore, ResourceIdentifier, Initializer, Guarded} from '@solid/community-server';
import type { EventEmitter } from 'events';
import fetch from 'node-fetch';
import { Readable } from 'stream';

const SUPPORTED_CONTENT_TYPE = "text/turtle";

/**
 * Sends turtle files to the Search indexer endpoint whenever a resource is updated, which allows for full-text search.
 */
 export class SearchListener extends Initializer {
  private readonly logger = getLoggerFor(this);
  private readonly store: ResourceStore;
  private readonly endpoint: string = "http://0.0.0.0:9883/search";

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


    try {
      const repr = await this.store.getRepresentation(changed, {} );
      if (repr.metadata.contentType !== SUPPORTED_CONTENT_TYPE) {
        return;
      };
      const turtleStream = repr.data;
      const reqBody = await streamToString(turtleStream);

      const response = await fetch(this.endpoint, {
        method: "POST",
        body: reqBody,
        headers: {
          "Content-Type": "text/turtle"
        }
      });

      if (response.status !== 200) {
        throw new Error("Solid-Search Server did not accept turtle" + response.status + "\n" +  await response.text());
      }
    } catch (e) {
      this.logger.error(`Failed to post resource to search endpoint: ${e}`);
    }

  }

  public async handle(): Promise<void> {
    // Nothing needed here, but method required implementation
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
