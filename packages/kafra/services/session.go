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
)

func SessionProcessor(command string) {
	switch command {
	case "process":
		processSession()
	default:
		fmt.Printf("Unknown command for Portal Processor: %s\n", command)
	}
}

func processSession() {
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
		err := startSession(pamUser, pamRhost)
		if err != nil {
			writeToLogs(fmt.Sprintf("Error starting session: %v", err))
			os.Exit(1)
			return
		}
	} else if pamType == "close_session" {
		err := endSession(pamUser, pamRhost)
		if err != nil {
			writeToLogs(fmt.Sprintf("Error closing session: %v", err))
			os.Exit(1)
			return
		}
	} else {
		writeToLogs(fmt.Sprintf("Ignoring PAM event type: %s", pamType))
		os.Exit(1) // Ignore other PAM event types
		return
	}

	log.Println("SessionProcessor finished")
	os.Exit(0)
}

func startSession(pamUser, pamRhost string) error {
	err := writeToLogs(fmt.Sprintf("SSH session started for user '%s' from '%s'\n", pamUser, pamRhost))
	if err != nil {
		return err
	}

	resp, err := http.Get(fmt.Sprintf("%s/guild/info?local=%s", settings.BULLETIN_URL, pamUser))
	if err != nil {
		return fmt.Errorf("failed to query backend: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("received non-200 response code: %d", resp.StatusCode)
	}

	var userInfo struct {
		Action string `json:"action"`
		Hash   string `json:"hash"`
		Name   string `json:"name"`
	}

	err = json.NewDecoder(resp.Body).Decode(&userInfo)
	if err != nil {
		return fmt.Errorf("failed to decode response from backend: %v", err)
	}

	if userInfo.Action == "DENY" {
		cmd := exec.Command("pkill", "-u", pamUser)
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("failed to kill user session: %v, output: %s", err, string(output))
		}
		msg := fmt.Sprintf("User session killed for '%s' due to DENY action", pamUser)
		err = writeToLogs(msg)
		if err != nil {
			return err
		}
		return nil
	}

	// Check if user exists in /etc/passwd
	_, err = user.Lookup(pamUser)
	if err != nil && err == user.UnknownUserError(pamUser) {
		cmd := exec.Command("adduser", "-u", userInfo.Hash, "--gecos", userInfo.Name, "--disabled-password", pamUser)
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("failed to add user: %v, output: %s", err, string(output))
		}
		msg := fmt.Sprintf("User '%s' added to system", pamUser)
		err = writeToLogs(msg)
		if err != nil {
			return err
		}
	}

	if userInfo.Action == "SUDO" {
		cmd := exec.Command("usermod", "-aG", "warp-admins", pamUser)
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("failed to add user to warp-admins group: %v, output: %s", err, string(output))
		}
		msg := fmt.Sprintf("User '%s' added to warp-admins group", pamUser)
		err = writeToLogs(msg)
		if err != nil {
			return err
		}

	} else {
		msg := fmt.Sprintf("User '%s' access has been granted", pamUser)
		err = writeToLogs(msg)
		if err != nil {
			return err
		}
	}

	return nil
}

func endSession(pamUser string, pamRhost string) error {
	err := writeToLogs((fmt.Sprintf("SSH session closed for user '%s' from '%s'\n", pamUser, pamRhost)))
	if err != nil {
		return err
	}

	// Execute the command to remove the user from the warp-admins group
	cmd := exec.Command("deluser", pamUser, "warp-admins")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to remove user from warp-admins group: %v, output: %s", err, string(output))
	}

	// Save the output of the command to the log file
	err = writeToLogs(fmt.Sprintf("Output of deluser command: %s\n", string(output)))
	if err != nil {
		return err
	}

	return nil
}
