## Blueprints

This directory contains a list of YAML files (blueprints) which declares how a homeserver should be set up for an individual test.
These blueprints dictate what the state the server should be in, **before** tests are run. Blueprints can include:
 - creating users.
 - creating rooms.
 - sending events in said rooms.

Critically, no test assertions are done in blueprints. They only exist to pre-configure a server to a known working state. The order of
request execution to the target homeserver is undefined unless they are inside an array in which case the first entry is executed first.

To see what is allowed in a blueprint, check the JSONSchema at `./loader/schema.yaml`. There's a few additional shorthands allowed:
 - References to users must be of the form `@localpart` or `@localpart:hs_name`. If you omit the `hs_name` it'll take the HS name of the enclosing block.

### Usage

ParaSyTS is responsible for executing blueprints and delivering the corresponding HS URLs to each test.