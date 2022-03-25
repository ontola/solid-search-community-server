# Solid Search for Community Solid Server

This is an extension / plugin for the Community Solid Server.
It adds full-text search to the Community Solid Server.

## Usage

First, run Atomic-Server, which is the back-end that powers the search.
You can do this using Docker (or a [bunch of other ways](https://github.com/joepio/atomic-data-rust/tree/master/server#installation--getting-started)).

Make sure you pass the `--rdf-search` flag.
Check out more information in the [readme](https://github.com/joepio/atomic-data-rust/blob/master/server/rdf-search.md).

### Run search back-end using docker

```sh
# Docker one-liner
docker run --platform linux/amd64 -p 80:80 -p 443:443 -v atomic-storage:/atomic-storage joepmeneer/atomic-server --rdf-search
```

### Run Community Solid Server with this config

```sh
# Make sure the community server is installed globally
npm install -g @solid/community-server
# Run the server using the included config
npm run start
# Post a resource to your solid pod
curl -X PUT -H "Content-Type: text/turtle"  -d '<http://example.com/test> <ex:p> "testme".'  http://localhost:3000/myfile.ttl
# Or post directly
curl -X POST -H "Content-Type: text/turtle"  -d '<http://example.com/test> <ex:p> "testme".'   http://localhost:9883/search
# query atomic-server
curl -H "Accept: application/json" "http://localhost:9883/search?q=testme"
```

## Building locally

```
npm i
npm run build
```

## Publish new version to NPM

```sh
# Update `package.json` version
npm i
npm run build
npm publish
```

## Limitations

- Only searches inside individual triples, not at resource level
- Does not support named graphs or blank nodes
- No authorization / authentication included
