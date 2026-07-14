# Eden Mainnet Full Node Deployment

This guide describes how to run a full node for the Eden Mainnet. There are two methods available: restoring from a database snapshot or syncing from genesis.

## Prerequisites

- Docker and Docker Compose installed
- Access to a Celestia light node (Mainnet) RPC

---

## Synchronization

This node will synchronize blocks by fetching blobs from the Celestia Data Availability layer and from Binary Builders fullnodes.

## Chain Specifications

- **Chain ID**: 714
- **Chain Name**: eden-mainnet
- **Peers** (for ev-reth):
  - `enode://52092f9a86c03664d88c5cfd93f914ccbe4d72ec7fb67103a8038771226e8b92b4502afbabe9b39390e96a4d5e47f963042a1e413f0066fed24ad4ed1e18da39@46.224.9.205:30313`
  - `enode://0d56dff552c795daf4f44594857958f20e8396ac973a3054d716530c9e1b16b0e7c5382720d1511e36736becee9fe68c61dd51fec2ebf5aa989ee8db111c4f9e@77.42.38.230:30313`
- **Peers** (for ev-node):
  - `/ip4/46.224.9.205/tcp/7686/p2p/12D3KooWE3Yjr3Hru3UBbkCuG3aNF15CsjhRZZrB4gtXduZNCNqx`
  - `/ip4/77.42.38.230/tcp/7686/p2p/12D3KooWF7jmMWgxfb6EfGQWVvRbQWiMNU8btqXDuPQQiU9SFySt`

Genesis files from both ev-node and ev-reth are already provided and configured to be ready to use.

---

## Method 1: Restoration from snapshots (recommended)

This method restores the node from database snapshots for faster synchronization.
Snapshots will be automatically fetched from Binary Builders Storage during the init-container execution.

### Steps:

#### a) Configure Celestia Connection

Edit the `.env` file and set `DA_ADDRESS` to the address of your Celestia light node RPC:

```bash
DA_ADDRESS=http://your-celestia-node:26658
```

#### b) Start and Synchronize

Start the stack and wait for synchronization to the latest block:

```bash
docker compose up -d
docker compose logs -f ev-node
```

## Method 2: Sync from Genesis

This method syncs the node from the beginning of the blockchain.

### Steps:

#### a) Configure Celestia Connection

Edit the `.env` file and set `DA_ADDRESS` to the address of your Celestia light node RPC:

```bash
DA_ADDRESS=http://your-celestia-node:26658
```

#### b) Remove the snapshot download steps

Remove `init-1-snapshot-ev-reth` and `init-2-snapshot-ev-node` services from the docker compose file.

#### c) Start the Docker Compose Stack

Run the Docker Compose stack:

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
