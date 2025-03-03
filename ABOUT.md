# Warp Portal

## What is the purpose of this project?

To demonstrate what a secure and scalable authentication system for SSH access to linux servers using certificates would look like.

## What were the primary challenges I faced?

1. How do I ensure that users can only access machines they are authorized to?
2. How do I recognize new users on a system?
3. How do I revoke access to a machine?

## What is my solution?

The solution I came up with is to build a certificate authority and backend service that acts as a:

1. User directory
2. Policy based access control system
3. Certificate authority

Linux servers have a variety of features that we can rely on to make this work. The primary services are:

1. [Name Service Switch (NSS)](https://en.wikipedia.org/wiki/Name_Service_Switch)
2. [Pluggable Authentication Modules (PAM)](https://en.wikipedia.org/wiki/Pluggable_authentication_module)
3. [OpenSSH](https://en.wikipedia.org/wiki/OpenSSH)
4. [Systemd](https://en.wikipedia.org/wiki/Systemd)
5. [AuthorizedKeysCommand](https://scalesec.com/blog/just-in-time-ssh-provisioning/)

## What are the components of the solution?

1. The Bulletin Service - This is a service that runs on the server and is responsible for managing the user directory, policy engine, and authenticating certificates.
2. The Kafra Agent - This is a service that runs on the server and is responsible for managing the NSS, PAM, OpenSSH, and Systemd services.
3. The Warp CLI - This is a service that runs on the client machine and acts as an intermediary between the user and the Bulletin Service.

## How does it work?

1. The Kafra Agent is installed and configured on a target server called a **destination**.
2. The **destination** is registered with the Bulletin Service.
3. The user is registered within the Bulletin Service.
4. A user generates a certificate using `warp certificate generate`
5. A user connects to a destination using `warp ssh <destination>`
6. The Kafra NSS Service is called to resolve the user, if the user exists in the user directory we'll return an /etc/passwd like entry for the user.
7. The Kafra Portal Service is called from OpenSSH's AuthorizedKeysCommand. The certificate is sent back to the Bulletin Service for validation. The Bulletin Service will validate the certificate and check to see if a policy exists granting the user access to the requested destination. The Bulletin service will return the certificate authority's public key if the certificate is valid.
8. The Kafra PAM Service is called (pam.d/sshd) to create the user on the system if the user does not exist and grant them sudo access if a policy exists allowing the user to sudo on the destination.
9. When the user's session ends if the user is a member of the `warp-admin` group the user is removed from the group. This removes the user's sudo access.

## What are the alternative solutions?

1. Key Pairs
2. Smart Certificates

### Key Pairs

This solution leverages the AuthorizedKeysCommand in combination with a custom ssh-agent. When a user request ssh access to a server a key is generated on the server and sent to the user using the ssh-agent which communicates over a unix socket. The user then presents the key to the server which pulls access keys from a central server using AuthorizedKeysCommand. This command will contact a backend service which will verify that the user has a policy granting access to the server and return the access key.

This solution suffers from a key problem.

1. user provisioning must be handled out of band, that means a separate command must be sent to the server to add the user to the system.

### Smart Certificates

This solution utilizes extra fields available in certificates such as critical options to store additional user information. This allows a server to validate user access if the backend service is offline, but a persistent/polling connection would still be required to process user termination, certificate revocation, and user provisioning (although there are ways around this).
