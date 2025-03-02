ssh-keygen -t rsa -b 4096 -f miguel -C "miguel"
ssh-keygen -s warp-ca -I miguel -n miguel-campos -V +1h -z 1 miguel.pub
ssh -i miguel -o CertificateFile=miguel-cert.pub miguel@W.X.Y.Z
