package services

import (
	"fmt"
	"os"
	"os/exec"
	"time"
)

func getEnvironment(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		fmt.Printf("Environment variable %s not set, using fallback value %s\n", key, fallback)
		return fallback
	}
	return value
}

func execCommand(command []string) error {
	cmd := exec.Command(command[0], command[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

var PronteraUrl = getEnvironment("PRONTERA_URL", "http://localhost:3333")

func writeToLogs(content string) error {
	logFile := getEnvironment("LOG_FILE_PATH", "/var/log/kafra.log")
	// create the file and directory if they don't exist
	logDir := logFile[:len(logFile)-len("kafra.log")]
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return fmt.Errorf("error creating directory: %w", err)
	}
	// open the file in append mode
	file, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("error opening file: %w", err)
	}
	defer file.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")

	entry := fmt.Sprintf("%s: %s", timestamp, content)
	if _, err := file.WriteString(entry); err != nil {
		return fmt.Errorf("error writing to file: %w", err)
	}
	// add a newline at the end
	if _, err := file.WriteString("\n"); err != nil {
		return fmt.Errorf("error writing newline to file: %w", err)
	}
	// flush the file
	if err := file.Sync(); err != nil {
		return fmt.Errorf("error flushing file: %w", err)
	}

	return nil
}
