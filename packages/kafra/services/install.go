package services

import (
	"log"
	"os"
	"os/exec"
	"packages/kafra/settings"
)

type InstallerService struct {
	config settings.Config
	logger settings.FileLogger
}

func NewInstallerService(config settings.Config) *InstallerService {
	return &InstallerService{
		config: config,
		logger: settings.NewFileLogger(config),
	}
}

func (i *InstallerService) Run() {
	i.logger.Write("Installing...")

	if !isRoot() {
		i.logger.Write("This script must be run as root. Please use 'sudo' or switch to the root user.")
		log.Fatal("This script must be run as root. Please use 'sudo' or switch to the root user.")
	}

	checkAndInstall("git", "git")
	checkAndInstall("build-essential", "build-essential")
	checkAndInstall("libcurl4-openssl-dev", "libcurl4-openssl-dev")
	checkAndInstall("libjansson-dev", "libjansson-dev")
	checkAndInstall("tmux", "tmux")

	i.cloneRepo()
	i.changeOwnership()
	i.buildNssHttp()
	i.installNssHttp()
	i.updateNsswitchConf()
	i.updateSshdConfig()
	i.updatePamSshd()
	i.createSudoersGroup()
	i.configureSudoersFile()
	i.restartSshd()
}

func isRoot() bool {
	return os.Geteuid() == 0
}

func checkAndInstall(pkgName, cmdName string) {
	if _, err := exec.LookPath(cmdName); err != nil {
		log.Printf("%s is not installed. Installing %s...", pkgName, pkgName)
		exec.Command("sudo", "apt", "update").Run()
		exec.Command("sudo", "apt", "install", "-y", pkgName).Run()
		log.Printf("%s installed!", pkgName)
	} else {
		log.Printf("%s is already installed!", pkgName)
	}
}

func (i *InstallerService) cloneRepo() {
	targetDir := "/usr/local/src/nss_http"
	repoUrl := "https://github.com/gmjosack/nss_http.git"
	exec.Command("sudo", "mkdir", "-p", targetDir).Run()
	exec.Command("sudo", "git", "clone", repoUrl, targetDir).Run()
	log.Println("Repository cloned!")
}

func (i *InstallerService) changeOwnership() {
	targetDir := "/usr/local/src/nss_http"
	user := os.Getenv("USER")
	exec.Command("sudo", "chown", "-R", user+":"+user, targetDir).Run()
	log.Println("Ownership changed!")
}

func (i *InstallerService) buildNssHttp() {
	targetDir := "/usr/local/src/nss_http/libnss_http"
	cmd := exec.Command("make")
	cmd.Dir = targetDir
	cmd.Run()
	log.Println("Build complete!")
}

func (i *InstallerService) installNssHttp() {
	targetDir := "/usr/local/src/nss_http/libnss_http"
	cmd := exec.Command("sudo", "make", "install")
	cmd.Dir = targetDir
	cmd.Run()
	log.Println("Installation complete!")
}

func (i *InstallerService) updateNsswitchConf() {
	backupFile("/etc/nsswitch.conf")
	exec.Command("sudo", "sh", "-c", `sed -i.bak 's/^shadow:.*/# &\nshadow:         files http/' /etc/nsswitch.conf`).Run()
	exec.Command("sudo", "sh", "-c", `sed -i.bak 's/^group:.*/# &\ngroup:          files systemd http/' /etc/nsswitch.conf`).Run()
	exec.Command("sudo", "sh", "-c", `sed -i.bak 's/^passwd:.*/# &\npasswd:         files systemd http/' /etc/nsswitch.conf`).Run()
	log.Println("nsswitch.conf updated!")
}

func (i *InstallerService) updateSshdConfig() {
	backupFile("/etc/ssh/sshd_config")
	exec.Command("sudo", "sed", "-i", `'/^AllowUsers /d'`, "/etc/ssh/sshd_config").Run()
	exec.Command("sudo", "sed", "-i", `'/^PasswordAuthentication /d'`, "/etc/ssh/sshd_config").Run()
	exec.Command("sudo", "sed", "-i", `'/^AuthenticationMethods /d'`, "/etc/ssh/sshd_config").Run()
	exec.Command("sudo", "sed", "-i", `'/^ChallengeResponseAuthentication /d'`, "/etc/ssh/sshd_config").Run()
	exec.Command("sudo", "sed", "-i", `'/^AuthorizedKeysCommand /d'`, "/etc/ssh/sshd_config").Run()
	exec.Command("sudo", "sed", "-i", `'/^AuthorizedKeysCommandUser /d'`, "/etc/ssh/sshd_config").Run()
	exec.Command("sudo", "sh", "-c", `echo "AllowUsers *\nPasswordAuthentication no\nAuthenticationMethods publickey\nChallengeResponseAuthentication no\nAuthorizedKeysCommand /usr/local/bin/kafra portal access %t %k %u\nAuthorizedKeysCommandUser root" | sudo tee -a /etc/ssh/sshd_config`).Run()
	log.Println("sshd_config updated!")
}

func (i *InstallerService) updatePamSshd() {
	backupFile("/etc/pam.d/sshd")
	exec.Command("sudo", "sh", "-c", `sed -i '/pam_permit.so\|pam_unix.so\|pam_mkhomedir.so/d' /etc/pam.d/sshd`).Run()
	exec.Command("sudo", "sh", "-c", `sed -i '1i account     sufficient  pam_permit.so\naccount     required    pam_unix.so\nsession     required    pam_mkhomedir.so' /etc/pam.d/sshd`).Run()
	exec.Command("sudo", "sh", "-c", "if ! grep -q 'pam_exec.so.*kafra' /etc/pam.d/sshd; then echo 'session     optional    pam_exec.so seteuid /usr/local/bin/kafra session process' | tee -a /etc/pam.d/sshd; else echo '⚪ Session processor already exists in /etc/pam.d/sshd'; fi").Run()
	log.Println("/etc/pam.d/sshd updated!")
}

func (i *InstallerService) createSudoersGroup() {
	groupName := "warp-admins"
	if _, err := exec.Command("getent", "group", groupName).Output(); err != nil {
		exec.Command("groupadd", groupName).Run()
		log.Printf("Group %s created!", groupName)
	} else {
		log.Printf("Group %s already exists.", groupName)
	}
}

func (i *InstallerService) configureSudoersFile() {
	sudoersFile := "/etc/sudoers.d/warp"
	content := "%warp-admins ALL=(ALL) NOPASSWD: ALL"
	os.WriteFile(sudoersFile, []byte(content), 0440)
	log.Println("Sudoers file configured!")
}

func (i *InstallerService) restartSshd() {
	exec.Command("sudo", "systemctl", "restart", "sshd").Run()
	log.Println("sshd restarted!")
}

func backupFile(filePath string) {
	backupPath := filePath + ".bak"
	exec.Command("sudo", "cp", filePath, backupPath).Run()
}
