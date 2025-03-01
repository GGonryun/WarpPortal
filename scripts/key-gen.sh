ssh-keygen -t rsa -b 4096 -f miguel -C "miguel"
ssh-keygen -s warp-ca -I 83f6009e-22f4-46fb-8ef6-ae6b65b17e3f -n miguel-campos -V +1h -z 1234512345 miguel.pub
ssh -i miguel -o CertificateFile=miguel-cert.pub miguel@W.X.Y.Z
