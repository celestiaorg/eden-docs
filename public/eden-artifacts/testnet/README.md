# Eden Testnet Full Node Deployment

This guide describes how to run a full node for the Eden Testnet. There are two methods available: restoring from a database snapshot or syncing from genesis.

## Prerequisites

- Docker and Docker Compose installed
- Access to a Celestia light node (Mocha) RPC

---

## Method 1: Restoration from snapshots (recommended)

This method restores the node from database snapshots for faster synchronization.
Snapshots will be automatically fetched from Binary Builders Storage during the init-container execution.

### Steps:

#### a) Configure Celestia Connection

Edit the `docker-compose/.env` file and set `DA_ADDRESS` to the address of your Celestia light node RPC:

```bash
DA_ADDRESS=http://your-celestia-node:26658
```

#### b) Start and Synchronize

Start the `ev-node` and wait for synchronization to the latest block:

```bash
cd docker-compose
docker compose up -d
docker compose logs -f ev-node
```

## Method 2: Sync from Genesis (not supported)

> **Warning:** Genesis sync for testnet is a two-phase process due to a Celestia namespace migration
> at block **2217057**. Phase 1 requires pre-migration DA namespace values that are not currently
> documented. Use snapshot restore (Method 1) instead.

This method syncs the node from the beginning of the blockchain.

### Steps:

#### a) Configure Celestia Connection

Edit the `docker-compose/.env` file and set `DA_ADDRESS` to the address of your Celestia light node RPC:

```bash
DA_ADDRESS=http://your-celestia-node:26658
```

#### b) Remove the snapshot download steps

Remove `init-1-snapshot-ev-reth` and `init-2-snapshot-ev-node` services from the docker compose file.

#### c) Start the Docker Compose Stack

Run the Docker Compose stack:

```bash
cd docker-compose
docker compose up -d
```

#### d) Wait for Initial Sync (Phase 1)

Set the pre-migration namespace values in `.env` (contact the Eden team for these values), then
monitor the logs and wait for `ev-node` to sync to block **2217057**:

```bash
docker compose logs -f ev-node
```

#### e) Update Namespace Configuration (Phase 2)

Once synced to block 2217057, stop the services:

```bash
docker compose down
```

Modify the `.env` file with the post-migration namespace values:

```bash
DA_HEADER_NAMESPACE=eden_testnet_header
DA_DATA_NAMESPACE=eden_testnet_data
```

#### f) Resume Synchronization

Start the `ev-node` again and wait for synchronization to the latest block:

```bash
docker compose up -d
docker compose logs -f ev-node
```

---

## Monitoring

To monitor your node's progress:

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f ev-node
docker compose logs -f ev-reth
```
