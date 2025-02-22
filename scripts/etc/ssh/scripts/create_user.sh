#!/bin/bash
echo "PAM executing for user: $PAM_USER" >> /var/log/pam_create_user.log

USER=$PAM_USER
MIN_UID=60001

# Find the next available UID >= 60001
NEW_UID=$(awk -F: -v min_uid=$MIN_UID '
    BEGIN { for (i = min_uid; i < 65536; i++) uid_map[i] = 0 } 
    { if ($3 >= min_uid) uid_map[$3] = 1 } 
    END { 
        for (i = min_uid; i < 65536; i++) 
            if (uid_map[i] == 0) { print i; exit } 
    }
' /etc/passwd)

echo "Creating user: $USER with UID: $NEW_UID"

if ! id "$USER" &>/dev/null; then
    useradd -m -u "$NEW_UID" -s /bin/bash "$USER"
    mkdir -p "/home/$USER/.ssh"
    chown -R "$USER:$USER" "/home/$USER"
fi
