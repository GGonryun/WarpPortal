Deploy nss http - https://github.com/gmjosack/nss_http
Add to ns config: `vi /etc/nsswitch.conf`

```
passwd:     files http
group:      files http
shadow:     files http
```

Spin up the sample server and have the server communicate with external clients via our API endpoints.
