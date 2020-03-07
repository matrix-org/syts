## Blueprints

This directory contains a list of YAML files which tell SyTS how to set up and configure a given home server **prior** to test execution.
These blueprints dictate what the state the server should be in, **before** tests are run. Blueprints can include:
 - creating users.
 - creating rooms.
 - sending events in said rooms.

Critically, no test assertions are done in blueprints. They only exist to pre-configure a server to a known working state. The order of
request execution to the target homeserver is undefined unless they are inside an array in which case the first entry is executed first.

To see what is allowed in a blueprint, check the JSONSchema at `./loader/schema.yaml`. There's a few additional shorthands allowed:
 - References to users must be of the form `@localpart` or `@localpart:hs_name`. If you omit the `hs_name` it'll take the HS name of the enclosing block.

### Usage

ParaSyTS will execute blueprints in a virgin homeserver container, snapshot them, then tear it down. When tests ask for a given blueprint,
ParaSyTS will spin up that image in a fresh container and inject that container's configuration to the test.