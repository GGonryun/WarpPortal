package services

import (
	"fmt"
	"log"
	"os"
	"time"
)

const logFile = "/var/log/ssh_session.log"

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

	// Format the log message
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	var logMsg string

	if pamType == "open_session" {
		logMsg = fmt.Sprintf("%s: SSH session started for user '%s' from '%s'\n", timestamp, pamUser, pamRhost)
	} else if pamType == "close_session" {
		logMsg = fmt.Sprintf("%s: SSH session closed for user '%s' from '%s'\n", timestamp, pamUser, pamRhost)
	} else {
		os.Exit(0) // Ignore other PAM event types
	}

	// Append log message to file
	file, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("Error opening log file: %v", err)
	}
	defer file.Close()

	if _, err := file.WriteString(logMsg); err != nil {
		log.Fatalf("Error writing to log file: %v", err)
	}
}
