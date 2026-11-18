#!/bin/sh
# Fail on any error
set -e

# Fail when using undeclared variables
set -u

log() {
	level="$1"
	message="$2"
	timestamp=$(date '+%Y-%m-%d %H:%M:%S')

	echo "📝 [${timestamp}] ${level}: ${message}"
}

# Function to extract --home value from arguments
get_home_dir() {
	home_dir="${HOME}/.evm"

	# Parse arguments to find --home
	while [ $# -gt 0 ]; do
		case "$1" in
		--home)
			if [ -n "$2" ]; then
				home_dir="$2"
				break
			fi
			;;
		--home=*)
			home_dir="${1#--home=}"
			break
			;;
		esac
		shift
	done

	echo "${home_dir}"
}

CONFIG_HOME=$(get_home_dir "$@")
log "INFO" "Using config home directory: ${CONFIG_HOME}"

if [ ! -f "${CONFIG_HOME}/config/node_key.json" ]; then
	log "INFO" "Node key not found. Initializing new full node configuration"

	# Build init flags array
	init_flags="--home=${CONFIG_HOME}"

	INIT_COMMAND="evm init ${init_flags}"
	log "INIT" "Initializing full node with command: ${INIT_COMMAND}"
	${INIT_COMMAND}
	log "SUCCESS" "Full node initialization completed"
else
	log "INFO" "Node key already exists. Skipping initialization"
fi
