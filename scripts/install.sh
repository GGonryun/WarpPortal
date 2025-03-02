#!/bin/bash

set -e  # Exit immediately if a command fails

REPO_URL="https://github.com/gmjosack/nss_http.git"
TARGET_DIR=/usr/local/src/nss_http
KAFRA_PATH=/usr/local/bin/kafra
LOG_FILE_PATH=/var/log/kafra.log
SUDO_GROUP_NAME=warp-admins
SUDOERS_FILE="/etc/sudoers.d/warp"




echo "🔍 Checking if the script is run as root..."
if [ "$(id -u)" -ne 0 ]; then
    echo "❌ This script must be run as root. Please use 'sudo' or switch to the root user."
    exit 1
fi
echo "✅ Running as root!"

echo "🔍 Checking if git is installed..."
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Installing git..."
    sudo apt update
    sudo apt install -y git
    echo "✅ Git installed!"
else
    echo "✅ Git is already installed!"
fi
echo "🔍 Checking if build-essential is installed..."
if ! dpkg -l | grep -q build-essential; then
    echo "❌ build-essential is not installed. Installing build-essential..."
    sudo apt update
    sudo apt install -y build-essential
    echo "✅ build-essential installed!"
else
    echo "✅ build-essential is already installed!"
fi
echo "🔍 Checking if libcurl4-openssl-dev is installed..."
if ! dpkg -l | grep -q libcurl4-openssl-dev; then
    echo "❌ libcurl4-openssl-dev is not installed. Installing libcurl4-openssl-dev..."
    sudo apt update
    sudo apt install -y libcurl4-openssl-dev
    echo "✅ libcurl4-openssl-dev installed!"
else
    echo "✅ libcurl4-openssl-dev is already installed!"
fi
echo "🔍 Checking if libjansson-dev is installed..."
if ! dpkg -l | grep -q libjansson-dev; then
    echo "❌ libjansson-dev is not installed. Installing libjansson-dev..."
    sudo apt update
    sudo apt install -y libjansson-dev
    echo "✅ libjansson-dev installed!"
else
    echo "✅ libjansson-dev is already installed!"
fi

# installing tmux
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux is not installed. Installing tmux..."
    sudo apt update
    sudo apt install -y tmux
    echo "✅ tmux installed!"
else
    echo "✅ tmux is already installed!"
fi

echo "🌱 Cloning repository into $TARGET_DIR..."
# Ensure the target directory exists
sudo mkdir -p "$TARGET_DIR"
sudo git clone "$REPO_URL" "$TARGET_DIR"
cd "$TARGET_DIR"
echo "✅ Repository cloned!"

echo "🔑 Changing ownership of $TARGET_DIR to $USER..."
sudo chown -R "$USER":"$USER" "$TARGET_DIR"
cd libnss_http
echo "✅ Ownership changed!"

echo "⚙️ Building nss_http..."
make
echo "✅ Build complete!"

echo "🚀 Installing nss_http..."
sudo make install
echo "✅ Installation complete! 🎉"

cd ~

echo "🔧 Updating nsswitch.conf for custom module..."
sudo sed -i.bak 's/^passwd:.*/# &\npasswd:         files systemd http/' /etc/nsswitch.conf
sudo sed -i.bak 's/^group:.*/# &\ngroup:          files systemd http/' /etc/nsswitch.conf
sudo sed -i.bak 's/^shadow:.*/# &\nshadow:         files http/' /etc/nsswitch.conf
echo "✅ nsswitch.conf updated!"

echo "🔧 Updating sshd_config..."
# Remove existing occurrences of the settings to avoid duplicates
sudo sed -i '/^AllowUsers /d' /etc/ssh/sshd_config
sudo sed -i '/^PasswordAuthentication /d' /etc/ssh/sshd_config
sudo sed -i '/^AuthenticationMethods /d' /etc/ssh/sshd_config
sudo sed -i '/^ChallengeResponseAuthentication /d' /etc/ssh/sshd_config
sudo sed -i '/^AuthorizedKeysCommand /d' /etc/ssh/sshd_config
sudo sed -i '/^AuthorizedKeysCommandUser /d' /etc/ssh/sshd_config
# Append new settings at the end of the file
echo -e "AllowUsers *\nPasswordAuthentication no\nAuthenticationMethods publickey\nChallengeResponseAuthentication no\nAuthorizedKeysCommand $KAFRA_PATH %t %k %u\nAuthorizedKeysCommandUser root" | sudo tee -a /etc/ssh/sshd_config
echo "✅ sshd_config updated!"

echo "🔧 Updating /etc/pam.d/sshd..."
# Adds support for finding users through custom NSS module
sudo sed -i '/pam_permit.so\|pam_unix.so\|pam_mkhomedir.so/d' /etc/pam.d/sshd
sudo sed -i '1i account     sufficient  pam_permit.so\naccount     required    pam_unix.so\nsession     required    pam_mkhomedir.so' /etc/pam.d/sshd
# Set up session processor
if ! grep -q 'pam_exec.so.*kafra' /etc/pam.d/sshd; then
    echo "session     optional    pam_exec.so seteuid $KAFRA_PATH session process" | sudo tee -a /etc/pam.d/sshd
else
    echo "⚪ Session processor already exists in /etc/pam.d/sshd"
fi
echo "✅ /etc/pam.d/sshd updated!"

# Create the sudoer's group if it doesn't exist
echo "🔧 Creating sudoer's group: $SUDO_GROUP_NAME..."
if ! getent group "$SUDO_GROUP_NAME" > /dev/null; then
  groupadd "$SUDO_GROUP_NAME"
  echo "✅ Group $SUDO_GROUP_NAME created!"
else
  echo "✅ Group $SUDO_GROUP_NAME already exists."
fi

#configure sudoers file
echo "🔧 Configuring sudoers file: $SUDOERS_FILE..."
sudo tee "$SUDOERS_FILE" > /dev/null << EOF
# Allow members of the warp-admins group to execute commands without a password
%warp-admins ALL=(ALL) NOPASSWD: ALL
EOF
sudo chmod 440 "$SUDOERS_FILE"

echo "🔄 Restarting sshd..."
sudo systemctl restart sshd
echo "✅ sshd restarted!"
