ssh-keygen -t rsa -b 4096 -f bojack -C "bojack"
ssh-keygen -s warp-ca -I bojack -n bojack -V +1h -z 1 bojack.pub
ssh -i bojack -o CertificateFile=bojack-cert.pub bojack@W.X.Y.Z

ssh-keygen -t rsa -b 4096 -f miguel -C "miguel"
ssh-keygen -s warp-ca -I miguel -n miguel -V +1h -z 1 miguel.pub
ssh -i miguel -o CertificateFile=miguel-cert.pub miguel@W.X.Y.Z

ssh-keygen -t rsa -b 4096 -f provisioner -C "provisioner"
ssh-keygen -s warp-ca -I provisioner -n provisioner -V +1h -z 12345 -O force-command="sudo useradd -m miguel; exit" provisioner.pub

# Raw
ssh-keygen -s warp-ca -I provisioner -n provisioner -V +1h -z 1 provisioner.pub

ssh -i provisioner -o CertificateFile=provisioner-cert.pub provisioner@W.X.Y.Z


# Creating the provisioner
## Lock the shell for the provisioner user
sudo useradd -m -s /bin/sh provisioner
## Lock the password for the provisioner user
sudo passwd -l provisioner
## Add the provisioner user to the sudo group
visudo
provisioner ALL=(ALL) NOPASSWD: /usr/sbin/useradd
## Prevent the provisioner from having any ssh keys
sudo rm -rf /home/provisioner/.ssh
## Lockdown in sshd_config
sudo vi /etc/ssh/sshd_config.d/no-provisioner-access.conf
### add the following:
Match User provisioner
    ForceCommand /bin/true  # Exit immediately upon login
    AllowTcpForwarding no
## fix permissions
sudo chown root:root /etc/ssh/sshd_config.d/no-provisioner-access.conf
sudo chmod 644 /etc/ssh/sshd_config.d/no-provisioner-access.conf
## Restart sshd
sudo systemctl restart sshd
