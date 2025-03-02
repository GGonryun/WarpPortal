package services

import (
	"fmt"
	"log"
	"os"
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

	// Format the log message
	var logMsg string

	if pamType == "open_session" {
		logMsg = fmt.Sprintf("SSH session started for user '%s' from '%s'\n", pamUser, pamRhost)
	} else if pamType == "close_session" {
		logMsg = fmt.Sprintf("SSH session closed for user '%s' from '%s'\n", pamUser, pamRhost)
	} else {
		os.Exit(0) // Ignore other PAM event types
	}

	// Append log message to file
	err := writeToLogs(logMsg)
	if err != nil {
		log.Fatalf("Error writing to logs: %v", err)
	}
	log.Println("SessionProcessor completed")
	os.Exit(1)
}
