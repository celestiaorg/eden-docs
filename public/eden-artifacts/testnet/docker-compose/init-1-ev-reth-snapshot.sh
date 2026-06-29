#!/bin/bash
# Fail on any error
set -e

# Fail on any error in a pipeline
set -o pipefail

# Fail when using undeclared variables
set -u

# Source shared logging utility
log() {
	level="$1"
	message="$2"
	timestamp=$(date '+%Y-%m-%d %H:%M:%S')

	echo "📝 [${timestamp}] ${level}: ${message}"
}

EV_RETH_DATA_PATH=/root/reth
BASE_URL=https://fsn1.your-objectstorage.com/6774130f-22e6-9d15-1103-96c8ec9b555b/private/testnet

if [[ ! -f ${EV_RETH_DATA_PATH}/_created_by_init_script ]]; then
	apk add --no-cache lz4

	log "INIT" "Starting ev-reth snapshot download and configuration (Init Container 2)"

	log "INFO" "Fetching snapshot information"
	snapshot_metadata="${BASE_URL}/index.html"
	log "DOWNLOAD" "Fetching snapshot metadata from: ${snapshot_metadata}"

	if ! response=$(curl -fsSL "${snapshot_metadata}" 2>/dev/null); then
		log "ERROR" "Failed to fetch snapshot information from ${snapshot_metadata}"
		exit 1
	fi
	log "SUCCESS" "Snapshot metadata fetched successfully"

	# Extract snapshot name using jq
	log "INFO" "Parsing snapshot information"
	if ! snapshot_name=$(echo "${response}" | grep -o 'href="[^"]*ev-reth-fullnode-data[^"]*\.tar\.lz4' | cut -d'"' -f2); then
		log "ERROR" "Failed to parse JSON response with jq"
		exit 1
	fi

	if [[ -z ${snapshot_name} || ${snapshot_name} == "null" ]]; then
		log "ERROR" "Snapshot name not found in response"
		exit 1
	fi

	log "SUCCESS" "Found snapshot: ${snapshot_name}"

	# Download snapshot using curl
	log "DOWNLOAD" "Downloading snapshot from: ${BASE_URL}/${snapshot_name}"
	log "INFO" "This may take several minutes depending on your connection speed..."

	if ! curl -fL --progress-bar -o /tmp/ev-reth-snap.tar.lz4 "${BASE_URL}/${snapshot_name}"; then
		log "ERROR" "Failed to download snapshot from ${BASE_URL}/${snapshot_name}"
		exit 1
	fi
	log "SUCCESS" "Snapshot downloaded successfully to /tmp/ev-reth-snap.tar.lz4"

	log "INFO" "Extracting snapshot archive"
	# Use lz4 to decompress and pipe to tar (BusyBox compatible)
	if ! lz4 -dc /tmp/ev-reth-snap.tar.lz4 | tar -xvf - --strip-components=1 -C "${EV_RETH_DATA_PATH}"; then
		log "ERROR" "Failed to extract snapshot archive"
		exit 1
	fi
	log "SUCCESS" "Snapshot extracted successfully"

	log "INFO" "Cleaning up temporary files"
	rm /tmp/ev-reth-snap.tar.lz4
	log "SUCCESS" "Temporary files cleaned up"

	log "SUCCESS" "Init container 2 completed"
	touch "${EV_RETH_DATA_PATH}/_created_by_init_script"

fi
