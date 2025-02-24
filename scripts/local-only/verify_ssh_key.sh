#!/bin/bash
set -e

LOG_FILE="/var/log/verify_ssh_cert.log"
KEY_TYPE="$1"   # The type of key (e.g., ssh-rsa-cert-v01@openssh.com)
CERT="$2"       # The actual certificate key material
USER="$3"       # The username trying to authenticate
TRUSTED_CA="/etc/ssh/trusted_ca.pub"
TEMP_CERT="/tmp/ssh_cert_$USER.pub"

# Log received input
echo "$(date) - Called for user: $USER, Key type: $KEY_TYPE" >> "$LOG_FILE"
echo "$(date) - Raw received certificate: \"$CERT\"" >> "$LOG_FILE"

# Construct the full certificate including the user as the third argument
FULL_CERT="$KEY_TYPE $CERT"

# Ensure the certificate starts with a valid SSH certificate prefix
if [[ ! "$FULL_CERT" =~ ^ssh-.*-cert-v01@openssh.com ]]; then
    echo "$(date) - ERROR: Certificate does not start with 'ssh-*-cert-v01@openssh.com'" >> "$LOG_FILE"
    exit 1
fi

# Write the certificate to a temp file
echo "$FULL_CERT" > "$TEMP_CERT"

# Log the reconstructed certificate
echo "$(date) - Temporary certificate file content for $USER:" >> "$LOG_FILE"
cat "$TEMP_CERT" >> "$LOG_FILE"

# Check if it's a valid SSH certificate
if ! ssh-keygen -L -f "$TEMP_CERT" > /dev/null 2>&1; then
    echo "$(date) - ERROR: Invalid certificate format for $USER" >> "$LOG_FILE"
    rm -f "$TEMP_CERT"
    exit 1
fi

# Verify the certificate is signed by the trusted CA
CERT_CA_FINGERPRINT=$(ssh-keygen -L -f "$TEMP_CERT" | grep "Signing CA" | awk '{print $4}')
TRUSTED_CA_FINGERPRINT=$(ssh-keygen -lf "$TRUSTED_CA" | awk '{print $2}')

if [ "$CERT_CA_FINGERPRINT" == "$TRUSTED_CA_FINGERPRINT" ]; then
    echo "$(date) - Certificate is valid and signed by the trusted CA" >> "$LOG_FILE"
    # Output valid certificate to stdout
    echo "cert-authority $(cat "$TRUSTED_CA")"
    rm -f "$TEMP_CERT"
else
    echo "$(date) - ERROR: Certificate NOT signed by trusted CA" >> "$LOG_FILE"
    rm -f "$TEMP_CERT"
fi

exit 0