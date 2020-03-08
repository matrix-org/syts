# SyTS

It's SyTest. In Typescript.

## Running

You need to have a Synapse/Dendrite running first. Then:

```
$ docker build -t syts .
$ docker run --rm -e "HS1_URL=http://localhost:8008" syts
```

*If you're running on a Mac, use* `http://host.docker.internal:8008`

If you don't want to run in Docker, look at the Dockerfile for the canonical build pre-requisites/installation instructions. The gist of it is:

```
$ yarn install
$ HS1_URL=http://localhost:8008 yarn test
```

### Development

- `yarn` is the package manager.
- `prettier` is the automatic code formatter (configure your IDE to format on save, look at `package.json` for the rules).

## Roadmap
- Implement test framework
- Implement dependent test framework
- Implement variable sharing
- Port tests over
- Implement synapse/dendrite bootstrapping (probably as docker images with docker-compose?)
- Implement parallelisation e.g `-j4` for 4x servers and `i%4` for test allocation (after satisfying dependencies)

Desirable features:
- Parallelisation for speed (run multiple servers)
- Ability to run an individual test/suite


### Parity with SyTest

SyTest has around 815 tests, and this part of the README tracks progress parity.

```
tests/10apidoc/01register.pl:
tests/10apidoc/01request-encoding.pl:
tests/10apidoc/02login.pl:
tests/10apidoc/03events-initial.pl:
tests/10apidoc/04version.pl:
tests/10apidoc/10profile-displayname.pl:
tests/10apidoc/11profile-avatar_url.pl:
tests/10apidoc/12device_management.pl:
tests/10apidoc/20presence.pl:
tests/10apidoc/30room-create.pl:
tests/10apidoc/31room-state.pl:
tests/10apidoc/32room-alias.pl:
tests/10apidoc/33room-members.pl:
tests/10apidoc/34room-messages.pl:
tests/10apidoc/35room-typing.pl:
tests/10apidoc/36room-levels.pl:
tests/10apidoc/37room-receipts.pl:
tests/10apidoc/38room-read-marker.pl:
tests/10apidoc/40content.pl:
tests/10apidoc/45server-capabilities.pl:
tests/11register.pl:
tests/12login/01threepid-and-password.pl:
tests/12login/02cas.pl:
tests/13logout.pl:
tests/14account/01change-password.pl:
tests/14account/02deactivate.pl:
tests/21presence-events.pl:
tests/30rooms/01state.pl:
tests/30rooms/02members-local.pl:
tests/30rooms/03members-remote.pl:
tests/30rooms/04messages.pl:
tests/30rooms/05aliases.pl:
tests/30rooms/06invite.pl:
tests/30rooms/07ban.pl:
tests/30rooms/08levels.pl:
tests/30rooms/09eventstream.pl:
tests/30rooms/10redactions.pl:
tests/30rooms/11leaving.pl:
tests/30rooms/12thirdpartyinvite.pl:
tests/30rooms/13guestaccess.pl:
tests/30rooms/14override-per-room.pl:
tests/30rooms/15kick.pl:
tests/30rooms/20typing.pl:
tests/30rooms/21receipts.pl:
tests/30rooms/22profile.pl:
tests/30rooms/30history-visibility.pl:
tests/30rooms/31forget.pl:
tests/30rooms/32erasure.pl:
tests/30rooms/40joinedapis.pl:
tests/30rooms/50context.pl:
tests/30rooms/51event.pl:
tests/30rooms/52members.pl:
tests/30rooms/60version_upgrade.pl:
tests/30rooms/70publicroomslist.pl:
tests/31sync/01filter.pl:
tests/31sync/02sync.pl:
tests/31sync/03joined.pl:
tests/31sync/04timeline.pl:
tests/31sync/05presence.pl:
tests/31sync/06state.pl:
tests/31sync/07invited.pl:
tests/31sync/08polling.pl:
tests/31sync/09archived.pl:
tests/31sync/10archived-ban.pl:
tests/31sync/11typing.pl:
tests/31sync/12receipts.pl:
tests/31sync/13filtered_sync.pl:
tests/31sync/14read-markers.pl:
tests/31sync/15lazy-members.pl:
tests/31sync/16room-summary.pl:
tests/32room-versions.pl:
tests/40presence.pl:
tests/41end-to-end-keys/01-upload-key.pl:
tests/41end-to-end-keys/03-one-time-keys.pl:
tests/41end-to-end-keys/04-query-key-federation.pl:
tests/41end-to-end-keys/05-one-time-key-federation.pl:
tests/41end-to-end-keys/06-device-lists.pl:
tests/41end-to-end-keys/07-backup.pl:
tests/41end-to-end-keys/08-cross-signing.pl:
tests/42tags.pl:
tests/43search.pl:
tests/44account_data.pl:
tests/45openid.pl:
tests/46direct/01directmessage.pl:
tests/46direct/02reliability.pl:
tests/46direct/03polling.pl:
tests/46direct/04federation.pl:
tests/46direct/05wildcard.pl:
tests/48admin.pl:
tests/49ignore.pl:
tests/50federation/00prepare.pl:
tests/50federation/01keys.pl:
tests/50federation/02server-names.pl:
tests/50federation/10query-profile.pl:
tests/50federation/11query-directory.pl:
tests/50federation/30room-join.pl:
tests/50federation/31room-send.pl:
tests/50federation/32room-getevent.pl:
tests/50federation/33room-get-missing-events.pl:
tests/50federation/34room-backfill.pl:
tests/50federation/35room-invite.pl:
tests/50federation/36state.pl:
tests/50federation/37public-rooms.pl:
tests/50federation/38receipts.pl:
tests/50federation/39redactions.pl:
tests/50federation/40devicelists.pl:
tests/50federation/40publicroomlist.pl:
tests/50federation/41power-levels.pl:
tests/50federation/42query-auth.pl:
tests/50federation/43typing.pl:
tests/50federation/50no-deextrem-outliers.pl:
tests/50federation/50server-acl-endpoints.pl:
tests/50federation/51transactions.pl:
tests/50federation/52soft-fail.pl:
tests/51media/01unicode.pl:
tests/51media/02nofilename.pl:
tests/51media/03ascii.pl:
tests/51media/10thumbnail.pl:
tests/51media/20urlpreview.pl:
tests/51media/30config.pl:
tests/51media/48admin-quarantine.pl:
tests/52user-directory/01public.pl:
tests/52user-directory/02private.pl:
tests/53groups/01create.pl:
tests/53groups/02read.pl:
tests/53groups/03local.pl:
tests/53groups/04remote-group.pl:
tests/53groups/05categories.pl:
tests/53groups/05roles.pl:
tests/53groups/06summaries.pl:
tests/53groups/10sync.pl:
tests/53groups/11publicise.pl:
tests/53groups/12joinable.pl:
tests/53groups/20room-upgrade.pl:
tests/54identity.pl:
tests/60app-services/01as-create.pl:
tests/60app-services/02ghost.pl:
tests/60app-services/03passive.pl:
tests/60app-services/04asuser.pl:
tests/60app-services/05lookup3pe.pl:
tests/60app-services/06publicroomlist.pl:
tests/60app-services/07deactivate.pl:
tests/61push/01message-pushed.pl:
tests/61push/02add_rules.pl:
tests/61push/03_unread_count.pl:
tests/61push/05_set_actions.pl:
tests/61push/06_get_pusher.pl:
tests/61push/06_push_rules_in_sync.pl:
tests/61push/07_set_enabled.pl:
tests/61push/08_rejected_pushers.pl:
tests/61push/09_notifications_api.pl:
tests/61push/80torture.pl:
tests/80torture/03events.pl:
tests/80torture/10filters.pl:
tests/90jira/SYN-115.pl:
tests/90jira/SYN-202.pl:
tests/90jira/SYN-205.pl:
tests/90jira/SYN-328.pl:
tests/90jira/SYN-343.pl:
tests/90jira/SYN-390.pl:
tests/90jira/SYN-442.pl:
tests/90jira/SYN-516.pl:
tests/90jira/SYN-606.pl:
tests/90jira/SYN-627.pl:
```

## Rationale and Architecture

Having a comprehensive black box test suite for Homeservers is tremendously valuable for the Matrix ecosystem. Ideally, every feature/bugfix would feature a test or two in said test suite to give people confidence in merging new PRs. However, not many people in the ecosystem are comfortable writing Perl, which puts up a huge barrier to entry for new contributors. This project aims to fix this by rewriting the codebase in Typescript, which is far more accessible and has the benefit of static typing. This will be a tremendous aid for Synapse and Dendrite work.

The architecture for this project is as follows:
 - SyTS just points to a URL and is told which numbered tests to run. It doesn't know how to spin up homeservers and doesn't know how to parallelise. You can point it at localhost and tell it to run all the tests and that will work just fine. Alternatively, you can just tell it to run a single test and it'll know how to do that with dependencies on other tests. The idea is that this will be used by individuals who want to run a new test they are working on.
 - paraSyTS is the distributed form of SyTS, and also has a delightful pronunciation. It knows how to spin up homeservers and SyTS instances. It has a configurable amount of parallelisation (e.g make style `-j4`) and will try to optimise load across these servers. It knows how to aggregate responses into a full report. The idea is that CI will run this, with major speed savings on beefier boxes.
