package services

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/user"
	"packages/kafra/settings"
	"strings"
)

type SessionService struct {
	config settings.Config
	logger settings.FileLogger
}

func NewSessionService(config settings.Config) *SessionService {
	return &SessionService{
		config: config,
		logger: settings.NewFileLogger(config),
	}
}

func (p *SessionService) Run(command string) {
	switch command {
	case "process":
		p.processSession()
	default:
		fmt.Printf("Unknown command for Portal Processor: %s", command)
	}
}

func (p *SessionService) processSession() {
	log.Println("SessionProcessor started")
	// Get PAM environment variables
	pamType := os.Getenv("PAM_TYPE")
	pamUser := os.Getenv("PAM_USER")
	pamRhost := os.Getenv("PAM_RHOST")

	// Ensure required variables exist
	if pamUser == "" || pamRhost == "" || pamType == "" {
		log.Fatalf("Missing PAM environment variables")
	}

	if pamType == "open_session" {
		err := p.startSession(pamUser, pamRhost)
		if err != nil {
			p.logger.Write(fmt.Sprintf("Error starting session: %v", err))
			cmd := exec.Command("/usr/bin/pkill", "-u", pamUser)
			output, err := cmd.CombinedOutput()
			if err != nil {
				p.logger.Write(fmt.Sprintf("Failed to kill user session: %v, output: %s", err, string(output)))
			}
			os.Exit(1)
			return
		}
	} else if pamType == "close_session" {
		err := p.endSession(pamUser, pamRhost)
		if err != nil {
			p.logger.Write(fmt.Sprintf("Error closing session: %v", err))
			os.Exit(1)
			return
		}
	} else {
		p.logger.Write(fmt.Sprintf("Ignoring PAM event type: %s", pamType))
		os.Exit(1) // Ignore other PAM event types
		return
	}

	log.Println("SessionProcessor finished")
	os.Exit(0)
}

func (p *SessionService) startSession(pamUser, pamRhost string) error {
	err := p.logger.Write(fmt.Sprintf("SSH session started for user '%s' from '%s'", pamUser, pamRhost))
	if err != nil {
		return err
	}

	destination, err := os.Hostname()
	if err != nil {
		return fmt.Errorf("failed to get hostname: %v", err)
	}

	resp, err := http.Get(fmt.Sprintf("%s/guild/info?local=%s&destination=%s", p.config.BulletinUrl, pamUser, destination))
	if err != nil {
		return fmt.Errorf("failed to query backend: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("received non-200 response code: %d", resp.StatusCode)
	}

	var userInfo struct {
		Action string `json:"action"`
		Hash   int    `json:"hash"`
		Name   string `json:"name"`
	}

	err = json.NewDecoder(resp.Body).Decode(&userInfo)
	if err != nil {
		return fmt.Errorf("failed to decode response from backend: %v", err)
	}

	if userInfo.Action == "DENY" {
		err = p.logger.Write(fmt.Sprintf("User session killed for '%s' due to DENY action", pamUser))
		if err != nil {
			return fmt.Errorf("failed to write to log: %v", err)
		}
		return fmt.Errorf("access denied for user '%s'", pamUser)
	}

	// Check if user exists in /etc/passwd
	_, err = user.Lookup(pamUser)
	if err != nil && err == user.UnknownUserError(pamUser) {
		// Manually edit /etc/passwd, /etc/group, and /etc/shadow
		passwdEntry := fmt.Sprintf("%s:x:%d:%d:%s:/home/%s:/bin/bash\n", pamUser, userInfo.Hash, userInfo.Hash, userInfo.Name, pamUser)
		groupEntry := fmt.Sprintf("%s:x:%d:\n", pamUser, userInfo.Hash)
		shadowEntry := fmt.Sprintf("%s:!:20148:0:99999:7:::\n", pamUser)

		// Append entries to respective files
		if err := p.appendToFile("/etc/passwd", passwdEntry); err != nil {
			return fmt.Errorf("failed to add user to /etc/passwd: %v", err)
		}
		if err := p.appendToFile("/etc/group", groupEntry); err != nil {
			return fmt.Errorf("failed to add user to /etc/group: %v", err)
		}
		if err := p.appendToFile("/etc/shadow", shadowEntry); err != nil {
			return fmt.Errorf("failed to add user to /etc/shadow: %v", err)
		}

		err = p.logger.Write(fmt.Sprintf("User '%s' added to system", pamUser))
		if err != nil {
			return err
		}
	}

	if userInfo.Action == "SUDO" {
		cmd := exec.Command("/usr/sbin/usermod", "-aG", "warp-admins", pamUser)
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("failed to add user to warp-admins group: %v, output: %s", err, string(output))
		}
		err = p.logger.Write(fmt.Sprintf("User '%s' added to warp-admins group", pamUser))
		if err != nil {
			return err
		}
	}

	err = p.logger.Write(fmt.Sprintf("User '%s' access has been granted", pamUser))
	if err != nil {
		return err
	}

	return nil
}

func (p *SessionService) endSession(pamUser string, pamRhost string) error {
	err := p.logger.Write((fmt.Sprintf("SSH session closed for user '%s' from '%s'", pamUser, pamRhost)))
	if err != nil {
		return err
	}

	// Check if user is a member of the warp-admins group before trying to remove them
	cmd := exec.Command("/usr/bin/getent", "group", "warp-admins")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to get group members: %v, output: %s", err, string(output))
	}

	if !strings.Contains(string(output), pamUser) {
		err = p.logger.Write(fmt.Sprintf("User '%s' is not a member of warp-admins group, skipping removal", pamUser))
		if err != nil {
			return err
		}
		return nil
	}

	// Execute the command to remove the user from the warp-admins group
	cmd = exec.Command("/usr/sbin/deluser", pamUser, "warp-admins")
	output, err = cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to remove user from warp-admins group: %v, output: %s", err, string(output))
	}

	// Save the output of the command to the log file
	err = p.logger.Write(fmt.Sprintf("Output of deluser command: %s", string(output)))
	if err != nil {
		return err
	}

	return nil
}

func (p *SessionService) appendToFile(filename, text string) error {
	f, err := os.OpenFile(filename, os.O_APPEND|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer f.Close()

	if _, err = f.WriteString(text); err != nil {
		return err
	}

	return nil
}
