# IPFS Pinning Aggregation

## Status

This repository is in a **frozen** state. It is not being maintained or kept in sync with the tools and libraries it builds on. This package has now been largely integrated into <https://github.com/ceramicnetwork/js-ceramic> and is being maintained there. Even though work on this repository has been **shelved**, anyone interested in updating or maintaining this as a stand-alone project should express their interest on one Filecoin community conversation mediums: <https://github.com/filecoin-project/community#join-the-community>.

---

This suite provides a way to aggregate multiple pinning services, like they are one.
It includes vanilla IPFS node pinning, as well as pinning to Filecoin via Powergate.

## Context and problem statement

We wanted to add additional backend for pinning to [Ceramic network node](https://github.com/ceramicnetwork/js-ceramic), namely on Filecoin through Powergate.

We want to:

- use IPFS pinnning or Filecoin pinning separately or simultaneously,
- select particular pinning backend via runtime configuration.

## Semantics

### Functions

Every pinning backend is expected to provide these functions:

1. pin record by its CID,
2. remove pin by its CID.

### Multiple pinning backends

Having multiple pinning backends simultaneously leads to distributed transactions, if done thoroughly. We have following expectations:

- 90% of the time, one only uses one pinning backend,
- pinning is an idempotent operation,
- if one uses multiple pinning backends simultaneously, the node _must_ `pin` on all the backends, yet it treats `unpin` operation on best effort basis.

Thus, instead of distributed transactions, we can use light-weight Promises.

## Components

Based on the semantics, it makes sense to have:

1. pure pinning backends - responsible for pinning records,
2. pinning backends aggregator - responsible for pinning records using multiple pinning backends simultaneously,

To add a new pinning backend, one should create class implementing `IPinning` interface, that conforms to `IPinningStatic`, and add it to a list of available backends.

## Configuration

### API

We want to achieve common way of configuring different pinning backends, that should work for CLI as command-line parameter, as well as for environment variable. For backends it should contain host-port of the used service endpoint, as well as additional authentication information. Considered YAML/JSON configuration file and URL Connection string. The latter seems to fit the bill without introducing a heavy indirection layer.

Connection string is formed as valid URL, for example:

```
ipfs+https://example.com:3342
powergate+http://example.com:4001
```

Every pinning backend is assigned a unique string that we call _designator_ below. `PinningAggregation` gets a protocol component of connection strings passed, gets the first part of it before an optional plus (`+`) symbol, and treats it as a designator for a backend.
For the examples above, designator searched is `ipfs`. Rest of the connection string is parsed by particular backend.

**IPFS.** Connection string looks like `ipfs+http://<host>:<port>` or `ipfs+https://<host>:<port>`. It is translated into `http://<host>:<port>`, `https://<host>:<port>` correspondingly.
Here there is a special hostname `__context` used, which commands the pinning backend to use IPFS connection provided in `IContext`.

**Powergate.** Powergate requires token for authentication purposes. We pass it as a query param. Connection string looks like `powergate+http://<host>:<port>?token=<token>` or `powergate+https://<host>:<port>?token=<token>`. It is translated into `http://<host>:<port>`, `https://<host>:<port>` correspondingly, and set the token passed.

## Usage

First, decide what pinning backends you intend to use, then add the packages as a dependency:

```
pnpm add @pinning-aggregation/aggregation
pnpm add @pinning-aggregation/ipfs-pinning // For IPFS backend
pnpm add @pinning-aggregation/powergate-pinning // For Powergate backend
```

Then instantiate `PinningAggregation`. We anticipate some applications already having IPFS connection, so we provide it in a context parameter.

```typescript
import {
  PinningAggregation,
  UnknownPinningService,
} from "@pinning-aggregation/aggregation";
import { IpfsPinning } from "@pinning-aggregation/ipfs-pinning";
import { PowergatePinning } from "@pinning-aggregation/powergate-pinning";

const context = {
  ipfs: EXISTING_IPFS_CONNECTION, // May be null or undefined
};
const pinning = await PinningAggregation.build(context, [
  "ipfs+context",
  "ipfs+https://example.com:3342",
  "powergate+http://example.com:4001?token=something-special",
  [IpfsPinning, PowergatePinning],
]);
await pinning.open(); // Must call open before doing anything
await pinning.pin(new CID("QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D"));
await pinning.close(); // Must call on application shutdown
```

This would use 3 pinning instances:

- vanilla IPFS provided in `context` variable,
- vanilla IPFS located at `https://example.com:3342`,
- Powergate located at `http://example.com:4001`, with authentication token `something-special`.

### Ancillary methods

In addition to `pin` and `unpin` functionality, the package provides list of pins per backend (`#ls`) and backend info (`#info`).
An aggregation that contains single Powergate backend would output like below:

```
{
    "powergate@wRVpk643xlIc86w608VW7JvXeezzoDG1dLqEtGNHoYo=": {
        "id": "321ff612-85a8-46c4-93b6-86e97964ce45",
        "defaultStorageConfig": {
            "hot": {
                "enabled": true,
                "allowUnfreeze": false
            },
            "cold": {
                "enabled": true,
                "filecoin": {
                    "repFactor": 1,
                    "dealMinDuration": 518400,
                    "excludedMinersList": [],
                    "trustedMinersList": [],
                    "countryCodesList": [],
                    "renew": {
                        "enabled": false,
                        "threshold": 0
                    },
                    "addr": "t3rndyswpparggro2ome2b2j4rrpkg3yh4gpfpe426vneangwooprjor44dbwti2omsd7vkcb2lt6fcwpdt6sq",
                    "maxPrice": 0
                }
            },
            "repairable": false
        },
        "balancesList": [
            {
                "addr": {
                    "name": "Initial Address",
                    "addr": "t3rndyswpparggro2ome2b2j4rrpkg3yh4gpfpe426vneangwooprjor44dbwti2omsd7vkcb2lt6fcwpdt6sq",
                    "type": "bls"
                },
                "balance": 3999802806680231
            }
        ]
    }
}
```

Here `powergate@wRVpk643xlIc86w608VW7JvXeezzoDG1dLqEtGNHoYo=` is a unique backend id,
that is constructed as `designator@base64url(sha256(connectionString))`.

## License

This work is dual-licensed under Apache 2.0 and MIT.
You can choose between one of them if you use this work.

`SPDX-License-Identifier: Apache-2.0 OR MIT`
