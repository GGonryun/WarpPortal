# Kafra

Kafra is a broader service that manages Warp Portal Hosts. It is responsible for the following:

- proxies [nss_http](https://github.com/gmjosack/nss_http.git) messages to the Warp Portal Directory Service.
- allows for remote execution of stored procedures.
- reports on the status of the system.
- updates the warpportal services.
- revokes user access.
- sends logs to a remote server.
- rotates host certificates.

## Start NSS Proxy

- Before running the NSS Proxy please modify the settings file to your needs.

```bash
kafra nss start
```
